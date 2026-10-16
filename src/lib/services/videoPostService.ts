/**
 * VIDEO POST SERVICE - saving video posts (client, 2026-10-16; plan:
 * docs/VIDEO_URL_PLAN.md). Video posts are food_cards rows like photo posts
 * (20261016000000_video_posts.sql): the video is media_url, its cover
 * image_url. They show in Trims and Profile -> Videos.
 *
 *   video_recipe (2a) -> RECIPE_VIDEO: dish name, ingredients, steps
 *   food_review  (2b) -> REVIEW_VIDEO: place + food name
 *   food_tour    (2c) -> TOUR_VIDEO:   2-10 stops, each a place (+ dish)
 *
 * URL imports (3a) save the original link instead of an uploaded video.
 */

import { createClient } from '@/lib/supabase/client';
import { MediaUploadService } from '@/lib/services/mediaUploadService';
import { PointsService } from '@/lib/services/pointsService';
import type { PostPlace } from '@/lib/services/postService';
import type { ServiceResult } from '@/lib/types/serviceResult';
import {
  DEFAULT_FLAVOR,
  emptyCardTags,
  type CardTags,
  type FlavorVector,
  type FoodCardRecord,
  type FoodCardType,
  type TourStop,
} from '@/lib/types/foodCard';

export type VideoPostKind = 'video_recipe' | 'food_review' | 'food_tour';

export const VIDEO_CARD_TYPE: Record<VideoPostKind, FoodCardType> = {
  video_recipe: 'RECIPE_VIDEO',
  food_review: 'REVIEW_VIDEO',
  food_tour: 'TOUR_VIDEO',
};

export const MAX_VIDEO_SECONDS = 60;
export const MIN_TOUR_STOPS = 2;
export const MAX_TOUR_STOPS = 10;

export type SourcePlatform = 'instagram' | 'tiktok' | 'facebook' | 'pinterest' | 'youtube' | 'web';

export interface VideoPostInput {
  kind: VideoPostKind;
  /** The new clip (Blob) or the already-uploaded one (URL, when editing). null for a URL import. */
  video: Blob | string | null;
  /** The cover frame (JPEG Blob) or its URL. */
  cover: Blob | string | null;
  duration: number;
  width?: number;
  height?: number;
  /** Dish name (recipe), food name (review) or the tour's name. */
  title?: string;
  caption?: string;
  tags?: CardTags;
  flavorProfile?: FlavorVector;
  labels?: string[];
  /** Recipe: [name, quantity, unit] rows and steps. */
  ingredients?: [string, string, string][];
  steps?: string[];
  /** Review: where it was. */
  place?: PostPlace | null;
  /** Tour: the stops, in order. */
  stops?: TourStop[];
  /** URL import: the original post. */
  source?: { url: string; platform: SourcePlatform; author?: string | null } | null;
}

const clean = (values: string[] | undefined, maxLen: number, maxCount: number) =>
  [...new Set((values ?? []).map((v) => v.trim().replace(/\s+/g, ' ')).filter(Boolean).map((v) => v.slice(0, maxLen)))].slice(0, maxCount);

const validStop = (s: TourStop) => typeof s.lat === 'number' && typeof s.lng === 'number' && Math.abs(s.lat) <= 90 && Math.abs(s.lng) <= 180;

/** What's still missing before this video can be posted, or null when it's ready. The database checks too. */
export function missingForVideoPublish(input: VideoPostInput): string | null {
  if (!input.video && !input.source) return 'Add a video.';
  if (input.video && !input.cover) return 'Choose a cover for your video.';
  if (input.video && !(input.duration > 0)) return 'This video has no length. Try recording it again.';
  if (input.duration > MAX_VIDEO_SECONDS + 0.5) return `Videos can be up to ${MAX_VIDEO_SECONDS} seconds.`;
  switch (input.kind) {
    case 'video_recipe':
      if (!input.title?.trim()) return 'Add the dish name.';
      if (!(input.ingredients ?? []).some((row) => row[0]?.trim())) return 'Add at least one ingredient.';
      return null;
    case 'food_review':
      if (!input.place) return 'Add the place.';
      if (!input.title?.trim()) return 'Add the food name.';
      return null;
    case 'food_tour': {
      const stops = (input.stops ?? []).filter(validStop);
      if (stops.length < MIN_TOUR_STOPS) return `Add at least ${MIN_TOUR_STOPS} stops.`;
      if (stops.length > MAX_TOUR_STOPS) return `Up to ${MAX_TOUR_STOPS} stops per tour.`;
      return null;
    }
  }
}

const cleanStops = (stops: TourStop[] | undefined): TourStop[] =>
  (stops ?? [])
    .filter(validStop)
    .slice(0, MAX_TOUR_STOPS)
    .map((s) => ({
      name: (s.name || 'Stop').trim().slice(0, 200),
      address: s.address?.trim().slice(0, 300) || null,
      lat: s.lat,
      lng: s.lng,
      placeId: s.placeId ?? null,
      restaurantId: s.restaurantId ?? null,
      communityPlaceId: s.communityPlaceId ?? null,
      dish: s.dish?.trim().slice(0, 120) || null,
    }));

export const VideoPostService = {
  /**
   * Saves a video post. 'DRAFT' keeps whatever is filled in; 'PUBLISHED'
   * checks missingForVideoPublish() first. Pass existingId to update.
   */
  async save(input: VideoPostInput, status: 'DRAFT' | 'PUBLISHED', existingId?: string): Promise<ServiceResult<FoodCardRecord>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return { success: false, error: 'Please sign in to post.' };

    if (status === 'PUBLISHED') {
      const missing = missingForVideoPublish(input);
      if (missing) return { success: false, error: missing };
    }

    // Upload what's new (the video and its cover); remember them so a failed save doesn't leave files behind.
    const uploaded: string[] = [];
    const upload = async (item: Blob | string | null, kind: 'video' | 'cover'): Promise<ServiceResult<string | null>> => {
      if (!item) return { success: true, data: null };
      if (typeof item === 'string') return { success: true, data: item };
      const res = kind === 'video' ? await MediaUploadService.uploadPostVideo(item) : await MediaUploadService.uploadPostPhoto(item);
      if (res.success && res.data) uploaded.push(res.data);
      return res;
    };
    const videoRes = await upload(input.video, 'video');
    if (!videoRes.success) return { success: false, error: videoRes.error || 'The video could not be uploaded.' };
    const coverRes = await upload(input.cover, 'cover');
    if (!coverRes.success) {
      await MediaUploadService.removePostPhotos(uploaded);
      return { success: false, error: coverRes.error || 'The cover could not be uploaded.' };
    }

    const kind = input.kind;
    const stops = kind === 'food_tour' ? cleanStops(input.stops) : [];
    const place = kind === 'food_review' ? input.place ?? null : null;
    // Tours sit at their first stop (so they can show up "near you").
    const anchor = place ?? (stops[0] ? { lat: stops[0].lat, lng: stops[0].lng, name: stops[0].name, placeId: stops[0].placeId ?? null } : null);
    const title =
      input.title?.trim().slice(0, 120) ||
      (kind === 'food_review' ? place?.name?.slice(0, 120) : kind === 'food_tour' && stops.length ? `Food tour: ${stops.map((s) => s.name).slice(0, 3).join(', ')}`.slice(0, 120) : '') ||
      'Untitled';

    const row = {
      user_id: userId,
      card_type: VIDEO_CARD_TYPE[kind],
      title,
      caption: input.caption?.trim() || null,
      tags: input.tags ?? emptyCardTags(),
      flavor_profile: input.flavorProfile ?? DEFAULT_FLAVOR,
      ingredients:
        kind === 'video_recipe'
          ? (input.ingredients ?? []).filter((r) => r[0]?.trim()).map((r) => r.map((x) => x.trim()) as [string, string, string])
          : [],
      steps: kind === 'video_recipe' ? (input.steps ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 50) : [],
      labels: clean(input.labels, 30, 12),
      photos: [],
      media_url: videoRes.data ?? null,
      image_url: coverRes.data ?? null,
      video_duration: input.video ? Math.round(Math.min(input.duration, MAX_VIDEO_SECONDS + 0.5) * 100) / 100 : null,
      video_width: input.width ? Math.round(input.width) : null,
      video_height: input.height ? Math.round(input.height) : null,
      stops,
      place_id: anchor?.placeId ?? null,
      place_name: anchor?.name?.slice(0, 200) ?? null,
      address: place?.address?.slice(0, 300) ?? null,
      lat: anchor?.lat ?? null,
      lng: anchor?.lng ?? null,
      restaurant_id: place?.restaurantId ?? null,
      community_place_id: place?.communityPlaceId ?? null,
      is_home: false,
      ...(input.source
        ? { source_url: input.source.url.slice(0, 600), source_platform: input.source.platform, source_author: input.source.author?.slice(0, 120) ?? null }
        : {}),
      status,
      updated_at: new Date().toISOString(),
    };

    const query = existingId
      ? supabase.from('food_cards').update(row).eq('id', existingId).eq('user_id', userId)
      : supabase.from('food_cards').insert(row);
    const { data, error } = await query.select().single();
    if (error) {
      await MediaUploadService.removePostPhotos(uploaded);
      const missingDb = /RECIPE_VIDEO|REVIEW_VIDEO|TOUR_VIDEO|card_type_check|video_duration|stops|schema cache|PGRST204/i.test(error.message);
      return { success: false, error: missingDb ? 'Video posts need the latest database update.' : error.message };
    }

    const card = data as FoodCardRecord;
    if (status === 'PUBLISHED') {
      // Best effort: a points hiccup never fails the post. Once per post.
      try {
        await PointsService.awardPoints({ actionType: 'create_video', sourceType: 'food_card', sourceId: card.id });
      } catch (pointsError) {
        console.warn('Video post points award failed:', pointsError);
      }
    }
    return { success: true, data: card };
  },
};

export default VideoPostService;
