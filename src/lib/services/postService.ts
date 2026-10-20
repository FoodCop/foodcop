/**
 * POST SERVICE - saving posts from the camera Create flow (client, 2026-10-14;
 * plan: docs/CREATE_FLOW_PLAN.md). Posts are food_cards rows
 * (20261014000000_create_flow_posts.sql), so the Feed, Profile, likes,
 * My Plate, sharing and points treat them like any other card.
 *
 * One write path for every kind: upload the new photos, check the rules,
 * insert or update the row (drafts included), award points on publish.
 */

import { createClient } from '@/lib/supabase/client';
import { MediaUploadService } from '@/lib/services/mediaUploadService';
import { PointsService, type PointsActionType } from '@/lib/services/pointsService';
import { CommunityPlacesService, type NewPlaceFields, type PlaceDuplicate } from '@/lib/services/communityPlacesService';
import { VIDEO_CARD_TYPE } from '@/lib/services/videoPostService';
import type { ServiceResult } from '@/lib/types/serviceResult';
import {
  DEFAULT_FLAVOR,
  emptyCardTags,
  type CardTags,
  type FlavorVector,
  type FoodCardRecord,
  type FoodCardType,
} from '@/lib/types/foodCard';

export type PostKind = 'vibe' | 'food' | 'recipe' | 'restaurant';

export const MAX_POST_PHOTOS = 5;

export const POST_CARD_TYPE: Record<PostKind, FoodCardType> = {
  vibe: 'VIBE_PHOTO',
  food: 'FOOD_PHOTO',
  recipe: 'RECIPE',
  restaurant: 'RESTAURANT_PHOTO',
};

const POINTS_ACTION: Record<PostKind, PointsActionType> = {
  vibe: 'create_discovery',
  food: 'create_discovery',
  recipe: 'create_recipe',
  restaurant: 'create_restaurant',
};

/** Suggested tags for Food posts; users can add their own too. */
export const SUGGESTED_LABELS = ['Must-Try Dish', 'Must-Try Spot', 'Weird Combo', 'Kitchen Trick'];

/** Suggested tags for Restaurant posts; users can add their own too. */
export const RESTAURANT_LABELS = ['Must-Try Spot', 'Hidden Gem', 'Great Ambience', 'Date Night', 'Family Friendly', 'Good Value'];

export interface PostPlace {
  /** Google place id, when the place came from Google / Scout search. */
  placeId?: string | null;
  name?: string | null;
  address?: string | null;
  lat: number;
  lng: number;
  /** The FUZO restaurant account, when the place is on FUZO. */
  restaurantId?: string | null;
  /** A community-added place (Phase 7). */
  communityPlaceId?: string | null;
}

export interface PostInput {
  kind: PostKind;
  /** New photos (Blobs from the camera / gallery) and already-uploaded URLs (drafts, edits), in order. */
  photos: (Blob | string)[];
  /** Food name (food / recipe), or a short title. */
  title?: string;
  caption?: string;
  tags?: CardTags;
  flavorProfile?: FlavorVector;
  businessIdentity?: string[];
  labels?: string[];
  isHome?: boolean;
  place?: PostPlace | null;
  menuItemId?: string | null;
  /** Recipe ingredients as [name, quantity, unit] (same order as older recipe cards). */
  ingredients?: [string, string, string][];
  steps?: string[];
  /** Restaurant posts: add this new restaurant to the map on publish. */
  newPlace?: NewPlaceFields | null;
  /** Imported by its link (URL tab): the original post, credited to its creator. */
  source?: { url: string; platform: string; author?: string | null } | null;
}

const clean = (values: string[] | undefined, maxLen: number, maxCount: number) =>
  [...new Set((values ?? []).map((v) => v.trim().replace(/\s+/g, ' ')).filter(Boolean).map((v) => v.slice(0, maxLen)))].slice(0, maxCount);

/**
 * What's still missing before this post can be published, or null when it's
 * ready. The database enforces the photo and location rules too.
 */
export function missingForPublish(input: PostInput): string | null {
  const tags = input.tags ?? emptyCardTags();
  if (input.photos.length === 0) return 'Add at least one photo.';
  if (input.photos.length > MAX_POST_PHOTOS) return `Up to ${MAX_POST_PHOTOS} photos per post.`;
  const home = input.kind === 'food' && !!input.isHome;
  if (input.kind === 'restaurant' && input.newPlace) {
    const np = input.newPlace;
    if (np.name.trim().length < 2) return 'Add the restaurant name.';
    if (np.lat == null || np.lng == null) return 'Set the restaurant on the map.';
    if (!np.category) return 'Pick a category.';
    return null;
  }
  if (input.kind !== 'recipe' && !home && !input.place) return input.kind === 'restaurant' ? 'Pick the restaurant.' : 'Add the location.';
  switch (input.kind) {
    case 'vibe':
      if (tags.meal_type.length === 0) return 'Pick a meal type.';
      if (tags.diet.length === 0) return 'Pick a dietary type.';
      if (clean(input.businessIdentity, 40, 12).length === 0) return 'Pick at least one business identity.';
      return null;
    case 'food':
      if (!input.title?.trim()) return 'Add the food name.';
      return null;
    case 'recipe':
      if (!input.title?.trim()) return 'Add the food name.';
      if (tags.cuisine.length === 0) return 'Pick a cuisine.';
      if (!(input.ingredients ?? []).some((row) => row[0]?.trim())) return 'Add at least one ingredient.';
      if (!(input.steps ?? []).some((s) => s.trim())) return 'Add at least one step.';
      return null;
    case 'restaurant':
      // Only listed places for now; adding a new restaurant comes in Phase 7.
      if (!input.place?.placeId && !input.place?.restaurantId && !input.place?.communityPlaceId) return 'Pick the restaurant from search.';
      return null;
  }
}

async function uploadPhotos(photos: (Blob | string)[]): Promise<ServiceResult<string[]>> {
  const results = await Promise.all(
    photos.map((p) => (typeof p === 'string' ? Promise.resolve<ServiceResult<string>>({ success: true, data: p }) : MediaUploadService.uploadPostPhoto(p))),
  );
  const failed = results.find((r) => !r.success);
  if (failed && !failed.success) return { success: false, error: failed.error || 'A photo could not be uploaded.' };
  return { success: true, data: results.map((r) => (r.success ? r.data! : '')) };
}


/**
 * Under-18s start with "no exact location on posts" (user_settings.
 * post_exact_location, onboarding phase 1; they can turn it back on). A
 * private spot - a dropped pin or the photo's own GPS, not a listed place -
 * is then saved rounded to about 1 km, without the street address.
 */
export async function blurPrivateSpot<P extends { lat: number; lng: number; address?: string | null; placeId?: string | null; communityPlaceId?: string | null; restaurantId?: string | null }>(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  userId: string,
  place: P | null,
): Promise<P | null> {
  if (!place || place.placeId || place.communityPlaceId || place.restaurantId) return place;
  const { data, error } = await supabase.from('user_settings').select('post_exact_location').eq('user_id', userId).maybeSingle();
  if (error || data?.post_exact_location !== false) return place;
  return { ...place, lat: Math.round(place.lat * 100) / 100, lng: Math.round(place.lng * 100) / 100, address: null };
}

export const PostService = {
  /**
   * Saves a post. status 'DRAFT' saves whatever is filled in; 'PUBLISHED'
   * first checks missingForPublish(). Pass existingId to update a draft or
   * edit a published post.
   */
  async save(
    input: PostInput,
    status: 'DRAFT' | 'PUBLISHED',
    existingId?: string,
  ): Promise<ServiceResult<FoodCardRecord> & { duplicate?: PlaceDuplicate }> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return { success: false, error: 'Please sign in to post.' };

    if (status === 'PUBLISHED') {
      const missing = missingForPublish(input);
      if (missing) return { success: false, error: missing };
    }

    const kind = input.kind;
    const home = kind === 'food' && !!input.isHome;
    const newPlace = kind === 'restaurant' ? input.newPlace ?? null : null;

    // A new restaurant is added to the map when the post is published (the
    // duplicate check runs first, so nothing is uploaded for a duplicate).
    let place = home || kind === 'recipe' ? null : input.place ?? null;
    if (newPlace) {
      place = newPlace.lat != null && newPlace.lng != null ? { name: newPlace.name.trim(), address: newPlace.address.trim() || null, lat: newPlace.lat, lng: newPlace.lng } : null;
      if (status === 'PUBLISHED') {
        const added = await CommunityPlacesService.add(newPlace);
        if (!added.success) return { success: false, error: added.error, duplicate: added.duplicate };
        place = { ...place!, communityPlaceId: added.data };
      }
    }

    place = await blurPrivateSpot(supabase, userId, place);

    const uploaded = await uploadPhotos(input.photos.slice(0, MAX_POST_PHOTOS));
    if (!uploaded.success) return { success: false, error: uploaded.error };
    const photos = uploaded.data ?? [];

    const row = {
      user_id: userId,
      card_type: POST_CARD_TYPE[kind],
      title: input.title?.trim().slice(0, 120) || (kind === 'vibe' ? place?.name?.slice(0, 120) || 'Vibe' : 'Untitled'),
      caption: input.caption?.trim() || null,
      tags: input.tags ?? emptyCardTags(),
      flavor_profile: input.flavorProfile ?? DEFAULT_FLAVOR,
      ingredients: kind === 'recipe' ? (input.ingredients ?? []).filter((r) => r[0]?.trim()).map((r) => r.map((x) => x.trim()) as [string, string, string]) : [],
      steps: kind === 'recipe' ? (input.steps ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 50) : [],
      photos,
      image_url: photos[0] ?? null,
      business_identity: kind === 'vibe' ? clean(input.businessIdentity, 40, 12) : [],
      labels: clean(input.labels, 30, 12),
      is_home: home,
      place_id: place?.placeId ?? null,
      place_name: place?.name?.slice(0, 200) ?? null,
      address: place?.address?.slice(0, 300) ?? null,
      lat: place?.lat ?? null,
      lng: place?.lng ?? null,
      restaurant_id: place?.restaurantId ?? null,
      ...(input.source
        ? { source_url: input.source.url.slice(0, 600), source_platform: input.source.platform, source_author: input.source.author?.slice(0, 120) ?? null }
        : {}),
      // Only sent when used, so other posts work before the Phase 7 migration.
      ...(place?.communityPlaceId ? { community_place_id: place.communityPlaceId } : {}),
      // Drafts keep the new restaurant's details until it's published.
      ...(newPlace && status === 'DRAFT' ? { new_place: newPlace } : existingId && kind === 'restaurant' ? { new_place: null } : {}),
      menu_item_id: kind === 'food' && !home ? input.menuItemId ?? null : null,
      status,
      updated_at: new Date().toISOString(),
    };

    const query = existingId
      ? supabase.from('food_cards').update(row).eq('id', existingId).eq('user_id', userId)
      : supabase.from('food_cards').insert(row);
    const { data, error } = await query.select().single();
    if (error) return { success: false, error: error.message };

    const card = data as FoodCardRecord;
    if (status === 'PUBLISHED') {
      // Best effort: a points hiccup never fails the post. Re-publishing is a no-op.
      try {
        await PointsService.awardPoints({ actionType: POINTS_ACTION[kind], sourceType: 'food_card', sourceId: card.id });
      } catch (pointsError) {
        console.warn('Post points award failed:', pointsError);
      }
    }
    return { success: true, data: card };
  },

  /**
   * Counts a visit to the post's place when the user is there right now
   * (within 150 m, at most once a day - checked by the database). Only for
   * published posts about a place; true when a new visit was counted.
   */
  async recordVisit(cardId: string): Promise<boolean> {
    const supabase = createClient();
    if (!supabase || typeof navigator === 'undefined' || !navigator.geolocation) return false;
    const here = await new Promise<GeolocationCoordinates | null>((resolve) =>
      navigator.geolocation.getCurrentPosition(
        (p) => resolve(p.coords),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      ),
    );
    // A fix vaguer than the 150 m radius can't tell whether they're there.
    if (!here || here.accuracy > 150) return false;
    const { data, error } = await supabase.rpc('record_post_visit', { p_card_id: cardId, p_lat: here.latitude, p_lng: here.longitude });
    if (error) {
      console.warn('Visit not recorded:', error.message);
      return false;
    }
    return data === true;
  },

  /** Deletes the user's own post (its create points are taken back by the database). */
  async remove(id: string): Promise<ServiceResult<null>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return { success: false, error: 'Please sign in.' };
    const { data: card } = await supabase.from('food_cards').select('photos, image_url, media_url').eq('id', id).eq('user_id', userId).maybeSingle();
    const { data: gone, error } = await supabase.from('food_cards').delete().eq('id', id).eq('user_id', userId).select('id');
    if (error) return { success: false, error: error.message };
    if (!gone?.length) return { success: false, error: 'This post was already deleted.' };
    // Then its photos (best effort).
    const urls = [
      ...((card?.photos as string[] | null) ?? []),
      ...(card?.image_url ? [card.image_url as string] : []),
      ...(card?.media_url ? [card.media_url as string] : []),
    ];
    await MediaUploadService.removePostPhotos([...new Set(urls)]);
    return { success: true, data: null };
  },

  /** The signed-in user's drafts (empty when signed out). */
  async listMyDrafts(): Promise<ServiceResult<FoodCardRecord[]>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return { success: true, data: [] };
    return this.listDrafts(userId);
  },

  /** The user's unfinished camera posts, newest first. */
  async listDrafts(userId: string): Promise<ServiceResult<FoodCardRecord[]>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };
    const { data, error } = await supabase
      .from('food_cards')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'DRAFT')
      // Photo posts and video posts (client, 2026-10-16).
      .in('card_type', [...Object.values(POST_CARD_TYPE), ...Object.values(VIDEO_CARD_TYPE)])
      .order('updated_at', { ascending: false })
      .limit(50);
    if (error) return { success: false, error: error.message };
    return { success: true, data: (data ?? []) as FoodCardRecord[] };
  },
};

export default PostService;
