// Reading what an imported page says about itself (URL import, client
// 2026-10-16): Open Graph tags (title, description, image, video, site), and
// the schema.org Recipe most recipe websites publish (name, ingredients,
// steps, cuisine, image, author). Plain text only - nothing from the page is
// ever shown as HTML.

import { htmlToText } from '@/lib/utils/text';

export interface PageMeta {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  author: string | null;
  isVideo: boolean;
  /** Pinterest pins link to where the recipe came from. */
  seeAlso: string | null;
}

export interface ImportedRecipe {
  name: string | null;
  ingredients: string[];
  steps: string[];
  cuisine: string[];
  image: string | null;
  author: string | null;
  description: string | null;
}

const decode = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&');

const clean = (s: unknown, max = 500): string | null => {
  if (typeof s !== 'string') return null;
  const text = htmlToText(decode(s)).replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : null;
};

/** <meta property|name="key" content="..."> in either attribute order. */
function meta(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const k = key.replace(/[.*+?^${}()|[\]\\:]/g, '\\$&');
    const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']*)["']`, 'i'));
    const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${k}["']`, 'i'));
    const v = (a ?? b)?.[1];
    if (v) return decode(v);
  }
  return null;
}

const httpsOnly = (u: string | null, base: string): string | null => {
  if (!u) return null;
  try {
    const abs = new URL(u, base);
    return abs.protocol === 'https:' ? abs.href : null;
  } catch {
    return null;
  }
};

export function readMeta(html: string, pageUrl: string): PageMeta {
  const ogType = meta(html, ['og:type']) ?? '';
  return {
    title: clean(meta(html, ['og:title', 'twitter:title']) ?? html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1], 200),
    description: clean(meta(html, ['og:description', 'twitter:description', 'description']), 1500),
    image: httpsOnly(meta(html, ['og:image:secure_url', 'og:image', 'twitter:image']), pageUrl),
    siteName: clean(meta(html, ['og:site_name']), 80),
    author: clean(meta(html, ['author', 'article:author', 'twitter:creator']), 120),
    isVideo: /video/i.test(ogType) || !!meta(html, ['og:video', 'og:video:url', 'og:video:secure_url']),
    seeAlso: httpsOnly(meta(html, ['og:see_also', 'pinterestapp:source']), pageUrl),
  };
}

// ---- schema.org Recipe (JSON-LD) ------------------------------------------------
type Json = Record<string, unknown>;

const isType = (node: Json, type: string) => {
  const t = node['@type'];
  return t === type || (Array.isArray(t) && t.includes(type));
};

function findRecipe(node: unknown, depth = 0): Json | null {
  if (!node || depth > 6) return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const r = findRecipe(n, depth + 1);
      if (r) return r;
    }
    return null;
  }
  if (typeof node !== 'object') return null;
  const obj = node as Json;
  if (isType(obj, 'Recipe')) return obj;
  return findRecipe(obj['@graph'], depth + 1) ?? findRecipe(obj.mainEntity, depth + 1);
}

const textOf = (v: unknown): string | null => (typeof v === 'string' ? v : v && typeof v === 'object' && typeof (v as Json).text === 'string' ? ((v as Json).text as string) : null);

function stepsOf(v: unknown, out: string[] = [], depth = 0): string[] {
  if (depth > 4 || out.length >= 30) return out;
  if (typeof v === 'string') {
    // Some sites put all steps in one string, one per line / sentence block.
    v.split(/\n+|(?<=\.)\s+(?=\d+\.\s)/)
      .map((s) => clean(s.replace(/^\d+[.)]\s*/, ''), 600))
      .filter((s): s is string => !!s)
      .forEach((s) => out.push(s));
    return out;
  }
  if (Array.isArray(v)) {
    v.forEach((x) => stepsOf(x, out, depth + 1));
    return out;
  }
  if (v && typeof v === 'object') {
    const obj = v as Json;
    if (isType(obj, 'HowToSection')) return stepsOf(obj.itemListElement, out, depth + 1);
    const t = clean(textOf(obj) ?? (typeof obj.name === 'string' ? obj.name : null), 600);
    if (t) out.push(t);
  }
  return out;
}

const listOf = (v: unknown, max: number, maxLen: number): string[] =>
  (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [])
    .map((x) => clean(typeof x === 'string' ? x : textOf(x), maxLen))
    .filter((x): x is string => !!x)
    .slice(0, max);

const imageOf = (v: unknown, base: string): string | null => {
  const first = Array.isArray(v) ? v[0] : v;
  const url = typeof first === 'string' ? first : first && typeof first === 'object' ? ((first as Json).url as string) ?? null : null;
  return httpsOnly(url, base);
};

const authorOf = (v: unknown): string | null => {
  const first = Array.isArray(v) ? v[0] : v;
  return clean(typeof first === 'string' ? first : first && typeof first === 'object' ? ((first as Json).name as string) : null, 120);
};

export function readRecipe(html: string, pageUrl: string): ImportedRecipe | null {
  const blocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of blocks.slice(0, 20)) {
    const json = block.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '').trim();
    let data: unknown;
    try {
      data = JSON.parse(json);
    } catch {
      continue;
    }
    const r = findRecipe(data);
    if (!r) continue;
    return {
      name: clean(r.name, 120),
      ingredients: listOf(r.recipeIngredient ?? r.ingredients, 40, 160),
      steps: stepsOf(r.recipeInstructions).slice(0, 30),
      cuisine: listOf(r.recipeCuisine, 4, 30),
      image: imageOf(r.image, pageUrl),
      author: authorOf(r.author),
      description: clean(r.description, 1000),
    };
  }
  return null;
}

/** "2 cups basmati rice" -> [name, quantity, unit] for the recipe form (best effort). */
export function splitIngredient(line: string): [string, string, string] {
  const m = line.match(
    /^\s*((?:\d+\s+)?\d+(?:[./]\d+)?|[¼½¾⅓⅔⅛]|\d+\s*[¼½¾⅓⅔⅛])\s*(cups?|tbsps?|tablespoons?|tsps?|teaspoons?|g|grams?|kg|ml|l|litres?|liters?|oz|ounces?|lbs?|pounds?|pinch(?:es)?|cloves?|cans?|slices?|pieces?)?\.?\s+(.+)$/i,
  );
  if (!m) return [line.trim().slice(0, 80), '', ''];
  return [m[3].trim().slice(0, 80), m[1].trim().slice(0, 12), (m[2] ?? '').trim().slice(0, 16)];
}
