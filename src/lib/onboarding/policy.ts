// Onboarding rules shared by the app. They mirror the database
// (supabase/migrations/20261018000000_onboarding.sql) - change both together.
// Plan: docs/ONBOARDING_PLAN.md. Screen IDs (I-01, B-01...) are the client's.

export type AccountType = 'individual' | 'food_business';

const DAY_MS = 24 * 60 * 60 * 1000;

// --- Age (Canada, client 2026-10-18) ------------------------------------------
// OPC: under-13s can't give meaningful consent; Quebec's Law 25 needs a
// parent's consent under 14. FUZO has no parental-consent process, so these
// are minimums. Under-18s get private defaults.
export const MIN_AGE = 13;
export const MIN_AGE_QUEBEC = 14;
export const ADULT_AGE = 18;

/**
 * Whole years from a birth month (1-12) and year. Only the month is known, so a
 * birthday counts from the month after the birth month - the same rule as the
 * database's age_from_birth(), so the app never lets through someone the
 * database will refuse.
 */
export function ageFromBirth(year: number, month: number, on = new Date()): number {
  const months = on.getFullYear() * 12 + (on.getMonth() + 1) - (year * 12 + month) - 1;
  return Math.floor(months / 12);
}

export type AgeCheck = 'ok' | 'ask_quebec' | 'too_young';

/** The age gate: 'ask_quebec' only for someone who is exactly 13. */
export function checkAge(year: number, month: number, livesInQuebec: boolean | null = null, on = new Date()): AgeCheck {
  const age = ageFromBirth(year, month, on);
  if (age < MIN_AGE) return 'too_young';
  if (age < MIN_AGE_QUEBEC) {
    if (livesInQuebec === null) return 'ask_quebec';
    return livesInQuebec ? 'too_young' : 'ok';
  }
  return 'ok';
}

export const isMinor = (year: number, month: number, on = new Date()) => ageFromBirth(year, month, on) < ADULT_AGE;

/** A device that failed the age gate waits a day before trying again (no data is stored). */
export const AGE_GATE_COOLDOWN_MS = DAY_MS;

// --- Consent ----------------------------------------------------------------------
// Bump when the text changes; people accept the new version on next sign-in.
export const TERMS_VERSION = '2026-10-18';
export const PRIVACY_VERSION = '2026-10-18';

// --- Roles (profile labels, several allowed) -----------------------------------------
export const ROLES = [
  { id: 'food_explorer', label: 'Food Explorer' },
  { id: 'food_reviewer', label: 'Food Reviewer' },
  { id: 'food_blogger', label: 'Food Blogger / Creator' },
  { id: 'food_travel_explorer', label: 'Food Travel Explorer' },
  { id: 'recipe_creator', label: 'Recipe Creator' },
  { id: 'cooking_instructor', label: 'Cooking Instructor' },
  { id: 'chef', label: 'Chef / Private Chef / Catering' },
] as const;
export type RoleId = (typeof ROLES)[number]['id'];

// --- Usernames -----------------------------------------------------------------------
export const USERNAME_RE = /^[a-z0-9._]{3,30}$/;

// --- Food business --------------------------------------------------------------------
export const BUSINESS_CATEGORIES = [
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'cafe', label: 'Café' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'food_truck', label: 'Food Truck' },
  { id: 'cloud_kitchen', label: 'Cloud Kitchen' },
  { id: 'catering_company', label: 'Catering Company' },
  { id: 'meal_prep', label: 'Meal Prep' },
  { id: 'specialty_food', label: 'Specialty Food' },
] as const;
export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number]['id'];

/** Where a category is: a fixed address, a service area, or a base + area (trucks). */
export const CATEGORY_LOCATION: Record<BusinessCategory, 'address' | 'service_area' | 'mobile'> = {
  restaurant: 'address',
  cafe: 'address',
  bakery: 'address',
  food_truck: 'mobile',
  cloud_kitchen: 'service_area',
  catering_company: 'service_area',
  meal_prep: 'service_area',
  specialty_food: 'address',
};

export type ServiceChoice = 'existing' | 'fuzo' | 'both' | 'neither';

/** Reservations / loyalty answers are stored as two yes/no columns. */
export function serviceToColumns(choice: ServiceChoice): { existing: boolean; wantsFuzo: boolean } {
  return { existing: choice === 'existing' || choice === 'both', wantsFuzo: choice === 'fuzo' || choice === 'both' };
}
export function columnsToService(existing: boolean | null, wantsFuzo: boolean | null): ServiceChoice | null {
  if (existing === null || wantsFuzo === null) return null;
  return existing && wantsFuzo ? 'both' : existing ? 'existing' : wantsFuzo ? 'fuzo' : 'neither';
}

export type DeliveryStatus = 'listed' | 'interested' | 'not_offered';

// --- Documents + verification -----------------------------------------------------------
export const DOCUMENT_DEADLINE_DAYS = 15;
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export type DocumentKind = 'business_registration' | 'food_safety' | 'other';

export type VerificationStatus = 'awaiting_documents' | 'submission_overdue' | 'pending_review' | 'action_required' | 'verified';

/** Whole days left before the document deadline (0 once it has passed). */
export function daysLeft(deadlineAt: string | Date, now = new Date()): number {
  const ms = new Date(deadlineAt).getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / DAY_MS);
}

// --- "Finish your profile" reminders (client, 2026-10-18) -----------------------------------
/** Days after skipping when the pop-up shows; after these, only the card. */
export const NUDGE_DAYS = [1, 3, 7] as const;

/** Should the reminder pop-up show now? At most once a day, three times in all. */
export function nudgeDue(skippedAt: string | null, nudgesShown: number, lastNudgeAt: string | null, now = new Date()): boolean {
  if (!skippedAt || nudgesShown >= NUDGE_DAYS.length) return false;
  if (lastNudgeAt && now.getTime() - new Date(lastNudgeAt).getTime() < DAY_MS) return false;
  return (now.getTime() - new Date(skippedAt).getTime()) / DAY_MS >= NUDGE_DAYS[nudgesShown];
}
