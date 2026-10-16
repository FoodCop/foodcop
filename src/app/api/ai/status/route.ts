import { NextResponse } from 'next/server';
import { aiState } from '@/lib/ai/geminiServer';

// GET /api/ai/status - is FUZO AI on right now? (no AI call is made)
// Turns itself back on after a pause once the account has credit again
// (src/lib/ai/geminiServer.ts).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  const { available, reason, retryInSec } = aiState();
  return NextResponse.json({ available, reason, retryInSec }, { headers: { 'cache-control': 'no-store' } });
}
