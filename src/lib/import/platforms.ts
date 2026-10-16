// Links people import (client, 2026-10-16; docs/VIDEO_URL_PLAN.md, 3a):
// Facebook, Instagram, Pinterest, TikTok (+ YouTube and recipe websites).
// Recognises a link's platform and, for videos, the post id. Embed addresses
// are built only from those ids - never from HTML another site sends - so an
// imported post can't inject its own frame or script. Shared by the import
// API route (server) and the pages that show imported posts.

export type ImportPlatform = 'instagram' | 'tiktok' | 'facebook' | 'pinterest' | 'youtube' | 'web';

export const PLATFORM_LABEL: Record<ImportPlatform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  pinterest: 'Pinterest',
  youtube: 'YouTube',
  web: 'the web',
};

export interface ParsedSource {
  platform: ImportPlatform;
  /** The link, cleaned (https, no tracking params for known platforms). */
  url: string;
  /** Whether the link looks like a video (reel, TikTok, YouTube...). */
  video: boolean;
  /** For videos we can embed: the player address. */
  embedUrl: string | null;
}

const host = (u: URL) => u.hostname.toLowerCase().replace(/^(www|m|mobile)\./, '');

/** Parses a pasted link. null when it isn't a usable https link. */
export function parseSourceUrl(raw: string): ParsedSource | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
  const h = host(u);
  const path = u.pathname;

  // TikTok: tiktok.com/@user/video/<id>; vm./vt.tiktok.com short links (resolved by the server).
  if (h === 'tiktok.com' || h.endsWith('.tiktok.com')) {
    const id = path.match(/\/video\/(\d{8,25})/)?.[1];
    return { platform: 'tiktok', url: id ? `https://www.tiktok.com${path.split('?')[0]}` : u.href, video: true, embedUrl: id ? `https://www.tiktok.com/embed/v2/${id}` : null };
  }
  // Instagram: /p/<code> (photo / carousel), /reel/<code>, /reels/<code>, /tv/<code>.
  if (h === 'instagram.com') {
    const m = path.match(/^\/(p|reel|reels|tv)\/([A-Za-z0-9_-]{5,40})/);
    if (!m) return { platform: 'instagram', url: u.href, video: false, embedUrl: null };
    const kind = m[1] === 'reels' ? 'reel' : m[1];
    const clean = `https://www.instagram.com/${kind}/${m[2]}/`;
    return { platform: 'instagram', url: clean, video: kind !== 'p', embedUrl: `${clean}embed` };
  }
  // Facebook: /reel/<id>, /watch?v=<id>, /<page>/videos/<id>, fb.watch/<code>.
  if (h === 'facebook.com' || h === 'fb.watch' || h === 'fb.com') {
    const video = h === 'fb.watch' || /\/(reel|videos|watch)\b/.test(path) || u.searchParams.has('v');
    const href = h === 'fb.com' ? u.href.replace('//fb.com', '//www.facebook.com') : u.href;
    return {
      platform: 'facebook',
      url: href,
      video,
      embedUrl: video && h !== 'fb.watch' ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(href)}&show_text=false` : null,
    };
  }
  // Pinterest: pinterest.<tld>/pin/<id>; pin.it short links.
  // (country sites too: in.pinterest.com, pinterest.co.uk ...)
  if (/^([a-z]{2}\.)?pinterest\.[a-z]{2,3}(\.[a-z]{2})?$/.test(h) || h === 'pin.it') {
    return { platform: 'pinterest', url: u.href, video: false, embedUrl: null };
  }
  // YouTube: watch?v=, youtu.be/<id>, /shorts/<id>.
  if (h === 'youtube.com' || h === 'youtu.be') {
    const id = h === 'youtu.be' ? path.slice(1).split('/')[0] : u.searchParams.get('v') || path.match(/^\/shorts\/([A-Za-z0-9_-]{6,20})/)?.[1] || '';
    if (/^[A-Za-z0-9_-]{6,20}$/.test(id)) {
      return { platform: 'youtube', url: `https://www.youtube.com/watch?v=${id}`, video: true, embedUrl: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    return { platform: 'youtube', url: u.href, video: true, embedUrl: null };
  }
  return { platform: 'web', url: u.href, video: false, embedUrl: null };
}

/** The embed address for an imported post's saved link, if it can be played here. */
export const embedUrlFor = (sourceUrl: string | null | undefined) => (sourceUrl ? parseSourceUrl(sourceUrl)?.embedUrl ?? null : null);
