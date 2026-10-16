// Create flow (client, 2026-10-14; plan: docs/CREATE_FLOW_PLAN.md).
// Create opens the camera; the user takes or picks up to 5 photos, says what
// they are (Vibe / Food / Recipe / Restaurant), then fills that kind's steps.

import { MAX_POST_PHOTOS, type PostKind, type PostPlace } from '@/lib/services/postService';
import { DEFAULT_FLAVOR, emptyCardTags, type CardTags, type FlavorVector } from '@/lib/types/foodCard';
import type { NewPlaceFields } from '@/lib/services/communityPlacesService';

export type CreateMode = 'photo' | 'video' | 'url';

/** What the photos are (saved by PostService as that kind of post). */
export type CreateKind = PostKind;

/** 'video' = the video preview / cover step (video posts only). */
export type CreateStep = 'capture' | 'video' | 'kind' | 'details' | 'done';

export const MAX_PHOTOS = MAX_POST_PHOTOS;

// Video posts (client, 2026-10-16; plan: docs/VIDEO_URL_PLAN.md).
/** Longest video a post can have, in seconds. */
export const MAX_VIDEO_SECONDS = 60;
/** Largest file we try to work with (the storage limit is 100 MB per file). */
export const MAX_VIDEO_INPUT_BYTES = 1024 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024;

/** What a video is (2a / 2b / 2c in the client spec). */
export type VideoKind = 'video_recipe' | 'food_review' | 'food_tour';

/** Getting a gallery video ready to post (re-encoded to <= 720p, no hidden location data). */
export type VideoPrep =
  | { status: 'ready' }
  | { status: 'working'; progress: number }
  | { status: 'error'; message: string };

export interface CreateVideo {
  id: string;
  /** What gets uploaded: the recording, or the gallery file once prepared. null for a posted video (editing). */
  file: Blob | null;
  /** Object URL for previews, or the posted video's URL. */
  url: string;
  /** Seconds (from the recording timer or the file). */
  duration: number;
  width: number;
  height: number;
  source: 'camera' | 'gallery' | 'existing';
  /** Gallery videos are re-encoded before upload; recordings are ready at once. */
  prep: VideoPrep;
  /** The frame chosen as the cover, in seconds. */
  coverTime: number;
  /** That frame as a JPEG (made when leaving the preview) and its preview URL. */
  cover?: Blob | null;
  coverUrl?: string | null;
}

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
