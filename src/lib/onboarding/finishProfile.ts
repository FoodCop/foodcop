// "Finish your profile" (client, 2026-10-18: "if someone skips the onboarding
// questions, prompt them to fill them"). What's left after onboarding - the
// optional parts people can skip - and when the reminder pop-up is due
// (1, 3 and 7 days after skipping, at most once a day; then only the card).

import type { OnboardingState } from '@/lib/services/onboardingService';
import { nudgeDue } from './policy';

export type FinishKey = 'food' | 'photo' | 'roles';

export interface FinishItem {
  key: FinishKey;
  label: string;
  /** Shown once done ("Food profile ✓"). */
  doneLabel: string;
  hint: string;
  done: boolean;
}

/** Only individuals who finished onboarding get the card and pop-up. */
export function finishItems(s: OnboardingState): FinishItem[] {
  return [
    {
      key: 'food',
      label: s.foodPrefs === 'in_progress' ? 'Finish your food profile' : 'Build your food profile',
      doneLabel: 'Food profile',
      hint: 'Flavours, cuisines, diet and your Food DNA',
      done: s.foodPrefs === 'completed',
    },
    { key: 'photo', label: 'Add a profile photo', doneLabel: 'Profile photo', hint: 'So friends recognise you', done: !!s.avatarUrl },
    { key: 'roles', label: 'Choose your roles', doneLabel: 'Roles', hint: 'Explorer, reviewer, recipe creator…', done: s.roles.length > 0 },
  ];
}

export function finishSummary(s: OnboardingState | null) {
  if (!s || s.accountType !== 'individual' || !s.isOnboarded) return null;
  const items = finishItems(s);
  const done = items.filter((i) => i.done).length;
  if (done === items.length) return null;
  return { items, done, total: items.length };
}

/** Is the pop-up due now? Counted from when they skipped (or finished onboarding with parts left). */
export function finishPopupDue(s: OnboardingState | null, now = new Date()): boolean {
  if (!finishSummary(s)) return false;
  return nudgeDue(s!.skippedAt ?? s!.completedAt, s!.nudgesShown, s!.lastNudgeAt, now);
}

// The card's × hides it for a week on this device (it comes back until everything's done).
const HIDE_KEY = 'fz-finish-hidden';
const HIDE_MS = 7 * 24 * 60 * 60 * 1000;

export function cardHidden(userId: string): boolean {
  try {
    const raw = localStorage.getItem(HIDE_KEY);
    if (!raw) return false;
    const { id, until } = JSON.parse(raw) as { id?: string; until?: number };
    return id === userId && typeof until === 'number' && Date.now() < until;
  } catch {
    return false;
  }
}

export function hideCard(userId: string) {
  try {
    localStorage.setItem(HIDE_KEY, JSON.stringify({ id: userId, until: Date.now() + HIDE_MS }));
  } catch {
    /* storage blocked: it just shows again */
  }
}
