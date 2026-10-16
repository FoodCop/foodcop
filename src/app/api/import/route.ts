import { NextResponse } from 'next/server';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { FetchBlockedError, importLink, type ImportResult } from '@/lib/import/importLink';

// POST /api/import { url } - URL import (client, 2026-10-16; docs/VIDEO_URL_PLAN.md, 3a).
// Reads what a Facebook / Instagram / Pinterest / TikTok / YouTube post or a
// recipe website shares publicly (importLink), so Create can turn it into a
// recipe card (photo) or a recipe Trim (video), credited to the creator.
// Signed-in users only and rate limited; every fetch goes through safeFetch
// (no private addresses). The video itself is never downloaded - it plays embedded.

export const runtime = 'nodejs';

export type { ImportResult };

// Simple per-user limit (per server instance): 20 imports per 10 minutes.
const recent = new Map<string, number[]>();
const allowed = (userId: string) => {
  const now = Date.now();
  const list = (recent.get(userId) ?? []).filter((t) => now - t < 10 * 60_000);
  if (list.length >= 20) return false;
  list.push(now);
  recent.set(userId, list);
  return true;
};

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: 'Please sign in to import a link.' }, { status: 401 });
  if (!allowed(auth.user.id)) return NextResponse.json({ error: 'Too many imports. Try again in a few minutes.' }, { status: 429 });

  let body: { url?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const raw = typeof body.url === 'string' ? body.url.trim().slice(0, 1000) : '';
  try {
    return NextResponse.json(await importLink(raw));
  } catch (err) {
    const message = err instanceof FetchBlockedError ? err.message : "We couldn't read that link. Try another, or fill it in yourself.";
    return NextResponse.json({ error: message }, { status: err instanceof FetchBlockedError && /https:\/\//.test(message) ? 400 : 422 });
  }
}
