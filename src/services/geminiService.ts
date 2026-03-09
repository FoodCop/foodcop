import { hasSupabaseConfig, supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from './supabaseClient';

const LOCAL_PROXY_URL = '/api/gemini-proxy';
const EDGE_PROXY_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/gemini-proxy` : '';

export interface GeminiInlineData {
  mimeType: string;
  data: string;
}

export interface GeminiPart {
  text?: string;
  inlineData?: GeminiInlineData;
}

export interface GeminiContent {
  role?: string;
  parts: GeminiPart[];
}

export interface GeminiGenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  responseSchema?: Record<string, unknown>;
  systemInstruction?: string;
}

export interface GeminiGenerateRequest {
  model?: string;
  contents: GeminiContent | GeminiContent[] | string;
  config?: GeminiGenerationConfig;
}

interface GeminiServiceResult {
  success: boolean;
  data?: {
    text: string;
    raw: unknown;
  };
  error?: string;
}

const normalizeContents = (contents: GeminiGenerateRequest['contents']) => {
  if (typeof contents === 'string') {
    return [{ role: 'user', parts: [{ text: contents }] }];
  }

  if (Array.isArray(contents)) {
    return contents;
  }

  return [contents];
};

const asRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
};

const extractGeminiText = (payload: unknown): string => {
  if (!payload) return '';

  const payloadRecord = asRecord(payload);

  if (typeof payloadRecord.text === 'string' && payloadRecord.text.length > 0) {
    return payloadRecord.text;
  }

  if (typeof payloadRecord.output_text === 'string' && payloadRecord.output_text.length > 0) {
    return payloadRecord.output_text;
  }

  const directCandidates = asRecord(payloadRecord).candidates;
  const nestedCandidates = asRecord(payloadRecord.data).candidates;
  const candidates = Array.isArray(directCandidates)
    ? directCandidates
    : (Array.isArray(nestedCandidates) ? nestedCandidates : []);

  const firstCandidate = candidates.length > 0 ? asRecord(candidates[0]) : {};
  const parts = asRecord(asRecord(firstCandidate.content)).parts;

  if (Array.isArray(parts)) {
    const joined = parts.map((part) => {
      const partRecord = asRecord(part);
      return typeof partRecord.text === 'string' ? partRecord.text : '';
    }).join('').trim();
    if (joined.length > 0) {
      return joined;
    }
  }

  return '';
};

const requestProxy = async (url: string, body: Record<string, unknown>, useSupabaseAuth: boolean): Promise<GeminiServiceResult> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (useSupabaseAuth && SUPABASE_ANON_KEY) {
    let bearerToken = SUPABASE_ANON_KEY;
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        bearerToken = data.session.access_token;
      }
    }

    headers.apikey = SUPABASE_ANON_KEY;
    headers.Authorization = `Bearer ${bearerToken}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.success === false) {
    return {
      success: false,
      error: data?.error || `Gemini proxy failed (${response.status})`,
    };
  }

  const text = extractGeminiText(data?.data || data);
  if (!text) {
    return {
      success: false,
      error: 'Gemini returned no text content.',
    };
  }

  return {
    success: true,
    data: {
      text,
      raw: data,
    },
  };
};

export const GeminiService = {
  async generateContent(request: GeminiGenerateRequest): Promise<GeminiServiceResult> {
    const payload = {
      model: request.model || 'gemini-2.5-flash',
      contents: normalizeContents(request.contents),
      config: request.config || {},
    };

    try {
      const localResult = await requestProxy(LOCAL_PROXY_URL, payload, false);
      if (localResult.success) {
        return localResult;
      }

      let edgeError = '';
      if (hasSupabaseConfig && EDGE_PROXY_URL) {
        const edgeResult = await requestProxy(EDGE_PROXY_URL, payload, true);
        if (edgeResult.success) {
          return edgeResult;
        }
        edgeError = edgeResult.error || '';
      }

      return {
        success: false,
        error: localResult.error || edgeError || 'Gemini proxy unavailable.',
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  },

  async health() {
    const healthUrls = [LOCAL_PROXY_URL, `${LOCAL_PROXY_URL}/health`];

    try {
      for (const url of healthUrls) {
        const response = await fetch(url);
        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          return {
            success: true,
            data,
          };
        }
      }

      return {
        success: false,
        error: 'Gemini health check failed on all configured health endpoints.',
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  },
};

export default GeminiService;
