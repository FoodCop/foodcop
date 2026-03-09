import { supabase } from '../../../services/supabaseClient';
import { buildDefaultSettingsProfile, mapProfileToSettingsUpdate, mergeSettingsFromRow } from '../lib/settingsMappers';
import type { AuthContextUser, SettingsProfile, UserSettingsRow } from '../types/settings';

interface SettingsServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const SettingsService = {
  async getUserSettings(authUser: AuthContextUser | null): Promise<SettingsServiceResult<SettingsProfile>> {
    if (!authUser?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    const defaults = buildDefaultSettingsProfile(authUser);
    const client = supabase;
    if (!client) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const { data, error } = await client
      .from('users')
      .select('id, display_name, username, bio, phone, location, dietary_preferences, cuisine_preferences, instagram_url, facebook_url, tiktok_url, pinterest_url')
      .eq('id', authUser.id)
      .maybeSingle<UserSettingsRow>();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: mergeSettingsFromRow(defaults, data || null),
    };
  },

  async updateUserSettings(authUser: AuthContextUser | null, profile: SettingsProfile): Promise<SettingsServiceResult<SettingsProfile>> {
    if (!authUser?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    const client = supabase;
    if (!client) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const updatePayload = mapProfileToSettingsUpdate(profile);

    const { data, error } = await client
      .from('users')
      .update(updatePayload)
      .eq('id', authUser.id)
      .select('id, display_name, username, bio, phone, location, dietary_preferences, cuisine_preferences, instagram_url, facebook_url, tiktok_url, pinterest_url')
      .maybeSingle<UserSettingsRow>();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      const { data: upserted, error: upsertError } = await client
        .from('users')
        .upsert({
          id: authUser.id,
          email: authUser.email || null,
          ...updatePayload,
        })
        .select('id, display_name, username, bio, phone, location, dietary_preferences, cuisine_preferences, instagram_url, facebook_url, tiktok_url, pinterest_url')
        .maybeSingle<UserSettingsRow>();

      if (upsertError) {
        return { success: false, error: upsertError.message };
      }

      return {
        success: true,
        data: mergeSettingsFromRow(profile, upserted || null),
      };
    }

    return {
      success: true,
      data: mergeSettingsFromRow(profile, data),
    };
  },
};
