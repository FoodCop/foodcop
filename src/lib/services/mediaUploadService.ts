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
async function downscaleImage(blob: Blob, maxSide = 1600): Promise<Blob> {
  try {
    if (typeof createImageBitmap === 'undefined' || typeof document === 'undefined') return blob;
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && blob.size < 1_500_000) { bitmap.close(); return blob; }
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
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

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
    const path = `${userId}/shared-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

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

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/${kind}.${extension}`;

    const { error: uploadError } = await supabase.storage.from(PROFILE_BUCKET).upload(path, file, {
      contentType: file.type || 'image/jpeg',
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
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

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
