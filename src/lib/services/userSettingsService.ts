/**
 * ============================================================================
 * USER SETTINGS SERVICE
 * ============================================================================
 * Backs SettingsTab.tsx's Discovery & Matching / Privacy & Social / AI &
 * Personalisation controls - previously uncontrolled native inputs
 * (defaultValue/defaultChecked), nothing read or written anywhere. See
 * supabase/migrations/20260725020000_user_settings.sql.
 */

import { createClient } from '../supabase/client';

export type MatchSensitivity = 'Broad' | 'Balanced' | 'Exact';
export type ProfileVisibility = 'Public' | 'Followers' | 'Private';

export interface UserSettings {
  discoveryRadiusKm: number;
  matchSensitivity: MatchSensitivity;
  showHiddenGems: boolean;
  prioritizeTrending: boolean;
  profileVisibility: ProfileVisibility;
  showFoodDna: boolean;
  aiCardGeneration: boolean;
  useActivityForMl: boolean;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  discoveryRadiusKm: 25,
  matchSensitivity: 'Balanced',
  showHiddenGems: true,
  prioritizeTrending: false,
  profileVisibility: 'Public',
  showFoodDna: true,
  aiCardGeneration: true,
  useActivityForMl: true,
};

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface UserSettingsRow {
  discovery_radius_km: number;
  match_sensitivity: MatchSensitivity;
  show_hidden_gems: boolean;
  prioritize_trending: boolean;
  profile_visibility: ProfileVisibility;
  show_food_dna: boolean;
  ai_card_generation: boolean;
  use_activity_for_ml: boolean;
}

const fromRow = (row: UserSettingsRow): UserSettings => ({
  discoveryRadiusKm: row.discovery_radius_km,
  matchSensitivity: row.match_sensitivity,
  showHiddenGems: row.show_hidden_gems,
  prioritizeTrending: row.prioritize_trending,
  profileVisibility: row.profile_visibility,
  showFoodDna: row.show_food_dna,
  aiCardGeneration: row.ai_card_generation,
  useActivityForMl: row.use_activity_for_ml,
});

const toRow = (settings: Partial<UserSettings>) => ({
  ...(settings.discoveryRadiusKm !== undefined && { discovery_radius_km: settings.discoveryRadiusKm }),
  ...(settings.matchSensitivity !== undefined && { match_sensitivity: settings.matchSensitivity }),
  ...(settings.showHiddenGems !== undefined && { show_hidden_gems: settings.showHiddenGems }),
  ...(settings.prioritizeTrending !== undefined && { prioritize_trending: settings.prioritizeTrending }),
  ...(settings.profileVisibility !== undefined && { profile_visibility: settings.profileVisibility }),
  ...(settings.showFoodDna !== undefined && { show_food_dna: settings.showFoodDna }),
  ...(settings.aiCardGeneration !== undefined && { ai_card_generation: settings.aiCardGeneration }),
  ...(settings.useActivityForMl !== undefined && { use_activity_for_ml: settings.useActivityForMl }),
});

export const UserSettingsService = {
  /** For the signed-in user's own settings (RLS owner-only read). */
  async get(): Promise<ServiceResult<UserSettings>> {
    const client = createClient();
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const { data: authData } = await client.auth.getUser();
    const user = authData?.user;
    if (!user) return { success: false, error: 'User not authenticated' };

    const { data, error } = await client.from('user_settings').select('*').eq('user_id', user.id).maybeSingle();
    if (error) return { success: false, error: error.message };

    return { success: true, data: data ? fromRow(data as UserSettingsRow) : DEFAULT_USER_SETTINGS };
  },

  /** For any user id - used by recommendation/visibility logic reading someone else's settings server- or client-side. */
  async getForUser(userId: string): Promise<ServiceResult<UserSettings>> {
    const client = createClient();
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const { data, error } = await client.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
    if (error) return { success: false, error: error.message };

    return { success: true, data: data ? fromRow(data as UserSettingsRow) : DEFAULT_USER_SETTINGS };
  },

  async update(partial: Partial<UserSettings>): Promise<ServiceResult<null>> {
    const client = createClient();
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const { data: authData } = await client.auth.getUser();
    const user = authData?.user;
    if (!user) return { success: false, error: 'User not authenticated' };

    const { error } = await client
      .from('user_settings')
      .upsert(
        { user_id: user.id, ...toRow(partial), updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
    if (error) return { success: false, error: error.message };

    return { success: true, data: null };
  },
};

export default UserSettingsService;
