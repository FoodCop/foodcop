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
  /** Last screen they were on (for optional steps that leave no other trace). */
  savedStep: string | null;
}

/** Screens of the flow, in order. Later phases add the profile + business screens. */
export type OnboardingStep = 'type' | 'age' | 'consent' | 'ready' | 'business';

/** The first thing still missing. */
export function nextStep(s: OnboardingState): OnboardingStep {
  if (!s.accountType) return 'type';
  if (s.accountType === 'individual' && !s.hasBirthDate) return 'age';
  if (!s.termsOk || !s.privacyOk) return 'consent';
  return s.accountType === 'individual' ? 'ready' : 'business';
}

/** Failure codes the screens show their own message for. */
export type OnboardingError = 'too_young' | 'needs_update' | 'signed_out' | 'failed';

function codeOf(message: string | undefined): OnboardingError {
  if (!message) return 'failed';
  if (/not_eligible/.test(message)) return 'too_young';
  // The onboarding migration isn't on this database yet.
  if (/user_private|user_consents|user_onboarding|account_type|does not exist|schema cache/i.test(message)) return 'needs_update';
  return 'failed';
}

const fail = <T,>(message: string | undefined): ServiceResult<T> => ({ success: false, error: codeOf(message) });

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

    const [profile, priv, consents, progress] = await Promise.all([
      supabase.from('users').select('account_type, display_name, is_onboarded').eq('id', user.id).maybeSingle(),
      supabase.from('user_private').select('user_id').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_consents').select('document, version').eq('user_id', user.id),
      supabase.from('user_onboarding').select('step').eq('user_id', user.id).maybeSingle(),
    ]);
    const err = profile.error ?? priv.error ?? consents.error ?? progress.error;
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
        savedStep: progress.data?.step ?? null,
      },
    };
  },

  async setAccountType(type: AccountType): Promise<ServiceResult> {
    const m = await me();
    if (!m) return { success: false, error: 'signed_out' };
    const { supabase, user } = m;
    const { error } = await supabase.from('users').update({ account_type: type }).eq('id', user.id);
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
    await m.supabase.from('user_onboarding').upsert({ user_id: m.user.id, step, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
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
    await supabase
      .from('user_onboarding')
      .upsert({ user_id: user.id, step: 'done', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    await supabase.from('user_stats').upsert({ user_id: user.id }, { onConflict: 'user_id' });
    return { success: true };
  },
};

export default OnboardingService;
