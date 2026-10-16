// Opening a saved post in the Create flow again (client, 2026-10-14; plan
// Phase 8): a draft to finish, or a published post to edit. Turns the
// food_cards row back into the flow's kind, photos and answers.

import { DEFAULT_FLAVOR, emptyCardTags, type FoodCardRecord, type FoodCardType } from '@/lib/types/foodCard';
import { emptyNewPlace, type NewPlaceFields } from '@/lib/services/communityPlacesService';
import { MAX_POST_PHOTOS } from '@/lib/services/postService';
import type { CreateKind, CreatePhoto, CreateVideo, PostFields, VideoKind } from './types';

const KIND_BY_TYPE: Partial<Record<FoodCardType, CreateKind>> = {
  VIBE_PHOTO: 'vibe',
  FOOD_PHOTO: 'food',
  RESTAURANT_PHOTO: 'restaurant',
  RECIPE: 'recipe',
};

/** The Create-flow kind of a post, or null for older card types the flow doesn't make. */
export const kindOfCard = (card: Pick<FoodCardRecord, 'card_type'>): CreateKind | null => KIND_BY_TYPE[card.card_type] ?? null;

// Video posts (client, 2026-10-16; docs/VIDEO_URL_PLAN.md).
const VIDEO_KIND_BY_TYPE: Partial<Record<FoodCardType, VideoKind>> = {
  RECIPE_VIDEO: 'video_recipe',
  REVIEW_VIDEO: 'food_review',
  TOUR_VIDEO: 'food_tour',
};

/** A video post's kind, or null for other posts. */
export const videoKindOfCard = (card: Pick<FoodCardRecord, 'card_type'>): VideoKind | null => VIDEO_KIND_BY_TYPE[card.card_type] ?? null;

/** A video post's clip as an already-uploaded Create video (null if it has none, e.g. an early draft). */
export function videoOfCard(card: FoodCardRecord): CreateVideo | null {
  if (!card.media_url || !/^https:\/\//i.test(card.media_url)) return null;
  return {
    id: `existing-video-${card.id}`,
    file: null,
    url: card.media_url,
    duration: Number(card.video_duration) || 0,
    width: card.video_width ?? 0,
    height: card.video_height ?? 0,
    source: 'existing',
    prep: { status: 'ready' },
    coverTime: 0,
    cover: null,
    coverUrl: card.image_url ?? null,
  };
}

/**
 * Whether the Create flow can edit this card. Recipes made with the older
 * recipe studio have no photos list but do have a cover photo, so they open too.
 */
export const canEditInCreate = (card: FoodCardRecord) => kindOfCard(card) !== null || videoKindOfCard(card) !== null;

/** The post's photos as already-uploaded Create photos. */
export function photosOfCard(card: FoodCardRecord): CreatePhoto[] {
  const urls = card.photos?.length ? card.photos : card.image_url ? [card.image_url] : [];
  return urls
    // Older recipe-studio cards may keep their cover as a data: URL.
    .filter((u) => /^(https?:\/\/|data:image\/)/i.test(u))
    .slice(0, MAX_POST_PHOTOS)
    .map((url, i) => ({ id: `existing-${i}`, file: null, url, source: 'existing' as const }));
}

const isNewPlace = (v: unknown): v is Partial<NewPlaceFields> => !!v && typeof v === 'object' && !Array.isArray(v);

/** The post's answers. */
export function fieldsOfCard(card: FoodCardRecord): PostFields {
  const tags = { ...emptyCardTags(), ...(card.tags ?? {}) };
  // A tour's position is its first stop; its places are the stops themselves.
  const hasPlace = typeof card.lat === 'number' && typeof card.lng === 'number' && !card.is_home && card.card_type !== 'TOUR_VIDEO';
  const newPlace = card.new_place && isNewPlace(card.new_place) ? { ...emptyNewPlace(), ...card.new_place } : null;
  return {
    title: card.title === 'Untitled' ? '' : card.title ?? '',
    caption: card.caption ?? '',
    tags,
    flavorProfile: { ...DEFAULT_FLAVOR, ...(card.flavor_profile ?? {}) },
    businessIdentity: card.business_identity ?? [],
    labels: card.labels ?? [],
    isHome: !!card.is_home,
    place:
      hasPlace && !newPlace
        ? {
            placeId: card.place_id ?? null,
            name: card.place_name ?? null,
            address: card.address ?? null,
            lat: card.lat as number,
            lng: card.lng as number,
            restaurantId: card.restaurant_id ?? null,
            communityPlaceId: card.community_place_id ?? null,
          }
        : null,
    menuItemId: card.menu_item_id ?? null,
    ingredients: (card.ingredients ?? []).map((r) => [r[0] ?? '', r[1] ?? '', r[2] ?? ''] as [string, string, string]),
    steps: card.steps ?? [],
    newPlace,
    stops: card.stops ?? [],
  };
}
