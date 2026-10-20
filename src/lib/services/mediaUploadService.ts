/**
 * Uploads raw media Files (currently just Trims video uploads) to the
 * 'food-card-media' Supabase Storage bucket and returns a real, durable
 * public URL - closing the gap where VideoCardStudio's upload path set
 * media_url to a local URL.createObjectURL() blob that never outlived the
 * current page/session. Photo uploads don't need this: they already persist
 * fine as data URLs directly in food_cards.image_url.
 */

import { createClient } from '@/lib/supabase/client';
import type { ServiceResult } from '@/lib/types/serviceResult';

const BUCKET = 'food-card-media';
const PROFILE_BUCKET = 'profile-media';
const FOOD_MOMENTS_BUCKET = 'food-moments';

// Big camera photos are shrunk before upload (max 1600px, JPEG) - faster, and keeps well under bucket size limits.
// alwaysReencode: re-save even small photos, which also drops their EXIF data (e.g. the GPS spot it was taken).
async function downscaleImage(blob: Blob, maxSide = 1600, alwaysReencode = false): Promise<Blob> {
  try {
    if (typeof createImageBitmap === 'undefined' || typeof document === 'undefined') return blob;
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (!alwaysReencode && scale === 1 && blob.size < 1_500_000) { bitmap.close(); return blob; }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) { bitmap.close(); return blob; }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    return out ?? blob;
  } catch {
    return blob;
  }
}

// data URL fingerprint -> hosted URL, so re-sharing the same photo doesn't upload it again.
const hostedImageCache = new Map<string, string>();


// Unguessable file names (security review, 2026-10-07): uploads are served
// from public buckets, so a file's URL is the only thing protecting it - a
// timestamp plus 6 random characters could be guessed.
const uploadId = () => crypto.randomUUID();
export const MediaUploadService = {
  async uploadVideo(file: File): Promise<ServiceResult<string>> {
    const supabase = createClient();
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) {
      return { success: false, error: 'You must be logged in to upload a video' };
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const path = `${userId}/${uploadId()}.${extension}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || 'video/mp4',
      cacheControl: '3600',
      upsert: false,
    });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { success: true, data: data.publicUrl };
  },

  /**
   * A photo for a Create flow post (camera shot or gallery pick, as a Blob).
   * Shrunk to at most 1600px, stored under the user's own folder in
   * food-card-media with an unguessable name, and returned as a public URL.
   */
  async uploadPostPhoto(photo: Blob): Promise<ServiceResult<string>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return { success: false, error: 'You must be logged in to post a photo' };

    // Always re-saved as JPEG: public photos must not carry the phone's EXIF
    // data (the exact spot it was taken, the device).
    const blob = await downscaleImage(photo, 1600, true);
    if (blob.type !== 'image/jpeg') return { success: false, error: `This photo type can't be posted (${photo.type || 'unknown'}). Try a JPEG or PNG.` };
    const path = `${userId}/post-${uploadId()}.jpg`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
    if (error) return { success: false, error: error.message };
    return { success: true, data: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
  },

  /**
   * A video post's video (client, 2026-10-16; docs/VIDEO_URL_PLAN.md): the
   * recording or the prepared gallery clip, already small (<= 720p) and
   * without hidden location data. Saved as "<user id>/video-<uuid>.<ext>".
   */
  async uploadPostVideo(video: Blob): Promise<ServiceResult<string>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return { success: false, error: 'You must be logged in to post a video' };
    const type = (video.type || 'video/webm').split(';')[0].trim();
    const ext = type === 'video/mp4' ? 'mp4' : type === 'video/quicktime' ? 'mov' : type === 'video/webm' ? 'webm' : null;
    if (!ext) return { success: false, error: "This video type can't be posted. Try another video." };
    if (video.size > 100 * 1024 * 1024) return { success: false, error: 'This video is too big (over 100 MB). Choose a shorter clip.' };
    const path = `${userId}/video-${uploadId()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, video, { contentType: type, cacheControl: '31536000', upsert: false });
    if (error) return { success: false, error: error.message };
    return { success: true, data: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
  },

  /**
   * Best effort: deletes post photos (and videos) the user removed (editing a
   * post, or deleting it). Only the caller's own Create-flow uploads
   * ("<their id>/post-<uuid>.jpg", "<their id>/video-<uuid>.mp4|webm|mov")
   * are touched; storage rules check it too.
   */
  async removePostPhotos(urls: string[]): Promise<void> {
    const supabase = createClient();
    if (!supabase || !urls.length) return;
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return;
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const paths = urls
      .map((u) => {
        const i = u.indexOf(marker);
        return i >= 0 ? decodeURIComponent(u.slice(i + marker.length).split('?')[0]) : null;
      })
      .filter((p): p is string => !!p && new RegExp(`^${userId}/(post-[0-9a-f-]{36}[.]jpg|video-[0-9a-f-]{36}[.](mp4|webm|mov))$`, 'i').test(p));
    if (!paths.length) return;
    const { error } = await supabase.storage.from(BUCKET).remove(paths);
    if (error) console.warn('Old post photos not removed:', error.message);
  },

  /**
   * Upload a photo that exists only as a data URL (how card photos are stored) and return a
   * durable public URL. Used when sharing a card in chat, where a multi-megabyte data URL can't
   * travel inside a message. Repeated shares of the same photo reuse the first upload.
   */
  async uploadDataUrlImage(dataUrl: string): Promise<ServiceResult<string>> {
    const fingerprint = dataUrl.length + ':' + dataUrl.slice(-64);
    const cached = hostedImageCache.get(fingerprint);
    if (cached) return { success: true, data: cached };

    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return { success: false, error: 'You must be logged in to share a photo' };

    let original: Blob;
    try {
      original = await (await fetch(dataUrl)).blob();
    } catch {
      return { success: false, error: 'Could not read that photo' };
    }
    const blob = await downscaleImage(original);
    const type = ['image/jpeg', 'image/png', 'image/webp'].includes(blob.type) ? blob.type : null;
    if (!type) return { success: false, error: `Unsupported photo type (${blob.type || 'unknown'})` };

    const extension = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${userId}/shared-${uploadId()}.${extension}`;

    // food-card-media is the intended home (needs 20260920000000_food_card_images_bucket.sql to accept
    // images); until that runs, fall back to profile-media, which already accepts jpeg/png/webp.
    let lastError = 'Upload failed';
    for (const bucket of [BUCKET, PROFILE_BUCKET]) {
      const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: type, cacheControl: '31536000', upsert: false });
      if (!error) {
        const url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
        hostedImageCache.set(fingerprint, url);
        return { success: true, data: url };
      }
      lastError = error.message;
      console.warn(`Photo upload to "${bucket}" failed:`, error.message);
    }
    return { success: false, error: lastError };
  },

  // Fixed filename per user/kind (not timestamped like uploadVideo) - an
  // avatar/banner is a single current value, not a growing gallery, so
  // upsert:true replaces it in place instead of orphaning the old file. A
  // cache-busting query param is appended to the returned URL so the
  // browser doesn't keep showing a stale cached image after re-upload.
  async uploadProfileImage(file: File, kind: 'avatar' | 'banner'): Promise<ServiceResult<string>> {
    const supabase = createClient();
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) {
      return { success: false, error: 'You must be logged in to upload an image' };
    }

    // Re-saved as a JPEG (avatars at most 800px): smaller, and the photo's
    // hidden EXIF data (e.g. where it was taken) is dropped.
    const image = await downscaleImage(file, kind === 'avatar' ? 800 : 2000, true);
    const extension = image.type === 'image/jpeg' ? 'jpg' : file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/${kind}.${extension}`;

    const { error: uploadError } = await supabase.storage.from(PROFILE_BUCKET).upload(path, image, {
      contentType: image.type || 'image/jpeg',
      cacheControl: '3600',
      upsert: true,
    });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(path);
    return { success: true, data: `${data.publicUrl}?v=${Date.now()}` };
  },

  // Timestamped path like uploadVideo, not a fixed slot like uploadProfileImage -
  // a user has many moments, each its own photo.
  async uploadFoodMoment(file: File): Promise<ServiceResult<string>> {
    const supabase = createClient();
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) {
      return { success: false, error: 'You must be logged in to upload a photo' };
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/${uploadId()}.${extension}`;

    const { error: uploadError } = await supabase.storage.from(FOOD_MOMENTS_BUCKET).upload(path, file, {
      contentType: file.type || 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data } = supabase.storage.from(FOOD_MOMENTS_BUCKET).getPublicUrl(path);
    return { success: true, data: data.publicUrl };
  },
};

export default MediaUploadService;
