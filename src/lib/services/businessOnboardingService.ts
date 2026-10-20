/**
 * BUSINESS ONBOARDING - the food business screens B-01 to B-09 (client spec
 * v1; docs/ONBOARDING_PLAN.md): category, details, locations, operations,
 * reservations / loyalty / delivery answers, documents, review.
 * Writes restaurant_profiles (public profile), business_private (contact),
 * business_branches (every location; the main one is copied onto the profile
 * by the database) and users.display_name (the business name). The database
 * rules are in supabase/migrations/20261018000000_onboarding.sql.
 */

import { createClient } from '@/lib/supabase/client';
import type { ServiceResult } from '@/lib/types/serviceResult';
import type { BusinessCategory } from '@/lib/onboarding/policy';
import type { WeeklyHours } from '@/lib/restaurant/hours';
import { DOCUMENT_MAX_BYTES, DOCUMENT_TYPES, type DeliveryStatus, type DocumentKind, type VerificationStatus } from '@/lib/onboarding/policy';

export interface BusinessDocument {
  id: string;
  type: DocumentKind;
  fileName: string;
  status: 'submitted' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface BusinessStatus {
  status: VerificationStatus;
  deadlineAt: string;
  reviewerNote: string | null;
}

export interface BranchInput {
  id?: string;
  name: string;
  isMain: boolean;
  kind: 'address' | 'service_area' | 'mobile';
  address: string | null;
  serviceArea: string | null;
  lat: number | null;
  lng: number | null;
  addressPublic: boolean;
  /** Google place of this location, if picked from search. */
  placeId?: string | null;
  placeName?: string | null;
}

export interface BusinessProfile {
  category: BusinessCategory | null;
  name: string;
  website: string;
  phone: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  cuisines: string[];
  services: string[];
  priceTier: string | null;
  operations: Record<string, unknown>;
  hours: WeeklyHours;
  placeId: string | null;
  branches: BranchInput[];
  /** B-05 / B-06: null = not answered yet. */
  reservationsExisting: boolean | null;
  reservationsWantsFuzo: boolean | null;
  loyaltyExisting: boolean | null;
  loyaltyWantsFuzo: boolean | null;
  deliveryStatus: DeliveryStatus | null;
}

const fail = (message?: string): ServiceResult => ({
  success: false,
  error: /business_category|operations|business_private|business_branches|schema cache|does not exist/i.test(message ?? '') ? 'needs_update' : 'failed',
});
const now = () => new Date().toISOString();

async function me() {
  const supabase = createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

export const BusinessOnboardingService = {
  async load(): Promise<ServiceResult<BusinessProfile>> {
    const m = await me();
    if (!m) return { success: false, error: 'signed_out' };
    const { supabase, user } = m;
    const [u, rp, priv, br] = await Promise.all([
      supabase.from('users').select('display_name').eq('id', user.id).maybeSingle(),
      supabase
        .from('restaurant_profiles')
        .select('business_category, website, phone, cuisines, services, price_tier, operations, hours, place_id, reservations_existing, reservations_wants_fuzo, loyalty_existing, loyalty_wants_fuzo, delivery_status')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase.from('business_private').select('contact_name, contact_email, contact_phone').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('business_branches')
        .select('id, name, is_main, location_kind, address, service_area, lat, lng, address_public')
        .eq('business_id', user.id)
        .order('is_main', { ascending: false })
        .order('position'),
    ]);
    const err = u.error ?? rp.error ?? priv.error ?? br.error;
    if (err) return fail(err.message) as ServiceResult<BusinessProfile>;
    const p = rp.data;
    return {
      success: true,
      data: {
        category: (p?.business_category as BusinessCategory | null) ?? null,
        name: u.data?.display_name ?? '',
        website: p?.website ?? '',
        phone: p?.phone ?? '',
        contactName: priv.data?.contact_name ?? '',
        contactEmail: priv.data?.contact_email ?? user.email ?? '',
        contactPhone: priv.data?.contact_phone ?? '',
        cuisines: p?.cuisines ?? [],
        services: p?.services ?? [],
        priceTier: p?.price_tier ?? null,
        operations: (p?.operations as Record<string, unknown> | null) ?? {},
        hours: (p?.hours as WeeklyHours | null) ?? {},
        placeId: p?.place_id ?? null,
        reservationsExisting: p?.reservations_existing ?? null,
        reservationsWantsFuzo: p?.reservations_wants_fuzo ?? null,
        loyaltyExisting: p?.loyalty_existing ?? null,
        loyaltyWantsFuzo: p?.loyalty_wants_fuzo ?? null,
        deliveryStatus: (p?.delivery_status as DeliveryStatus | null) ?? null,
        branches: (br.data ?? []).map((b) => ({
          id: b.id,
          name: b.name ?? '',
          isMain: b.is_main,
          kind: b.location_kind,
          address: b.address,
          serviceArea: b.service_area,
          lat: b.lat,
          lng: b.lng,
          addressPublic: b.address_public,
        })),
      },
    };
  },

  /** B-01: creates the public business profile row on first save. */
  async saveCategory(category: BusinessCategory): Promise<ServiceResult> {
    const m = await me();
    if (!m) return { success: false, error: 'signed_out' };
    let timezone = 'UTC';
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      /* keep UTC */
    }
    const { error } = await m.supabase
      .from('restaurant_profiles')
      .upsert({ user_id: m.user.id, business_category: category, timezone, updated_at: now() }, { onConflict: 'user_id' });
    return error ? fail(error.message) : { success: true };
  },

  /** B-02: name (public), website + phone (public), contact person (private). */
  async saveDetails(d: { name: string; website: string | null; phone: string; contactName: string; contactEmail: string; contactPhone: string }): Promise<ServiceResult> {
    const m = await me();
    if (!m) return { success: false, error: 'signed_out' };
    const { supabase, user } = m;
    const [a, b, c] = await Promise.all([
      supabase.from('users').update({ display_name: d.name.trim().slice(0, 80) }).eq('id', user.id),
      supabase
        .from('restaurant_profiles')
        .update({ website: d.website, phone: d.phone.trim().slice(0, 40) || null, updated_at: now() })
        .eq('user_id', user.id),
      supabase.from('business_private').upsert(
        {
          user_id: user.id,
          contact_name: d.contactName.trim().slice(0, 120),
          contact_email: d.contactEmail.trim().slice(0, 200),
          contact_phone: d.contactPhone.trim().slice(0, 40) || null,
          updated_at: now(),
        },
        { onConflict: 'user_id' },
      ),
    ]);
    const err = a.error ?? b.error ?? c.error;
    return err ? fail(err.message) : { success: true };
  },

  /** B-03: replaces the location list (the main one first). */
  async saveBranches(branches: BranchInput[], existingIds: string[]): Promise<ServiceResult> {
    const m = await me();
    if (!m) return { success: false, error: 'signed_out' };
    const { supabase, user } = m;
    const keep = new Set(branches.map((b) => b.id).filter(Boolean) as string[]);
    const gone = existingIds.filter((id) => !keep.has(id));
    if (gone.length) {
      const { error } = await supabase.from('business_branches').delete().in('id', gone);
      if (error) return fail(error.message);
    }
    // The main location goes last, after any old main was demoted, so the
    // one-main-location rule never trips mid-save.
    const ordered = [...branches.map((b, i) => ({ b, i })).filter((x) => !x.b.isMain), ...branches.map((b, i) => ({ b, i })).filter((x) => x.b.isMain)];
    for (const { b, i } of ordered) {
      const row = {
        business_id: user.id,
        name: b.name.trim().slice(0, 120) || null,
        is_main: b.isMain,
        location_kind: b.kind,
        address: b.address?.trim().slice(0, 300) || null,
        service_area: b.serviceArea?.trim().slice(0, 300) || null,
        lat: b.lat,
        lng: b.lng,
        address_public: b.addressPublic,
        position: i,
      };
      const { error } = b.id
        ? await supabase.from('business_branches').update(row).eq('id', b.id)
        : await supabase.from('business_branches').insert(row);
      if (error) return fail(error.message);
    }
    // The main location's Google place links the profile to its Google listing (Scout).
    const main = branches.find((b) => b.isMain);
    if (main?.placeId) {
      await supabase.from('restaurant_profiles').update({ place_id: main.placeId, updated_at: now() }).eq('user_id', user.id);
    }
    return { success: true };
  },

  /** B-05 / B-06 / B-07: answers only - the setup comes after onboarding. */
  async savePreferences(patch: {
    reservationsExisting?: boolean;
    reservationsWantsFuzo?: boolean;
    loyaltyExisting?: boolean;
    loyaltyWantsFuzo?: boolean;
    deliveryStatus?: DeliveryStatus;
  }): Promise<ServiceResult> {
    const m = await me();
    if (!m) return { success: false, error: 'signed_out' };
    const row: Record<string, unknown> = { updated_at: now() };
    if (patch.reservationsExisting !== undefined) row.reservations_existing = patch.reservationsExisting;
    if (patch.reservationsWantsFuzo !== undefined) row.reservations_wants_fuzo = patch.reservationsWantsFuzo;
    if (patch.loyaltyExisting !== undefined) row.loyalty_existing = patch.loyaltyExisting;
    if (patch.loyaltyWantsFuzo !== undefined) row.loyalty_wants_fuzo = patch.loyaltyWantsFuzo;
    if (patch.deliveryStatus !== undefined) row.delivery_status = patch.deliveryStatus;
    const { error } = await m.supabase.from('restaurant_profiles').update(row).eq('user_id', m.user.id);
    return error ? fail(error.message) : { success: true };
  },

  /** B-04: cuisines, services, price, hours and the category's own answers. */
  async saveOperations(o: { cuisines: string[]; services: string[]; priceTier: string | null; operations: Record<string, unknown>; hours: WeeklyHours | null }): Promise<ServiceResult> {
    const m = await me();
    if (!m) return { success: false, error: 'signed_out' };
    const { supabase, user } = m;
    const patch: Record<string, unknown> = {
      cuisines: o.cuisines,
      services: o.services,
      price_tier: o.priceTier,
      operations: o.operations,
      updated_at: now(),
    };
    if (o.hours) patch.hours = o.hours;
    const { error } = await supabase.from('restaurant_profiles').update(patch).eq('user_id', user.id);
    if (error) return fail(error.message);
    // Every location starts with the same hours; they can differ later.
    if (o.hours) {
      const r = await supabase.from('business_branches').update({ hours: o.hours }).eq('business_id', user.id);
      if (r.error) return fail(r.error.message);
    }
    return { success: true };
  },
};

export default BusinessOnboardingService;

/** Re-save a photo of a document as a JPEG (drops hidden EXIF data such as location), keeping it sharp. */
async function cleanImage(file: File): Promise<Blob> {
  try {
    if (typeof createImageBitmap === 'undefined') return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 3000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    return out && out.size <= DOCUMENT_MAX_BYTES ? out : file;
  } catch {
    return file;
  }
}

/** Why a file can't be uploaded, or null if it's fine. */
export function documentProblem(file: File): string | null {
  if (!(DOCUMENT_TYPES as readonly string[]).includes(file.type)) return `${file.name}: use a PDF, JPG or PNG.`;
  if (file.size > DOCUMENT_MAX_BYTES) return `${file.name} is over 10 MB.`;
  if (file.size === 0) return `${file.name} is empty.`;
  return null;
}

export const BusinessDocumentsService = {
  async list(): Promise<BusinessDocument[]> {
    const m = await me();
    if (!m) return [];
    const { data } = await m.supabase
      .from('business_documents')
      .select('id, document_type, file_name, review_status, submitted_at')
      .eq('business_id', m.user.id)
      .order('submitted_at', { ascending: false });
    return (data ?? []).map((d) => ({ id: d.id, type: d.document_type, fileName: d.file_name ?? 'Document', status: d.review_status, submittedAt: d.submitted_at }));
  },

  /** Deadline + status as the owner sees it (the database works out "overdue"). */
  async status(): Promise<BusinessStatus | null> {
    const m = await me();
    if (!m) return null;
    const { data, error } = await m.supabase.rpc('my_business_status');
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) return null;
    return { status: row.status, deadlineAt: row.deadline_at, reviewerNote: row.reviewer_note ?? null };
  },

  /** Upload one document into the private bucket, then record it (which starts the review when it's the registration). */
  async upload(file: File, type: DocumentKind): Promise<ServiceResult<BusinessDocument>> {
    const problem = documentProblem(file);
    if (problem) return { success: false, error: problem };
    const m = await me();
    if (!m) return { success: false, error: 'signed_out' };
    const { supabase, user } = m;
    const body = file.type === 'application/pdf' ? file : await cleanImage(file);
    const mime = body.type || file.type;
    const ext = mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : 'jpg';
    const path = `${user.id}/doc-${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from('business-documents').upload(path, body, { contentType: mime, upsert: false });
    if (up.error) return { success: false, error: /bucket|not found/i.test(up.error.message) ? 'needs_update' : 'upload_failed' };
    const { data, error } = await supabase
      .from('business_documents')
      .insert({ business_id: user.id, document_type: type, storage_path: path, file_name: file.name.slice(0, 200), mime_type: mime, size_bytes: body.size })
      .select('id, submitted_at')
      .single();
    if (error) return fail(error.message) as ServiceResult<BusinessDocument>;
    return { success: true, data: { id: data.id, type, fileName: file.name, status: 'submitted', submittedAt: data.submitted_at } };
  },
};
