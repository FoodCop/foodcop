/**
 * BUSINESS ONBOARDING - the food business screens B-01 to B-04 (client spec
 * v1; docs/ONBOARDING_PLAN.md): category, details, locations, operations.
 * Writes restaurant_profiles (public profile), business_private (contact),
 * business_branches (every location; the main one is copied onto the profile
 * by the database) and users.display_name (the business name). The database
 * rules are in supabase/migrations/20261018000000_onboarding.sql.
 */

import { createClient } from '@/lib/supabase/client';
import type { ServiceResult } from '@/lib/types/serviceResult';
import type { BusinessCategory } from '@/lib/onboarding/policy';
import type { WeeklyHours } from '@/lib/restaurant/hours';

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
        .select('business_category, website, phone, cuisines, services, price_tier, operations, hours, place_id')
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
