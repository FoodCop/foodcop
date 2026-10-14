/**
 * COMMUNITY PHOTOS - photos FUZO members posted about a restaurant (Create ->
 * Restaurant; client, 2026-10-14, plan Phase 6) and its visit count.
 * Migration: 20261014010000_restaurant_photos_visits.sql.
 *
 * A restaurant's community photos are its published RESTAURANT_PHOTO posts:
 * linked to its FUZO account, or at its verified Google place. The owner can
 * hide any of them from their gallery (restaurant_gallery_hidden); hidden ones
 * stay on the poster's own profile and in the Feed.
 */

import { createClient } from '@/lib/supabase/client';
import type { ServiceResult } from '@/lib/types/serviceResult';

export interface CommunityPhoto {
  /** Unique per photo: card id + photo url. */
  key: string;
  cardId: string;
  url: string;
  caption: string | null;
  author: { id: string; name: string };
  createdAt: string;
  /** Hidden by the owner (only owners ever get hidden photos back). */
  hidden: boolean;
}

export interface PlaceRef {
  /** The FUZO restaurant account. */
  restaurantId?: string | null;
  /** Google place id (use the restaurant's verified one). */
  placeId?: string | null;
  /** A community-added place (Phase 7). */
  communityPlaceId?: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Google place ids are URL-safe base64-ish; anything else could break the filter.
const PLACE_ID = /^[A-Za-z0-9_-]{4,300}$/;

const validRef = (ref: PlaceRef) => ({
  restaurantId: ref.restaurantId && UUID.test(ref.restaurantId) ? ref.restaurantId : null,
  placeId: ref.placeId && PLACE_ID.test(ref.placeId) ? ref.placeId : null,
  communityPlaceId: ref.communityPlaceId && UUID.test(ref.communityPlaceId) ? ref.communityPlaceId : null,
});

/** Visit-count keys for a place (see place_visits.place_key). */
export const placeVisitKeys = (ref: PlaceRef): string[] => {
  const { restaurantId, placeId, communityPlaceId } = validRef(ref);
  return [restaurantId, placeId ? `g:${placeId}` : null, communityPlaceId ? `c:${communityPlaceId}` : null].filter((k): k is string => !!k);
};

// Visitor photos only ever come from FUZO's own storage (the database also
// requires that; this guards rows saved before that rule existed).
const STORAGE_PREFIX = `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '')}/storage/v1/object/public/food-card-media/`;
const isFuzoPhoto = (url: string) => !!process.env.NEXT_PUBLIC_SUPABASE_URL && url.startsWith(STORAGE_PREFIX);

type CardRow = { id: string; user_id: string; caption: string | null; photos: string[] | null; image_url: string | null; created_at: string };

export const CommunityPhotosService = {
  /**
   * Community photos of a place, newest first. Photos the owner hid are left
   * out, unless includeHidden (the owner's own view, so they can restore them).
   */
  async list(ref: PlaceRef, opts: { includeHidden?: boolean; limit?: number } = {}): Promise<ServiceResult<CommunityPhoto[]>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };
    const { restaurantId, placeId, communityPlaceId } = validRef(ref);
    if (!restaurantId && !placeId && !communityPlaceId) return { success: true, data: [] };

    const match = [
      restaurantId ? `restaurant_id.eq.${restaurantId}` : null,
      placeId ? `place_id.eq.${placeId}` : null,
      communityPlaceId ? `community_place_id.eq.${communityPlaceId}` : null,
    ]
      .filter(Boolean)
      .join(',');
    const { data, error } = await supabase
      .from('food_cards')
      .select('id, user_id, caption, photos, image_url, created_at')
      .eq('card_type', 'RESTAURANT_PHOTO')
      .eq('status', 'PUBLISHED')
      .or(match)
      .order('created_at', { ascending: false })
      .limit(opts.limit ?? 60);
    if (error) return { success: false, error: error.message };
    const rows = (data ?? []) as CardRow[];
    if (!rows.length) return { success: true, data: [] };

    const [hiddenRes, usersRes] = await Promise.all([
      restaurantId
        ? supabase.from('restaurant_gallery_hidden').select('card_id, photo_url').eq('restaurant_id', restaurantId)
        : Promise.resolve({ data: [] as { card_id: string; photo_url: string }[] }),
      supabase.from('users').select('id, display_name, username').in('id', [...new Set(rows.map((r) => r.user_id))]),
    ]);
    const hidden = new Set((hiddenRes.data ?? []).map((h) => `${h.card_id}|${h.photo_url}`));
    const nameById = new Map(
      (usersRes.data ?? []).map((u) => [u.id as string, (u.display_name as string) || (u.username as string) || 'a FUZO member']),
    );

    const photos: CommunityPhoto[] = rows.flatMap((r) => {
      const urls = (r.photos?.length ? r.photos : r.image_url ? [r.image_url] : []).filter(isFuzoPhoto);
      return urls.map((url) => ({
        key: `${r.id}|${url}`,
        cardId: r.id,
        url,
        caption: r.caption,
        author: { id: r.user_id, name: nameById.get(r.user_id) ?? 'a FUZO member' },
        createdAt: r.created_at,
        hidden: hidden.has(`${r.id}|${url}`),
      }));
    });
    return { success: true, data: opts.includeHidden ? photos : photos.filter((p) => !p.hidden) };
  },

  /** Owner only (the database checks): hide or restore a community photo in their gallery. */
  async setHidden(restaurantId: string, photo: Pick<CommunityPhoto, 'cardId' | 'url'>, hide: boolean): Promise<ServiceResult<null>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };
    const { error } = hide
      ? await supabase
          .from('restaurant_gallery_hidden')
          .upsert({ restaurant_id: restaurantId, card_id: photo.cardId, photo_url: photo.url }, { onConflict: 'restaurant_id,card_id,photo_url', ignoreDuplicates: true })
      : await supabase
          .from('restaurant_gallery_hidden')
          .delete()
          .eq('restaurant_id', restaurantId)
          .eq('card_id', photo.cardId)
          .eq('photo_url', photo.url);
    if (error) return { success: false, error: error.message };
    return { success: true, data: null };
  },

  /** How many visits FUZO members made to a place (one per person per day). */
  async visitCount(ref: PlaceRef): Promise<number | null> {
    const keys = placeVisitKeys(ref);
    const supabase = createClient();
    if (!supabase || !keys.length) return null;
    const { data, error } = await supabase.rpc('get_place_visits', { p_keys: keys });
    if (error) return null; // e.g. before the migration is applied
    return Number(data) || 0;
  },
};

export default CommunityPhotosService;
