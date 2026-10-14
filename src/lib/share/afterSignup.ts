// Where to go once a new person has signed up and finished onboarding - e.g.
// the shared post that asked them to sign up (client, 2026-10-14; plan
// Phase 9). Login's ?next= covers sign-in; this also survives the sign-up ->
// confirm email -> onboarding detour. Same-browser only, kept for a day.

import { safeNextPath } from './safeNext';

const KEY = 'fz-after-signup';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function rememberNextAfterSignup(path: string) {
  const safe = safeNextPath(path);
  if (!safe) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ path: safe, at: Date.now() }));
  } catch {
    /* storage blocked - ?next= still covers sign-in */
  }
}

/** The remembered path (once - it's cleared), or null. */
export function takeNextAfterSignup(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    localStorage.removeItem(KEY);
    const { path, at } = JSON.parse(raw) as { path?: string; at?: number };
    if (typeof at !== 'number' || Date.now() - at > MAX_AGE_MS) return null;
    return safeNextPath(path);
  } catch {
    return null;
  }
}
