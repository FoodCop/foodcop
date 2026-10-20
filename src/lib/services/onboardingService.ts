/**
 * ONBOARDING - where a signed-in person is in onboarding, and saving each step
 * (docs/ONBOARDING_PLAN.md). Progress is worked out from what the database
 * already holds (account type, birth date, consents...), so onboarding picks
 * up where it stopped after a refresh or on another device. The database
 * re-checks everything (supabase/migrations/20261018000000_onboarding.sql).
 */

import { createClient } from '@/lib/supabase/client';
import type { ServiceResult } from '@/lib/types/serviceResult';
import { PRIVACY_VERSION, TERMS_VERSION, type AccountType } from '@/lib/onboarding/policy';
import type { SignupIntent } from '@/lib/onboarding/intent';
import type { DnaAxis, TasteProfileState } from '@/lib/recommendation/dna';
import { asksReservations } from '@/lib/onboarding/business';

export type FoodPrefsStatus = 'not_started' | 'skipped' | 'in_progress' | 'completed';

/** Free-form progress kept in user_onboarding.data (owner only). */
export interface OnboardingData {
  /** Which personalisation screen they reached (resume). */
  tasteStep?: number;
  /** Food DNA answers so far (saved after each section). */
  dna?: TasteProfileState;
  /** Existing accounts are asked for roles once. */
  rolesAsked?: boolean;
  /** Food business screens done (B-02 details, B-03 locations, B-04 operations). */
  bizDetails?: boolean;
  bizLocations?: boolean;
  bizOps?: boolean;
  /** B-05 to B-08 answered / seen. */
  bizReservations?: boolean;
  bizLoyalty?: boolean;
  bizDelivery?: boolean;
  bizDocs?: boolean;
}

export interface OnboardingState {
  userId: string;
  email: string | null;
  accountType: AccountType | null;
  displayName: string;
  isOnboarded: boolean;
  hasBirthDate: boolean;
  /** Accepted the current Terms / Privacy versions. */
  termsOk: boolean;
  privacyOk: boolean;
  username: string | null;
  avatarUrl: string | null;
  roles: string[];
  foodPrefs: FoodPrefsStatus;
  skippedAt: string | null;
  /** "Finish your profile" pop-ups shown so far, and when the last one was. */
  nudgesShown: number;
  lastNudgeAt: string | null;
  /** When onboarding was finished. */
  completedAt: string | null;
  data: OnboardingData;
  /** Food businesses: the chosen category (B-01), once the business profile exists. */
  businessCategory: string | null;
  /** Last screen they were on. */
  savedStep: string | null;
}

/** Screens of the flow. 'roles' is for existing accounts; 'done' = nothing left. */
export type OnboardingStep =
  | 'type'
  | 'age'
  | 'consent'
  | 'profile'
  | 'roles'
  | 'personalize'
  | 'taste'
  | 'ready'
  | 'category'
  | 'details'
  | 'locations'
  | 'operations'
  | 'reservations'
  | 'loyalty'
  | 'delivery'
  | 'documents'
  | 'review'
  | 'done';

/** The food business screens in order (Back goes through these). */
export const BUSINESS_EDITABLE: OnboardingStep[] = ['category', 'details', 'locations', 'operations', 'reservations', 'loyalty', 'delivery', 'documents', 'review'];

/** The business screens this category sees (table reservations only where people sit down). */
export function businessSteps(category: string | null): OnboardingStep[] {
  return BUSINESS_EDITABLE.filter((st) => st !== 'reservations' || asksReservations(category));
}

/** The first thing still missing. */
export function nextStep(s: OnboardingState): OnboardingStep {
  if (!s.accountType) return 'type';
  if (s.accountType === 'individual' && !s.hasBirthDate) return 'age';
  if (!s.termsOk || !s.privacyOk) return 'consent';
  if (s.accountType === 'food_business') {
    if (s.isOnboarded) return 'done';
    if (!s.businessCategory) return 'category';
    if (!s.data.bizDetails) return 'details';
    if (!s.data.bizLocations) return 'locations';
    if (!s.data.bizOps) return 'operations';
    if (asksReservations(s.businessCategory) && !s.data.bizReservations) return 'reservations';
    if (!s.data.bizLoyalty) return 'loyalty';
    if (!s.data.bizDelivery) return 'delivery';
    if (!s.data.bizDocs) return 'documents';
    return 'review';
  }
  // Existing accounts (client, 2026-10-18): birth date + consent above, then roles once.
  if (s.isOnboarded) return s.roles.length || s.data.rolesAsked ? 'done' : 'roles';
  if (!s.username || !s.displayName.trim()) return 'profile';
  if (s.foodPrefs === 'not_started') return 'personalize';
  if (s.foodPrefs === 'in_progress' && !s.skippedAt) return 'taste';
  return 'ready';
}

/** Failure codes the screens show their own message for. */
export type OnboardingError = 'too_young' | 'needs_update' | 'signed_out' | 'username_taken' | 'username_invalid' | 'failed';

function codeOf(message: string | undefined): OnboardingError {
  if (!message) return 'failed';
  if (/not_eligible/.test(message)) return 'too_young';
  // The onboarding migration isn't on this database yet.
  if (/user_private|user_consents|user_onboarding|account_type|does not exist|schema cache/i.test(message)) return 'needs_update';
  return 'failed';
}

const fail = <T,>(message: string | undefined): ServiceResult<T> => ({ success: false, error: codeOf(message) });
const now = () => new Date().toISOString();

/** The client and the signed-in user, or null. */
async function me() {
  const supabase = createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

export const OnboardingService = {
  async load(): Promise<ServiceResult<OnboardingState>> {
    const m = await me();
    if (!m) return { success: false, error: 'signed_out' };
    const { supabase, user } = m;

    const [profile, priv, consents, progress, business] = await Promise.all([
      supabase.from('users').select('account_type, display_name, is_onboarded, username, avatar_url, roles').eq('id', user.id).maybeSingle(),
      supabase.from('user_private').select('user_id').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_consents').select('document, version').eq('user_id', user.id),
      supabase.from('user_onboarding').select('step, data, food_prefs_status, skipped_at, nudges_shown, last_nudge_at, completed_at').eq('user_id', user.id).maybeSingle(),
      supabase.from('restaurant_profiles').select('business_category').eq('user_id', user.id).maybeSingle(),
    ]);
    const err = profile.error ?? priv.error ?? consents.error ?? progress.error ?? business.error;
    if (err) return fail(err.message);

    const accepted = consents.data ?? [];
    return {
      success: true,
      data: {
        userId: user.id,
        email: user.email ?? null,
        accountType: (profile.data?.account_type as AccountType | null) ?? null,
        displayName: profile.data?.display_name ?? (user.user_metadata?.display_name as string | undefined) ?? '',
        isOnboarded: !!profile.data?.is_onboarded,
        hasBirthDate: !!priv.data,
        termsOk: accepted.some((c) => c.document === 'terms' && c.version === TERMS_VERSION),
        privacyOk: accepted.some((c) => c.document === 'privacy' && c.version === PRIVACY_VERSION),
        username: profile.data?.username ?? null,
        avatarUrl: profile.data?.avatar_url ?? (user.user_metadata?.avatar_url as string | undefined) ?? null,
        roles: (profile.data?.roles as string[] | null) ?? [],
        foodPrefs: (progress.data?.food_prefs_status as FoodPrefsStatus | undefined) ?? 'not_started',
        skippedAt: progress.data?.skipped_at ?? null,
        nudgesShown: progress.data?.nudges_shown ?? 0,
        lastNudgeAt: progress.data?.last_nudge_at ?? null,
        completedAt: progress.data?.completed_at ?? null,
        data: (progress.data?.data as OnboardingData | null) ?? {},
        businessCategory: business.data?.business_category ?? null,
        savedStep: progress.data?.step ?? null,
      },
    };
  },

  async setAccountType(type: AccountType): Promise<ServiceResult> {
    const m = await me();
    if (!m) return { success: false, error: 'signed_out' };
    const { error } = await m.supabase.from('users').update({ account_type: type }).eq('id', m.user.id);
    return error ? fail(error.message) : { success: true };
  },

  async saveBirthDate(month: number, year: number, livesInQuebec: boolean | null): Promise<ServiceResult> {
    const m = await me();
    if (!m) return { success: false, error: 'signed_out' };
    const { error } = await m.supabase
      .from('user_private')
      .insert({ user_id: m.user.id, birth_month: month, birth_year: year, lives_in_quebec: livesInQuebec });
    // Already saved (e.g. a second tab): fine.
    if (error && /duplicate key/i.test(error.message)) return { success: true };
    return error ? fail(error.message) : { success: true };
  },

  async acceptConsents(): Promise<ServiceResult> {
    const m = await me();
    if (!m) return { success: false, error: 'signed_out' };
    const { error } = await m.supabase.from('user_consents').upsert(
      [
        { user_id: m.user.id, document: 'terms', version: TERMS_VERSION },
        { user_id: m.user.id, document: 'privacy', version: PRIVACY_VERSION },
      ],
      { onConflict: 'user_id,document,version', ignoreDuplicates: true },
    );
    return error ? fail(error.message) : { success: true };
  },

  /** Write what was chosen before the account existed; returns the fresh state. */
  async applyIntent(state: OnboardingState, intent: SignupIntent): Promise<ServiceResult<OnboardingState>> {
    if (!state.accountType) {
      const r = await this.setAccountType(intent.accountType);
      if (!r.success) return r as ServiceResult<OnboardingState>;
    }
    const type = state.accountType ?? intent.accountType;
    if (type === 'individual' && !state.hasBirthDate && intent.birthMonth && intent.birthYear) {
      const r = await this.saveBirthDate(intent.birthMonth, intent.birthYear, intent.livesInQuebec ?? null);
      if (!r.success) return r as ServiceResult<OnboardingState>;
    }
    if ((!state.termsOk || !state.privacyOk) && intent.consents?.terms === TERMS_VERSION && intent.consents.privacy === PRIVACY_VERSION) {
      const r = await this.acceptConsents();
      if (!r.success) return r as ServiceResult<OnboardingState>;
    }
    return this.load();
  },

  async saveStep(step: string): Promise<void> {
    const m = await me();
    if (!m) return;
    // Best effort - progress is mostly worked out from the data itself.
    await m.supabase.from('user_onboarding').upsert({ user_id: m.user.id, step, updated_at: now() }, { onConflict: 'user_id' });
  },

  /** Is this username free (and well formed)? Live check while typing; null = couldn't check. */
  async usernameAvailable(username: string): Promise<boolean | null> {
    const supabase = createClient();
    if (!supabase) return null;
    const { data, error } = await supabase.rpc('username_available', { p_username: username });
    return error ? null : !!data;
  },

  /** I-04: name, username, photo, roles. */
  async saveProfile(p: { displayName: string; username: string; roles: string[]; avatarUrl?: string | null }): Promise<ServiceResult> {
    const m = await me();
    if (!m) return { success: false, error: 'signed_out' };
    const patch: Record<string, unknown> = { display_name: p.displayName.trim().slice(0, 80), username: p.username, roles: p.roles };
    if (p.avatarUrl !== undefined) patch.avatar_url = p.avatarUrl;
    const { error } = await m.supabase.from('users').update(patch).eq('id', m.user.id);
    if (error && /duplicate key|username_lower/i.test(error.message)) return { success: false, error: 'username_taken' };
    if (error && /Usernames are/i.test(error.message)) return { success: false, error: 'username_invalid' };
    return error ? fail(error.message) : { success: true };
  },

  /** Existing accounts: their roles (asked once; may be left empty). */
  async saveRoles(roles: string[], data: OnboardingData): Promise<ServiceResult> {
    const m = await me();
    if (!m) return { success: false, error: 'signed_out' };
    const { error } = await m.supabase.from('users').update({ roles }).eq('id', m.user.id);
    if (error) return fail(error.message);
    return this.saveData({ ...data, rolesAsked: true });
  },

  /** Writes user_onboarding.data (callers pass the whole object). */
  async saveData(data: OnboardingData): Promise<ServiceResult> {
    const m = await me();
    if (!m) return { success: false, error: 'signed_out' };
    const { error } = await m.supabase.from('user_onboarding').upsert({ user_id: m.user.id, data, updated_at: now() }, { onConflict: 'user_id' });
    return error ? fail(error.message) : { success: true };
  },

  /** Food profile status; skipping stamps the time (the reminders count from it). */
  async setFoodPrefs(status: FoodPrefsStatus, skipped = false): Promise<ServiceResult> {
    const m = await me();
    if (!m) return { success: false, error: 'signed_out' };
    const row: Record<string, unknown> = { user_id: m.user.id, food_prefs_status: status, updated_at: now() };
    if (skipped) row.skipped_at = now();
    if (status === 'completed' || (status === 'in_progress' && !skipped)) row.skipped_at = null;
    const { error } = await m.supabase.from('user_onboarding').upsert(row, { onConflict: 'user_id' });
    return error ? fail(error.message) : { success: true };
  },

  /** Flavours / cuisines / diet, saved as each screen is left. */
  async saveTaste(patch: { flavors?: string[]; cuisines?: string[]; dietary?: string[] }): Promise<ServiceResult> {
    const m = await me();
    if (!m) return { success: false, error: 'signed_out' };
    const { error } = await m.supabase.from('taste_profiles').upsert({ user_id: m.user.id, ...patch, updated_at: now() }, { onConflict: 'user_id' });
    return error ? fail(error.message) : { success: true };
  },

  async loadTaste(): Promise<{ flavors: string[]; cuisines: string[]; dietary: string[] }> {
    const m = await me();
    if (!m) return { flavors: [], cuisines: [], dietary: [] };
    const { data } = await m.supabase.from('taste_profiles').select('flavors, cuisines, dietary').eq('user_id', m.user.id).maybeSingle();
    return { flavors: data?.flavors ?? [], cuisines: data?.cuisines ?? [], dietary: data?.dietary ?? [] };
  },

  /** The finished Food DNA quiz: scores + persona (read by the profile's Food DNA tab and recommendations). */
  async saveDnaResult(scores: Record<DnaAxis, number>, persona: { emoji: string; title: string; desc: string }): Promise<ServiceResult> {
    const m = await me();
    if (!m) return { success: false, error: 'signed_out' };
    const { error } = await m.supabase.from('taste_profiles').upsert(
      { user_id: m.user.id, dna_scores: scores, result_emoji: persona.emoji, result_title: persona.title, result_desc: persona.desc, updated_at: now() },
      { onConflict: 'user_id' },
    );
    return error ? fail(error.message) : { success: true };
  },

  /** A "Finish your profile" pop-up was shown (counts towards the 3, at most one a day). */
  async markNudgeShown(shownBefore: number): Promise<void> {
    const m = await me();
    if (!m) return;
    await m.supabase
      .from('user_onboarding')
      .upsert({ user_id: m.user.id, nudges_shown: Math.min(20, shownBefore + 1), last_nudge_at: now(), updated_at: now() }, { onConflict: 'user_id' });
  },

  /** Required steps done: mark onboarded (the database checks them again). */
  async finish(displayName?: string): Promise<ServiceResult> {
    const m = await me();
    if (!m) return { success: false, error: 'signed_out' };
    const { supabase, user } = m;
    const patch: Record<string, unknown> = { is_onboarded: true };
    if (displayName?.trim()) patch.display_name = displayName.trim().slice(0, 80);
    const { error } = await supabase.from('users').update(patch).eq('id', user.id);
    if (error) return fail(error.message);
    await supabase.from('user_onboarding').upsert({ user_id: user.id, step: 'done', completed_at: now(), updated_at: now() }, { onConflict: 'user_id' });
    await supabase.from('user_stats').upsert({ user_id: user.id }, { onConflict: 'user_id' });
    return { success: true };
  },
};

export default OnboardingService;
