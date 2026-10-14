// Create flow (client, 2026-10-14; plan: docs/CREATE_FLOW_PLAN.md).
// Create opens the camera; the user takes or picks up to 5 photos, says what
// they are (Vibe / Food / Recipe / Restaurant), then fills that kind's steps.

import { MAX_POST_PHOTOS, type PostKind } from '@/lib/services/postService';

export type CreateMode = 'photo' | 'video' | 'url';

/** What the photos are (saved by PostService as that kind of post). */
export type CreateKind = PostKind;

export type CreateStep = 'capture' | 'kind' | 'details';

export const MAX_PHOTOS = MAX_POST_PHOTOS;

export interface CreatePhoto {
  id: string;
  /** The image itself: a camera frame (JPEG) or the gallery file as picked (keeps its EXIF, e.g. GPS). */
  file: Blob;
  /** Object URL for previews; revoked when the photo is removed or the flow closes. */
  url: string;
  source: 'camera' | 'gallery';
}
