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
  notifyMessages: boolean;
  notifySocial: boolean;
  notifyRecommendations: boolean;
  /** Chat presence: show "Active now" to others (and see theirs). */
  showOnlineStatus: boolean;
  /** Chat: let people see when you've read their message (and see theirs). */
  sendReadReceipts: boolean;
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
  notifyMessages: true,
  notifySocial: true,
  notifyRecommendations: true,
  showOnlineStatus: true,
  sendReadReceipts: true,
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
  notify_messages: boolean;
  notify_social: boolean;
  notify_recommendations: boolean;
  show_online_status: boolean;
  send_read_receipts: boolean;
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
  notifyMessages: row.notify_messages,
  notifySocial: row.notify_social,
  notifyRecommendations: row.notify_recommendations,
  showOnlineStatus: row.show_online_status ?? true,
  sendReadReceipts: row.send_read_receipts ?? true,
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
  ...(settings.notifyMessages !== undefined && { notify_messages: settings.notifyMessages }),
  ...(settings.notifySocial !== undefined && { notify_social: settings.notifySocial }),
  ...(settings.notifyRecommendations !== undefined && { notify_recommendations: settings.notifyRecommendations }),
  ...(settings.showOnlineStatus !== undefined && { show_online_status: settings.showOnlineStatus }),
  ...(settings.sendReadReceipts !== undefined && { send_read_receipts: settings.sendReadReceipts }),
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

  /**
   * What a VISITOR may learn about another user's privacy settings: can I view
   * this profile, and is Food DNA shown. Goes through get_profile_access()
   * (SECURITY DEFINER) because user_settings itself is owner-only - and the
   * "can I view" answer is computed in the database, from the same rule that
   * gates the content tables, not re-derived in the browser.
   * Fails CLOSED: any error means "cannot view".
   */
  async getProfileAccess(userId: string): Promise<{ canView: boolean; visibility: ProfileVisibility; showFoodDna: boolean }> {
    const denied = { canView: false, visibility: 'Private' as ProfileVisibility, showFoodDna: false };
    const client = createClient();
    if (!client) return denied;

    const { data, error } = await client.rpc('get_profile_access', { p_owner: userId });
    if (error) return denied;
    const row = (Array.isArray(data) ? data[0] : data) as
      | { out_can_view: boolean; out_visibility: ProfileVisibility; out_show_food_dna: boolean }
      | null
      | undefined;
    if (!row) return denied;
    return { canView: !!row.out_can_view, visibility: row.out_visibility, showFoodDna: !!row.out_show_food_dna };
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
