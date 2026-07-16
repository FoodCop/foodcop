import { NextResponse } from 'next/server';

// Server-side Gemini proxy for Tako / Chef AI. Both legacy GeminiService
// copies (React app + FUZO_V3) only knew how to reach a local Vite dev proxy
// or an undeployed Supabase edge function - neither works here. This calls
// the Generative Language API directly using the server-only GEMINI_API_KEY
// (never exposed to the client), and returns the raw Gemini response body so
// the existing client-side extractGeminiText()/candidates parsing keeps working
// unchanged.

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiGenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  responseSchema?: Record<string, unknown>;
  systemInstruction?: string;
}

interface GeminiRouteBody {
  model?: string;
  contents: unknown;
  config?: GeminiGenerationConfig;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured on the server.' }, { status: 500 });
  }

  let body: GeminiRouteBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.contents) {
    return NextResponse.json({ error: 'Missing "contents" in request body.' }, { status: 400 });
  }

  const model = body.model || 'gemini-2.5-flash';
  const { systemInstruction, ...generationConfig } = body.config || {};

  const geminiBody: Record<string, unknown> = {
    contents: body.contents,
    generationConfig,
  };
  if (systemInstruction) {
    geminiBody.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  try {
    const response = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = (data as { error?: { message?: string } })?.error?.message || `Gemini API request failed (${response.status})`;
      return NextResponse.json({ error: message }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gemini request failed.' }, { status: 502 });
  }
}
