import type { AppItem } from '@/types/appItem';

// A shared item arrives from another user, so nothing in it is trusted. Two
// risks this closes:
//   1. Remote images: an <img src> pointing at an attacker's server tells them
//      the viewer's IP and that they opened the message. Only https images from
//      hosts the app already uses (or same-origin paths) are kept.
//   2. Bloat / surprise fields: only a fixed set of display fields is copied
//      across, with length limits, instead of passing arbitrary JSON into the UI.

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

const EXACT_HOSTS = new Set([
  'images.unsplash.com',
  'maps.googleapis.com',
  'places.googleapis.com',
  'i.ytimg.com',
  ...(supabaseHost ? [supabaseHost] : []),
]);
const HOST_SUFFIXES = ['.googleusercontent.com', '.supabase.co'];

export function safeImageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 2048) return undefined;
  if (value.startsWith('/') && !value.startsWith('//')) return value; // same-origin asset
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return undefined;
    if (EXACT_HOSTS.has(url.hostname) || HOST_SUFFIXES.some((s) => url.hostname.endsWith(s))) return url.toString();
  } catch {
    // not a URL
  }
  return undefined;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : undefined);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

export function sanitizeSharedItem(raw: unknown): AppItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  return {
    id: str(r.id, 200),
    itemId: str(r.itemId, 200),
    itemType: str(r.itemType, 40),
    type: str(r.type, 40),
    name: str(r.name, 200),
    title: str(r.title, 200),
    cat: str(r.cat, 80),
    img: safeImageUrl(r.img) ?? safeImageUrl(r.image) ?? safeImageUrl(r.imageUrl),
    caption: str(r.caption, 1000),
    description: str(r.description, 1000),
    author: str(r.author, 120),
    placeId: str(r.placeId, 200),
    address: str(r.address, 300),
    lat: num(r.lat),
    lng: num(r.lng),
    rating: num(r.rating),
    eventDate: str(r.eventDate, 40),
    eventTime: str(r.eventTime, 40),
    eventLocation: str(r.eventLocation, 300),
    rsvpCount: num(r.rsvpCount),
  };
}
