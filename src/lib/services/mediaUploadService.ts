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
};

export default MediaUploadService;
