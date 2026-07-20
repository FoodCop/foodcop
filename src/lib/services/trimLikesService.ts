/**
 * ============================================================================
 * TRIM LIKES SERVICE
 * ============================================================================
 * Real persistence for TrimsReel.tsx's heart toggle - previously useState
 * only, resetting on every reload. Kept separate from the generic
 * saved_items/PlateService pipeline (see supabase/migrations/
 * 20260725000000_trim_likes.sql for why): a like isn't a save, and the reel
 * already treats them as two different actions in its own UI.
 */

import { createClient } from '../supabase/client';

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const TrimLikesService = {
  async listLikedTrimIds(): Promise<ServiceResult<number[]>> {
    const client = createClient();
    if (!client) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const { data: authData } = await client.auth.getUser();
    const user = authData?.user;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await client.from('trim_likes').select('trim_id').eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []).map((row) => row.trim_id as number) };
  },

  async like(trimId: number): Promise<ServiceResult<null>> {
    const client = createClient();
    if (!client) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const { data: authData } = await client.auth.getUser();
    const user = authData?.user;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await client
      .from('trim_likes')
      .upsert({ user_id: user.id, trim_id: trimId }, { onConflict: 'user_id,trim_id' });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: null };
  },

  async unlike(trimId: number): Promise<ServiceResult<null>> {
    const client = createClient();
    if (!client) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const { data: authData } = await client.auth.getUser();
    const user = authData?.user;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await client.from('trim_likes').delete().eq('user_id', user.id).eq('trim_id', trimId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: null };
  },
};

export default TrimLikesService;
