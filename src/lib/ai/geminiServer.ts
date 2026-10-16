// Server only: used by src/app/api/ai/*.
// Calls Gemini for FUZO AI features (client, 2026-10-16; docs/VIDEO_URL_PLAN.md,
// phase 7) and switches AI off by itself while the account has no credit:
// a "credits depleted" answer (HTTP 402 / RESOURCE_EXHAUSTED / billing) pauses
// AI for PAUSE_MS, so nobody waits on a call that will fail. After the pause
// the next request tries again - once credit is added, AI is simply on again,
// with no code change or redeploy.

import { GEMINI_MODEL } from '@/lib/ai/geminiModel';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const PAUSE_MS = 5 * 60_000;

export type AiOff = 'credits' | 'unconfigured' | 'error';

let pausedUntil = 0;
let lastReason: AiOff | null = null;

/** Whether AI is believed to be on right now (no call is made). */
export function aiState(): { available: boolean; reason: AiOff | null; retryInSec: number } {
  if (!process.env.GEMINI_API_KEY) return { available: false, reason: 'unconfigured', retryInSec: 0 };
  const wait = pausedUntil - Date.now();
  return wait > 0 ? { available: false, reason: lastReason, retryInSec: Math.ceil(wait / 1000) } : { available: true, reason: null, retryInSec: 0 };
}

const isCreditError = (status: number, body: { error?: { status?: string; message?: string } }) =>
  status === 402 ||
  status === 429 ||
  body.error?.status === 'RESOURCE_EXHAUSTED' ||
  /credit|billing|quota|prepayment|exceeded/i.test(body.error?.message ?? '');

export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

/**
 * One structured call: returns the parsed JSON object, or why AI is off.
 * responseSchema keeps the answer to the fields we asked for.
 */
export async function geminiJson<T>(opts: {
  parts: GeminiPart[];
  systemInstruction: string;
  responseSchema: Record<string, unknown>;
  maxOutputTokens?: number;
}): Promise<{ ok: true; data: T } | { ok: false; reason: AiOff; message: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, reason: 'unconfigured', message: 'AI is not set up on this server.' };
  const state = aiState();
  if (!state.available) return { ok: false, reason: state.reason ?? 'error', message: 'FUZO AI is paused right now.' };

  try {
    const res = await fetch(`${GEMINI_API_BASE}/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: opts.parts }],
        systemInstruction: { parts: [{ text: opts.systemInstruction }] },
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: opts.maxOutputTokens ?? 2048,
          responseMimeType: 'application/json',
          responseSchema: opts.responseSchema,
        },
      }),
      signal: AbortSignal.timeout(25_000),
    });
    const body = (await res.json().catch(() => ({}))) as {
      error?: { status?: string; message?: string };
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    if (!res.ok) {
      if (isCreditError(res.status, body)) {
        pausedUntil = Date.now() + PAUSE_MS;
        lastReason = 'credits';
        return { ok: false, reason: 'credits', message: 'FUZO AI is paused (no AI credit).' };
      }
      return { ok: false, reason: 'error', message: 'FUZO AI could not answer this time.' };
    }
    // It answered: AI is on.
    pausedUntil = 0;
    lastReason = null;
    const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    try {
      return { ok: true, data: JSON.parse(text) as T };
    } catch {
      return { ok: false, reason: 'error', message: 'FUZO AI gave an answer we could not read.' };
    }
  } catch {
    return { ok: false, reason: 'error', message: 'FUZO AI took too long. Fill it in yourself, or try again.' };
  }
}
