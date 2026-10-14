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

export interface PostPlace {
  /** Google place id, when the place came from Google / Scout search. */
  placeId?: string | null;
  name?: string | null;
  address?: string | null;
  lat: number;
  lng: number;
  /** The FUZO restaurant account, when the place is on FUZO. */
  restaurantId?: string | null;
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
  if (input.kind !== 'recipe' && !home && !input.place) return 'Add the location.';
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

export const PostService = {
  /**
   * Saves a post. status 'DRAFT' saves whatever is filled in; 'PUBLISHED'
   * first checks missingForPublish(). Pass existingId to update a draft or
   * edit a published post.
   */
  async save(input: PostInput, status: 'DRAFT' | 'PUBLISHED', existingId?: string): Promise<ServiceResult<FoodCardRecord>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return { success: false, error: 'Please sign in to post.' };

    if (status === 'PUBLISHED') {
      const missing = missingForPublish(input);
      if (missing) return { success: false, error: missing };
    }

    const uploaded = await uploadPhotos(input.photos.slice(0, MAX_POST_PHOTOS));
    if (!uploaded.success) return { success: false, error: uploaded.error };
    const photos = uploaded.data ?? [];

    const kind = input.kind;
    const home = kind === 'food' && !!input.isHome;
    const place = home || kind === 'recipe' ? null : input.place ?? null;

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

  /** Deletes the user's own post (its create points are taken back by the database). */
  async remove(id: string): Promise<ServiceResult<null>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };
    const { error } = await supabase.from('food_cards').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true, data: null };
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
      .in('card_type', Object.values(POST_CARD_TYPE))
      .order('updated_at', { ascending: false })
      .limit(50);
    if (error) return { success: false, error: error.message };
    return { success: true, data: (data ?? []) as FoodCardRecord[] };
  },
};

export default PostService;
