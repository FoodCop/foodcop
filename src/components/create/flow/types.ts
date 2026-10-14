// Create flow (client, 2026-10-14; plan: docs/CREATE_FLOW_PLAN.md).
// Create opens the camera; the user takes or picks up to 5 photos, says what
// they are (Vibe / Food / Recipe / Restaurant), then fills that kind's steps.

import { MAX_POST_PHOTOS, type PostKind, type PostPlace } from '@/lib/services/postService';
import { DEFAULT_FLAVOR, emptyCardTags, type CardTags, type FlavorVector } from '@/lib/types/foodCard';

export type CreateMode = 'photo' | 'video' | 'url';

/** What the photos are (saved by PostService as that kind of post). */
export type CreateKind = PostKind;

export type CreateStep = 'capture' | 'kind' | 'details' | 'done';

export const MAX_PHOTOS = MAX_POST_PHOTOS;

export interface CreatePhoto {
  id: string;
  /** The image itself: a camera frame (JPEG) or the gallery file as picked (keeps its EXIF, e.g. GPS). */
  file: Blob;
  /** Object URL for previews; revoked when the photo is removed or the flow closes. */
  url: string;
  source: 'camera' | 'gallery';
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
});
