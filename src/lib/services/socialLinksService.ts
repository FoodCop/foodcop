import { createClient } from '../supabase/client';
import type { ServiceResult } from '../types/serviceResult';

// users.social_links - the user's other social profiles, shown on their
// Profile (icon row on desktop, flip card on mobile). Stored as bare handles (see
// supabase/migrations/20260925000000_users_social_links.sql); profile URLs are
// always built here, never taken from user input, so a link can't be pointed
// at an arbitrary site.

export const SOCIAL_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'x', 'facebook', 'pinterest'] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export type SocialLinks = Partial<Record<SocialPlatform, string>>;

export const SOCIAL_META: Record<SocialPlatform, { label: string; urlFor: (handle: string) => string; placeholder: string; hosts: string[] }> = {
  instagram: { label: 'Instagram', urlFor: (h) => `https://www.instagram.com/${encodeURIComponent(h)}/`, placeholder: 'yourname', hosts: ['instagram.com', 'instagr.am'] },
  tiktok: { label: 'TikTok', urlFor: (h) => `https://www.tiktok.com/@${encodeURIComponent(h)}`, placeholder: 'yourname', hosts: ['tiktok.com'] },
  youtube: { label: 'YouTube', urlFor: (h) => `https://www.youtube.com/@${encodeURIComponent(h)}`, placeholder: 'yourchannel', hosts: ['youtube.com'] },
  x: { label: 'X', urlFor: (h) => `https://x.com/${encodeURIComponent(h)}`, placeholder: 'yourname', hosts: ['x.com', 'twitter.com'] },
  facebook: { label: 'Facebook', urlFor: (h) => `https://www.facebook.com/${encodeURIComponent(h)}`, placeholder: 'your.name', hosts: ['facebook.com', 'fb.com'] },
  pinterest: { label: 'Pinterest', urlFor: (h) => `https://www.pinterest.com/${encodeURIComponent(h)}/`, placeholder: 'yourname', hosts: ['pinterest.com'] },
};

const HANDLE_RE = /^[A-Za-z0-9._-]{1,60}$/;

/**
 * Accepts a handle ("name", "@name") or a pasted profile URL
 * ("https://instagram.com/name/") and returns the bare handle, or null if
 * it doesn't look like one.
 */
export function normalizeHandle(platform: SocialPlatform, raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;
  // A link = has a scheme, or looks like "site.com/..." (a bare "your.name" stays a handle).
  if (/^https?:\/\//i.test(value) || /^([a-z0-9-]+\.)*[a-z0-9-]+\.[a-z]{2,}\//i.test(value)) {
    try {
      const url = new URL(value.startsWith('http') ? value : `https://${value}`);
      // The link must be for this platform (no Instagram link in the TikTok box).
      const host = url.hostname.toLowerCase().replace(/^(www\.|m\.|mobile\.)/, '');
      if (!SOCIAL_META[platform].hosts.some((h) => host === h || host.endsWith(`.${h}`))) return null;
      const parts = url.pathname.split('/').filter(Boolean);
      // youtube.com/c/name and /user/name are old channel URLs; /channel/<id> has no handle.
      if (platform === 'youtube' && (parts[0] === 'c' || parts[0] === 'user')) value = parts[1] ?? '';
      else if (platform === 'youtube' && parts[0] === 'channel') return null;
      else value = parts[0] ?? '';
    } catch {
      return null;
    }
  }
  value = value.replace(/^@/, '');
  if (platform === 'facebook' && value === 'profile.php') return null;
  return HANDLE_RE.test(value) ? value : null;
}

function clean(raw: unknown): SocialLinks {
  const out: SocialLinks = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const p of SOCIAL_PLATFORMS) {
    const v = (raw as Record<string, unknown>)[p];
    if (typeof v === 'string' && HANDLE_RE.test(v)) out[p] = v;
  }
  return out;
}

export const SocialLinksService = {
  async get(userId: string): Promise<ServiceResult<SocialLinks>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const { data, error } = await supabase.from('users').select('social_links').eq('id', userId).maybeSingle();
    // Before the migration is applied the column doesn't exist - treat as "none linked".
    if (error) return { success: false, error: error.message, data: {} };
    return { success: true, data: clean(data?.social_links) };
  },

  async update(userId: string, links: SocialLinks): Promise<ServiceResult<SocialLinks>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const next = clean(links);
    const { error } = await supabase.from('users').update({ social_links: next }).eq('id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true, data: next };
  },
};
