// What someone chose on the sign-up steps BEFORE their account existed
// (account type, birth month/year, consent). The account is created after
// these, and email confirmation or the Google redirect can put minutes and a
// page load in between, so they wait in this browser for a day and are
// written to the database by /onboarding (OnboardingService.applyIntent).
// Signing up on one device and confirming on another just means onboarding
// asks again.

import { AGE_GATE_COOLDOWN_MS, type AccountType } from './policy';

const KEY = 'fz-signup-intent';
const BLOCK_KEY = 'fz-age-gate';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface SignupIntent {
  accountType: AccountType;
  birthMonth?: number;
  birthYear?: number;
  livesInQuebec?: boolean | null;
  /** Versions accepted, e.g. { terms: '2026-10-18', privacy: '2026-10-18' }. */
  consents?: { terms: string; privacy: string };
  at: number;
}

export function saveIntent(intent: Omit<SignupIntent, 'at'>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...intent, at: Date.now() }));
  } catch {
    /* storage blocked: onboarding asks again after sign-up */
  }
}

export function readIntent(): SignupIntent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as SignupIntent;
    if (typeof v.at !== 'number' || Date.now() - v.at > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    if (v.accountType !== 'individual' && v.accountType !== 'food_business') return null;
    return v;
  } catch {
    return null;
  }
}

export function clearIntent() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

// --- Age gate ---------------------------------------------------------------------
// Someone too young waits a day on this device before trying again, so the
// date can't just be changed and retried. Nothing about them is stored.

export function blockAgeGate() {
  try {
    localStorage.setItem(BLOCK_KEY, String(Date.now()));
    localStorage.removeItem(KEY);
  } catch {
    /* storage blocked */
  }
}

export function ageGateBlocked(): boolean {
  try {
    const at = Number(localStorage.getItem(BLOCK_KEY));
    return !!at && Date.now() - at < AGE_GATE_COOLDOWN_MS;
  } catch {
    return false;
  }
}
