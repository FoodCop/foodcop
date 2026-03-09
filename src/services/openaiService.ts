import { hasSupabaseConfig, supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from './supabaseClient';

const cleanEnv = (value: string | undefined) => {
  if (!value) {
    return '';
  }

  const trimmed = value.trim();
  const withoutLeading = (trimmed.startsWith('"') || trimmed.startsWith("'")) ? trimmed.slice(1) : trimmed;
  return (withoutLeading.endsWith('"') || withoutLeading.endsWith("'")) ? withoutLeading.slice(0, -1) : withoutLeading;
};

const OPENAI_API_KEY = cleanEnv(import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY);
const OPENAI_MODEL = cleanEnv(import.meta.env.VITE_OPENAI_MODEL) || 'gpt-4o-mini';

export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface OpenAIServiceResult {
  success: boolean;
  data?: {
    text: string;
    raw: unknown;
  };
  error?: string;
}

const extractContent = (responseData: unknown): string | null => {
  if (!responseData || typeof responseData !== 'object') {
    return null;
  }

  const root = responseData as {
    data?: { choices?: Array<{ message?: { content?: unknown } }> };
    choices?: Array<{ message?: { content?: unknown } }>;
  };

  const content = root.data?.choices?.[0]?.message?.content ?? root.choices?.[0]?.message?.content;
  return typeof content === 'string' && content.length > 0 ? content : null;
};

const requestViaProxy = async (payload: Record<string, unknown>): Promise<OpenAIServiceResult> => {
  if (!SUPABASE_URL) {
    return { success: false, error: 'Supabase URL missing for OpenAI proxy.' };
  }

  let bearerToken = SUPABASE_ANON_KEY;
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      bearerToken = data.session.access_token;
    }
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/openai-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { success: false, error: data?.error || `OpenAI proxy failed (${response.status})` };
  }

  if (data?.success === false) {
    return { success: false, error: data?.error || 'OpenAI proxy returned an error.' };
  }

  const text = extractContent(data);
  if (!text) {
    return { success: false, error: 'No response content returned from OpenAI proxy.' };
  }

  return { success: true, data: { text, raw: data } };
};

const requestDirect = async (payload: Record<string, unknown>): Promise<OpenAIServiceResult> => {
  if (!OPENAI_API_KEY) {
    return {
      success: false,
      error: 'OpenAI is not configured. Set Supabase proxy or VITE_OPENAI_API_KEY.',
    };
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { success: false, error: data?.error?.message || `OpenAI request failed (${response.status})` };
  }

  const text = extractContent(data);
  if (!text) {
    return { success: false, error: 'No response content returned from OpenAI.' };
  }

  return { success: true, data: { text, raw: data } };
};

export const OpenAIService = {
  async chatCompletion(messages: OpenAIChatMessage[], options: OpenAIChatOptions = {}): Promise<OpenAIServiceResult> {
    if (!messages.length) {
      return { success: false, error: 'At least one message is required.' };
    }

    const payload = {
      model: options.model || OPENAI_MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 700,
    };

    try {
      if (hasSupabaseConfig && SUPABASE_URL) {
        return await requestViaProxy(payload);
      }

      return await requestDirect(payload);
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  isConfigured() {
    return hasSupabaseConfig || Boolean(OPENAI_API_KEY);
  },
};

export default OpenAIService;
