declare const Deno: {
  env: { get: (key: string) => string | undefined };
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const extractGeminiText = (payload: any): string => {
  const candidates = payload?.candidates;
  const parts = candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((part: any) => part?.text || '').join('').trim();
};

const jsonResponse = (status: number, body: Record<string, unknown>) => new Response(
  JSON.stringify(body),
  { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
);

const buildGenerationPayload = (contents: unknown, config: any) => {
  const payload: Record<string, unknown> = { contents };
  const generationConfig: Record<string, unknown> = {};

  if (typeof config.temperature === 'number') generationConfig.temperature = config.temperature;
  if (typeof config.topP === 'number') generationConfig.topP = config.topP;
  if (typeof config.topK === 'number') generationConfig.topK = config.topK;
  if (typeof config.maxOutputTokens === 'number') generationConfig.maxOutputTokens = config.maxOutputTokens;
  if (typeof config.responseMimeType === 'string' && config.responseMimeType.length > 0) {
    generationConfig.responseMimeType = config.responseMimeType;
  }
  if (config.responseSchema && typeof config.responseSchema === 'object') {
    generationConfig.responseSchema = config.responseSchema;
  }

  if (Object.keys(generationConfig).length > 0) {
    payload.generationConfig = generationConfig;
  }

  if (typeof config.systemInstruction === 'string' && config.systemInstruction.trim().length > 0) {
    payload.systemInstruction = {
      role: 'system',
      parts: [{ text: config.systemInstruction.trim() }],
    };
  }

  return payload;
};

const forwardGeminiRequest = async (model: string, payload: Record<string, unknown>) => {
  const response = await fetch(
    `${GEMINI_BASE_URL}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY || '')}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json().catch(() => ({}));
  return { response, data };
};

const handleRequest = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      return jsonResponse(500, {
        success: false,
        error: 'Gemini API key is not configured in Supabase secrets.',
      });
    }

    if (req.method !== 'POST') {
      return jsonResponse(405, { success: false, error: 'Method not allowed. Use POST.' });
    }

    const body = await req.json();
    const model = String(body?.model || 'gemini-2.5-flash');
    const contents = body?.contents;
    const config = body?.config || {};

    if (!contents) {
      return jsonResponse(400, { success: false, error: 'contents is required' });
    }

    const payload = buildGenerationPayload(contents, config);
    const { response, data } = await forwardGeminiRequest(model, payload);

    if (!response.ok) {
      return jsonResponse(response.status, {
        success: false,
        error: data?.error?.message || `Gemini proxy failed (${response.status})`,
        details: data,
      });
    }

    return jsonResponse(200, {
      success: true,
      data: {
        ...data,
        text: extractGeminiText(data),
      },
    });
  } catch (error) {
    return jsonResponse(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

Deno.serve(handleRequest);
