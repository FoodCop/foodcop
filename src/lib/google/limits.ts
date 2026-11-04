// What each Google call may use per day (client budget: $10 a month, see
// docs/GOOGLE_COST_PLAN.md). Override with GOOGLE_DAILY_LIMIT_<KIND> and
// GOOGLE_USER_LIMIT_<KIND>; 0 turns that kind off.

export type GoogleKind = 'search' | 'details' | 'photo' | 'route' | 'gemini' | 'youtube';

/** Why a Google call was refused. The app shows a matching message (googleMessage). */
export type GoogleBlock = 'sign_in' | 'user_limit' | 'daily_limit' | 'unavailable';

export const GOOGLE_LIMITS: Record<GoogleKind, { daily: number; user: number }> = {
  search: { daily: 30, user: 8 },
  details: { daily: 30, user: 10 },
  photo: { daily: 40, user: 15 },
  route: { daily: 50, user: 15 },
  gemini: { daily: 200, user: 40 },
  youtube: { daily: 80, user: 20 },
};

const fromEnv = (name: string, fallback: number) => {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
};

export const limitsFor = (kind: GoogleKind) => ({
  daily: fromEnv(`GOOGLE_DAILY_LIMIT_${kind.toUpperCase()}`, GOOGLE_LIMITS[kind].daily),
  user: fromEnv(`GOOGLE_USER_LIMIT_${kind.toUpperCase()}`, GOOGLE_LIMITS[kind].user),
});

export const GOOGLE_MESSAGES: Record<GoogleBlock, string> = {
  sign_in: 'Sign in to use this.',
  user_limit: "You've reached today's limit for this. Try again tomorrow.",
  daily_limit: "FUZO has reached today's limit for this. Try again tomorrow.",
  unavailable: 'Google Maps is unavailable right now.',
};

const isBlock = (code: unknown): code is GoogleBlock => typeof code === 'string' && code in GOOGLE_MESSAGES;

/** The message for a refused call, or the fallback for any other failure. */
export const googleMessage = (code: unknown, fallback: string) => (isBlock(code) ? GOOGLE_MESSAGES[code] : fallback);
