/**
 * ADMIN VERIFICATION - FUZO admins review food business documents (client
 * spec v1, section 8; docs/ONBOARDING_PLAN.md). Everything here is enforced
 * by the database: only accounts in app_admins can read other businesses'
 * verification rows, private contacts and documents, open the files (short
 * signed links from the private bucket) or call admin_review_business().
 */

import { createClient } from '@/lib/supabase/client';
import type { ServiceResult } from '@/lib/types/serviceResult';
import type { VerificationStatus } from '@/lib/onboarding/policy';

export interface AdminDocument {
  id: string;
  type: 'business_registration' | 'food_safety' | 'other';
  fileName: string;
  path: string;
  mime: string;
  status: 'submitted' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface AdminBusiness {
  id: string;
  name: string;
  username: string | null;
  category: string | null;
  address: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: VerificationStatus;
  accountCreatedAt: string;
  deadlineAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewerNote: string | null;
  documents: AdminDocument[];
}

/** The status an admin sees, including the worked-out "overdue". */
export const effectiveStatus = (stored: string, deadlineAt: string, now = Date.now()): VerificationStatus =>
  stored === 'awaiting_documents' && new Date(deadlineAt).getTime() < now ? 'submission_overdue' : (stored as VerificationStatus);

export const AdminVerificationService = {
  async isAdmin(): Promise<boolean> {
    const supabase = createClient();
    if (!supabase) return false;
    const { data, error } = await supabase.rpc('is_app_admin');
    return !error && data === true;
  },

  async list(): Promise<ServiceResult<AdminBusiness[]>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'failed' };
    const { data: rows, error } = await supabase
      .from('business_verification')
      .select('business_id, status, account_created_at, deadline_at, submitted_at, reviewed_at, reviewer_note')
      .order('submitted_at', { ascending: true, nullsFirst: false })
      .limit(500);
    if (error) return { success: false, error: /does not exist|schema cache/i.test(error.message) ? 'needs_update' : 'failed' };
    const ids = (rows ?? []).map((r) => r.business_id);
    if (!ids.length) return { success: true, data: [] };
    const [users, profiles, contacts, docs] = await Promise.all([
      supabase.from('users').select('id, display_name, username').in('id', ids),
      supabase.from('restaurant_profiles').select('user_id, business_category, address').in('user_id', ids),
      supabase.from('business_private').select('user_id, contact_name, contact_email, contact_phone').in('user_id', ids),
      supabase
        .from('business_documents')
        .select('id, business_id, document_type, file_name, storage_path, mime_type, review_status, submitted_at')
        .in('business_id', ids)
        .order('submitted_at', { ascending: false }),
    ]);
    const by = <T extends Record<string, unknown>>(list: T[] | null, key: keyof T) => new Map((list ?? []).map((x) => [x[key] as string, x]));
    const u = by(users.data, 'id');
    const p = by(profiles.data, 'user_id');
    const c = by(contacts.data, 'user_id');
    return {
      success: true,
      data: (rows ?? []).map((r) => {
        const user = u.get(r.business_id);
        const prof = p.get(r.business_id);
        const contact = c.get(r.business_id);
        return {
          id: r.business_id,
          name: (user?.display_name as string) || (user?.username as string) || 'Unnamed business',
          username: (user?.username as string) ?? null,
          category: (prof?.business_category as string) ?? null,
          address: (prof?.address as string) ?? null,
          contactName: (contact?.contact_name as string) ?? null,
          contactEmail: (contact?.contact_email as string) ?? null,
          contactPhone: (contact?.contact_phone as string) ?? null,
          status: effectiveStatus(r.status, r.deadline_at),
          accountCreatedAt: r.account_created_at,
          deadlineAt: r.deadline_at,
          submittedAt: r.submitted_at,
          reviewedAt: r.reviewed_at,
          reviewerNote: r.reviewer_note,
          documents: (docs.data ?? [])
            .filter((d) => d.business_id === r.business_id)
            .map((d) => ({
              id: d.id,
              type: d.document_type,
              fileName: d.file_name ?? 'Document',
              path: d.storage_path,
              mime: d.mime_type,
              status: d.review_status,
              submittedAt: d.submitted_at,
            })),
        };
      }),
    };
  },

  /** A 5-minute link to a private document (only works for admins and the owner). */
  async openLink(path: string): Promise<string | null> {
    const supabase = createClient();
    if (!supabase) return null;
    const { data, error } = await supabase.storage.from('business-documents').createSignedUrl(path, 300);
    return error ? null : data.signedUrl;
  },

  /** Approve, or ask for changes (a reason is required - the database checks too). */
  async review(businessId: string, approve: boolean, note?: string): Promise<ServiceResult> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'failed' };
    const { error } = await supabase.rpc('admin_review_business', { p_business: businessId, p_approve: approve, p_note: note ?? null });
    if (error) return { success: false, error: /Only FUZO admins/.test(error.message) ? 'not_admin' : /Say what needs to change/.test(error.message) ? 'note_required' : 'failed' };
    return { success: true };
  },
};

export default AdminVerificationService;
