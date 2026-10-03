import type { AppItem } from '@/types/appItem';

/**
 * The FUZO page that opens a shared item, or null when there isn't one.
 * Used by the share sheet (to build the link) and by chat (to open a card
 * someone sent you), so both always agree.
 *   recipe (numeric curated id) -> Bites with that recipe open
 *   trim ("trim-<n>")           -> that clip in the dashboard's Trims tab
 *   place (lat/lng)             -> Scout centred on it, popup open
 */
export function fuzoLinkForItem(item: AppItem): string | null {
  const title = item.name || item.title || '';
  const type = (item.itemType || item.type || '').toLowerCase();
  const id = item.itemId || item.id || '';
  if (type.includes('recipe') && /^\d+$/.test(id)) return `/dashboard?tab=bites&recipe=${id}`;
  if (id.startsWith('trim-')) return `/dashboard?tab=trims&trim=${encodeURIComponent(id.slice(5))}`;
  if (item.lat != null && item.lng != null) {
    const params = new URLSearchParams({ name: title, lat: String(item.lat), lng: String(item.lng) });
    if (item.placeId) params.set('place', item.placeId);
    return `/scout?${params.toString()}`;
  }
  return null;
}
