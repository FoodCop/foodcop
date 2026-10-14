// Create flow (client, 2026-10-14; plan: docs/CREATE_FLOW_PLAN.md).
// Create opens the camera; the user takes or picks up to 5 photos, says what
// they are (Vibe / Food / Recipe / Restaurant), then fills that kind's steps.

import { MAX_POST_PHOTOS, type PostKind, type PostPlace } from '@/lib/services/postService';
import { DEFAULT_FLAVOR, emptyCardTags, type CardTags, type FlavorVector } from '@/lib/types/foodCard';
import type { NewPlaceFields } from '@/lib/services/communityPlacesService';

export type CreateMode = 'photo' | 'video' | 'url';

/** What the photos are (saved by PostService as that kind of post). */
export type CreateKind = PostKind;

export type CreateStep = 'capture' | 'kind' | 'details' | 'done';

export const MAX_PHOTOS = MAX_POST_PHOTOS;

export interface CreatePhoto {
  id: string;
  /**
   * The image itself: a camera frame (JPEG) or the gallery file as picked
   * (keeps its EXIF, e.g. GPS). null for a photo already posted (editing).
   */
  file: Blob | null;
  /** Object URL for previews (revoked when removed / on close), or the posted photo's URL. */
  url: string;
  source: 'camera' | 'gallery' | 'existing';
}

/** Everything the user fills in after the photos (kept by CreateFlow so Back never loses it). */
export interface PostFields {
  title: string;
  caption: string;
  tags: CardTags;
  flavorProfile: FlavorVector;
  businessIdentity: string[];
  labels: string[];
  isHome: boolean;
  place: PostPlace | null;
  menuItemId: string | null;
  ingredients: [string, string, string][];
  steps: string[];
  /** Restaurant posts: a restaurant that isn't on the map yet (Phase 7), instead of `place`. */
  newPlace: NewPlaceFields | null;
}

export const emptyPostFields = (): PostFields => ({
  title: '',
  caption: '',
  tags: emptyCardTags(),
  flavorProfile: { ...DEFAULT_FLAVOR },
  businessIdentity: [],
  labels: [],
  isHome: false,
  place: null,
  menuItemId: null,
  ingredients: [],
  steps: [],
  newPlace: null,
});
