/**
 * Gemini client for Tako / Chef AI. Ported from
 * legacy/fuzoapp/src/services/geminiService.ts, trimmed to only what Chef AI
 * needs (generateContent + retry/extraction) - analyzeSnap/analyzeScreenshot/
 * analyzeBite/analyzeTrim belong to the Snap/Bite/Trim studios, which aren't
 * ported yet.
 *
 * Change from both legacy copies: no more local-Vite-proxy -> Supabase-edge-
 * function fallback (neither exists in this app). Talks directly to the new
 * /api/gemini Next.js route handler, which calls Gemini server-side.
 */

const GEMINI_PROXY_URL = '/api/gemini';

export interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
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

type GeminiServiceResult =
  | { success: true; data: { text: string; raw: unknown } }
  | { success: false; error: string };

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

  const candidates = Array.isArray(payloadRecord.candidates) ? payloadRecord.candidates : [];
  const firstCandidate = candidates.length > 0 ? asRecord(candidates[0]) : {};
  const parts = asRecord(asRecord(firstCandidate.content)).parts;

  if (Array.isArray(parts)) {
    const joined = parts.map((part) => {
      const partRecord = asRecord(part);
      return typeof partRecord.text === 'string' ? partRecord.text : '';
    }).join('').trim();
    if (joined.length > 0) return joined;
  }

  return '';
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function requestWithRetry(body: Record<string, unknown>, maxRetries = 3): Promise<GeminiServiceResult> {
  let attempt = 0;

  while (attempt < maxRetries) {
    let status = 0;
    try {
      const response = await fetch(GEMINI_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      status = response.status;
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const text = extractGeminiText(data);
        if (!text) {
          return { success: false, error: 'Gemini returned no text content.' };
        }
        return { success: true, data: { text, raw: data } };
      }

      if ((status === 503 || status === 429) && attempt < maxRetries - 1) {
        attempt++;
        const backoffMs = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await delay(backoffMs);
        continue;
      }

      return { success: false, error: (data as { error?: string })?.error || `Gemini request failed (${status})` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

export const GeminiService = {
  async generateContent(request: GeminiGenerateRequest): Promise<GeminiServiceResult> {
    return requestWithRetry({
      model: request.model || 'gemini-2.5-flash',
      contents: normalizeContents(request.contents),
      config: request.config || {},
    });
  },

  async analyzeBite(title: string, category: string, description: string, image?: string, mimeType = 'image/jpeg'): Promise<string> {
    const prompt = `You are an expert chef. Analyze this dish: "${title}" (${category}). 
      Description: ${description}. 
      Generate a clean JSON recipe card.
      Fields: title, category, readyInMinutes, servings, ingredients (array), instructions, nutrition { calories, protein, fat, carbs }, aiTag.`;

    const parts: GeminiPart[] = [{ text: prompt }];
    if (image?.includes(',')) {
      parts.push({
        inlineData: { mimeType, data: image.split(',')[1] }
      });
    }

    const result = await this.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            category: { type: 'string' },
            readyInMinutes: { type: 'number' },
            servings: { type: 'number' },
            ingredients: { type: 'array', items: { type: 'string' } },
            instructions: { type: 'string' },
            aiTag: { type: 'string' },
            nutrition: {
              type: 'object',
              properties: {
                calories: { type: 'number' },
                protein: { type: 'number' },
                fat: { type: 'number' },
                carbs: { type: 'number' },
              },
              required: ['calories', 'protein', 'fat', 'carbs'],
            },
          },
          required: ['title', 'ingredients', 'instructions', 'nutrition'],
        },
      },
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data?.text || '{}';
  },

  /**
   * Neural analysis pass for the Create Card studios (Recipe/Video/Discovery
   * families). Extracts a title/caption/tags/flavor profile - and, for the
   * recipe family, ingredients + nutrition - from an optional photo and the
   * user's free-text description. Restaurant family doesn't use this (it
   * gets its identity from Google Places, not Gemini).
   */
  async analyzeCard(
    cardType: string,
    description: string,
    image?: string,
    mimeType = 'image/jpeg',
  ): Promise<string> {
    const isRecipe = ['RECIPE', 'HOME_COOKING', 'DESSERT', 'DRINK'].includes(cardType);

    const prompt = isRecipe
      ? `You are an expert chef analyzing a home cook's submission for a "${cardType}" card. Description: "${description}".
        Generate a clean JSON object with: title, caption, cuisine, tags (array of short keywords), ingredients (array of [name, quantity, unit] triples),
        nutrition { calories, protein, fat, carbs }, and flavor_profile - a 0-5 rating for each of: spicy, sweet, tangy, salty, savory, bitter, smoky, creamy, fresh, crunchy.`
      : `You are a food content tagger analyzing a "${cardType}" post. Description: "${description}".
        Generate a clean JSON object with: title, caption, cuisine, tags (array of short keywords),
        and flavor_profile - a 0-5 rating for each of: spicy, sweet, tangy, salty, savory, bitter, smoky, creamy, fresh, crunchy.`;

    const parts: GeminiPart[] = [{ text: prompt }];
    if (image?.includes(',')) {
      parts.push({ inlineData: { mimeType, data: image.split(',')[1] } });
    }

    const flavorProfileSchema = {
      type: 'object',
      properties: {
        spicy: { type: 'number' }, sweet: { type: 'number' }, tangy: { type: 'number' },
        salty: { type: 'number' }, savory: { type: 'number' }, bitter: { type: 'number' },
        smoky: { type: 'number' }, creamy: { type: 'number' }, fresh: { type: 'number' },
        crunchy: { type: 'number' },
      },
    };

    const baseProperties: Record<string, unknown> = {
      title: { type: 'string' },
      caption: { type: 'string' },
      cuisine: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      flavor_profile: flavorProfileSchema,
    };

    if (isRecipe) {
      baseProperties.ingredients = {
        type: 'array',
        items: { type: 'array', items: { type: 'string' } },
      };
      baseProperties.nutrition = {
        type: 'object',
        properties: {
          calories: { type: 'number' }, protein: { type: 'number' },
          fat: { type: 'number' }, carbs: { type: 'number' },
        },
      };
    }

    const result = await this.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: baseProperties,
          required: ['title', 'flavor_profile'],
        },
      },
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data?.text || '{}';
  },
};

export default GeminiService;
