import { NextResponse } from 'next/server';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { GOOGLE_MESSAGES, limitsFor, type GoogleBlock, type GoogleKind } from './limits';

// Every route that spends Google money calls this first: a real account
// (guests can create unlimited sessions, so they don't count), then the daily
// limits. Limits live in the database, because Vercel runs many short-lived
// server instances that can't share memory.

const STATUS: Record<GoogleBlock, number> = { sign_in: 401, user_limit: 429, daily_limit: 429, unavailable: 503 };

/** The JSON answer for a refused call. `code` picks the message in the app. */
export const googleRefusal = (code: GoogleBlock) =>
  NextResponse.json({ error: GOOGLE_MESSAGES[code], code }, { status: STATUS[code] });

// Only if the database can't answer (migration not pushed, an outage): each
// instance counts for itself, so a failure never means "no limit".
const memory = new Map<string, number>();
export const memoryConsume = (kind: GoogleKind, userId: string, limits: { daily: number; user: number }): 'ok' | GoogleBlock => {
  const day = new Date().toISOString().slice(0, 10);
  for (const key of memory.keys()) if (!key.startsWith(day)) memory.delete(key);
  const allKey = `${day}:${kind}`;
  const userKey = `${allKey}:${userId}`;
  const mine = memory.get(userKey) ?? 0;
  const all = memory.get(allKey) ?? 0;
  if (mine >= limits.user) return 'user_limit';
  if (all >= limits.daily) return 'daily_limit';
  memory.set(userKey, mine + 1);
  memory.set(allKey, all + 1);
  return 'ok';
};

async function consume(kind: GoogleKind, userId: string): Promise<'ok' | GoogleBlock> {
  const limits = limitsFor(kind);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    const admin = createServiceRoleClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await admin.rpc('consume_google_quota', {
      p_kind: kind,
      p_user: userId,
      p_daily_limit: limits.daily,
      p_user_limit: limits.user,
    });
    if (!error && (data === 'ok' || data === 'user_limit' || data === 'daily_limit')) return data;
    console.error('Google usage limits: database unavailable, counting in memory');
  }
  return memoryConsume(kind, userId, limits);
}

/** Answers null if the call may go ahead, otherwise the response to send back. */
export async function guardGoogle(kind: GoogleKind): Promise<NextResponse | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user || data.user.is_anonymous) return googleRefusal('sign_in');
  const result = await consume(kind, data.user.id);
  return result === 'ok' ? null : googleRefusal(result);
}
