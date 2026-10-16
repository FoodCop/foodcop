// Server only: used by src/app/api/import/route.ts.
// Reads what a Facebook / Instagram / Pinterest / TikTok / YouTube post or a
// recipe website shares publicly (URL import, client 2026-10-16;
// docs/VIDEO_URL_PLAN.md, 3a). Every fetch goes through safeFetch.
import { parseSourceUrl, type ImportPlatform, type ParsedSource } from './platforms';
import { FetchBlockedError, safeFetch } from './safeFetch';
import { readMeta, readRecipe, splitIngredient, type ImportedRecipe } from './readPage';
import { htmlToText } from '@/lib/utils/text';

export { FetchBlockedError };

export interface ImportResult {
  platform: ImportPlatform;
  url: string;
  video: boolean;
  embedUrl: string | null;
  title: string | null;
  caption: string | null;
  author: string | null;
  /** The cover / photo as a data: URL (fetched here, re-saved by FUZO). */
  image: string | null;
  recipe: { name: string | null; ingredients: [string, string, string][]; steps: string[]; cuisine: string[] } | null;
  /** The platform shared little or nothing - the user fills in the rest. */
  partial: boolean;
}

const UA = 'Mozilla/5.0 (compatible; FUZO-LinkImport/1.0; +https://fuzo.app)';
const HTML = ['text/html', 'application/xhtml'];

const text = (s: unknown, max: number) => (typeof s === 'string' ? htmlToText(s).replace(/\s+/g, ' ').trim().slice(0, max) || null : null);

async function oembed(endpoint: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await safeFetch(endpoint, { accept: ['application/json', 'text/json', 'text/javascript'], maxBytes: 200_000, headers: { 'user-agent': UA } });
    return JSON.parse(res.body.toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function page(url: string): Promise<{ url: string; html: string } | null> {
  try {
    const res = await safeFetch(url, { accept: HTML, maxBytes: 3_000_000, headers: { 'user-agent': UA, accept: 'text/html' } });
    return { url: res.url, html: res.body.toString('utf8') };
  } catch (err) {
    if (err instanceof FetchBlockedError && /cannot be imported|https links/.test(err.message)) throw err;
    return null;
  }
}

async function imageData(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await safeFetch(url, { accept: ['image/'], maxBytes: 5_000_000, headers: { 'user-agent': UA } });
    const type = res.contentType.split(';')[0];
    if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(type)) return null;
    return `data:${type};base64,${res.body.toString('base64')}`;
  } catch {
    return null;
  }
}

const recipeOut = (r: ImportedRecipe | null): ImportResult['recipe'] =>
  r && (r.ingredients.length || r.steps.length)
    ? { name: r.name, ingredients: r.ingredients.map(splitIngredient), steps: r.steps, cuisine: r.cuisine }
    : null;

/** Reads a pasted link. Throws FetchBlockedError with a message for the user. */
export async function importLink(raw: string): Promise<ImportResult> {
  let src: ParsedSource | null = parseSourceUrl(raw);
  if (!src) throw new FetchBlockedError('Paste a full link starting with https://');
  // Short links (vm.tiktok.com, pin.it, fb.watch): follow them to the real post first.
  let fetched: { url: string; html: string } | null = null;
  const short = /^https:\/\/(vm\.tiktok\.com|vt\.tiktok\.com|pin\.it|fb\.watch)\//i.test(src.url);
  if (short) {
    fetched = await page(src.url);
    if (fetched) src = parseSourceUrl(fetched.url) ?? src;
  }

  const result: ImportResult = { platform: src.platform, url: src.url, video: src.video, embedUrl: src.embedUrl, title: null, caption: null, author: null, image: null, recipe: null, partial: false };
  let imageUrl: string | null = null;

  if (src.platform === 'youtube' || src.platform === 'tiktok') {
    const endpoint =
      src.platform === 'youtube'
        ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(src.url)}`
        : `https://www.tiktok.com/oembed?url=${encodeURIComponent(src.url)}`;
    const o = await oembed(endpoint);
    if (o) {
      const caption = text(o.title, 1500);
      result.caption = caption;
      result.title = caption ? caption.split(/[.!?\n#]/)[0].trim().slice(0, 120) || null : null;
      result.author = text(o.author_unique_id ? `@${o.author_unique_id}` : o.author_name, 120);
      imageUrl = typeof o.thumbnail_url === 'string' ? o.thumbnail_url : null;
    } else result.partial = true;
  } else {
    fetched = fetched ?? (await page(src.url));
    // Instagram / Facebook often answer apps with their login page: that's "nothing shared", not a title.
    const loginWall = (t: string | null) => !!t && /^(instagram|facebook|log ?in|sign up|login)/i.test(t.trim());
    if (fetched) {
      const m = readMeta(fetched.html, fetched.url);
      if ((src.platform === 'instagram' || src.platform === 'facebook') && loginWall(m.title)) {
        m.title = null;
        m.image = null;
        m.description = m.description && !loginWall(m.description) ? m.description : null;
      }
      let recipe = readRecipe(fetched.html, fetched.url);
      // Pinterest: the pin points at the recipe's own website.
      if (!recipe && src.platform === 'pinterest' && m.seeAlso) {
        const origin = await page(m.seeAlso);
        if (origin) recipe = readRecipe(origin.html, origin.url);
      }
      result.title = recipe?.name ?? m.title;
      result.caption = recipe?.description ?? m.description;
      result.author = recipe?.author ?? m.author ?? m.siteName;
      result.recipe = recipeOut(recipe);
      result.video = src.video || (src.platform !== 'web' && m.isVideo);
      imageUrl = recipe?.image ?? m.image;
      result.partial = !m.title && !recipe;
    } else result.partial = true;
  }

  result.image = await imageData(imageUrl);
  return result;
}
