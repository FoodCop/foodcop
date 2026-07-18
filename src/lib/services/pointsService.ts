/**
 * ============================================================================
 * POINTS SERVICE — Gamification Ledger & Leaderboard
 * ============================================================================
 *
 * Thin wrapper around the award_points() RPC (supabase/migrations/
 * 20260719000000_points_and_gamification.sql) plus the leaderboard/stats
 * reads that feed /leaderboard and /rewards.
 */

import { createClient } from '../supabase/client';

export type PointsActionType = 'create_recipe' | 'create_restaurant' | 'create_video' | 'create_discovery' | 'share_card';

interface PointsResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AwardPointsOutcome {
  pointsAwarded: number;
  pointsTotal: number;
  pointsLevel: number;
  wasDuplicate: boolean;
}

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  pointsTotal: number;
  pointsLevel: number;
}

export interface UserPointsStats {
  points: number;
  level: number;
  counters: Record<string, number>;
}

const asRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
};

const toLeaderboardEntry = (value: unknown): LeaderboardEntry => {
  const row = asRecord(value);
  const id = String(row.id || '');
  return {
    id,
    displayName: typeof row.display_name === 'string' && row.display_name.trim() ? row.display_name : (typeof row.username === 'string' ? row.username : 'User'),
    username: typeof row.username === 'string' ? row.username : 'fuzo_user',
    avatarUrl: typeof row.avatar_url === 'string' && row.avatar_url.trim() ? row.avatar_url : null,
    pointsTotal: Number(row.points_total) || 0,
    pointsLevel: Number(row.points_level) || 1,
  };
};

export const PointsService = {
  async awardPoints(params: {
    actionType: PointsActionType;
    sourceType: string;
    sourceId: string;
  }): Promise<PointsResult<AwardPointsOutcome>> {
    const client = createClient();
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const { data, error } = await client.rpc('award_points', {
      p_action_type: params.actionType,
      p_source_type: params.sourceType,
      p_source_id: params.sourceId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const row = asRecord(Array.isArray(data) ? data[0] : data);
    return {
      success: true,
      data: {
        pointsAwarded: Number(row.out_points_awarded) || 0,
        pointsTotal: Number(row.out_points_total) || 0,
        pointsLevel: Number(row.out_points_level) || 1,
        wasDuplicate: Boolean(row.out_was_duplicate),
      },
    };
  },

  async getUserStats(userId: string): Promise<PointsResult<UserPointsStats>> {
    const client = createClient();
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const [usersResult, statsResult] = await Promise.all([
      client.from('users').select('points_total, points_level').eq('id', userId).maybeSingle(),
      client.from('user_stats').select('counters').eq('user_id', userId).maybeSingle(),
    ]);

    if (usersResult.error) {
      return { success: false, error: usersResult.error.message };
    }

    const counters = (statsResult.data?.counters && typeof statsResult.data.counters === 'object')
      ? statsResult.data.counters as Record<string, number>
      : {};

    return {
      success: true,
      data: {
        points: usersResult.data?.points_total ?? 0,
        level: usersResult.data?.points_level ?? 1,
        counters,
      },
    };
  },

  async getLeaderboard(params: {
    scope: 'global' | 'friends';
    friendIds?: string[];
    limit?: number;
  }): Promise<PointsResult<LeaderboardEntry[]>> {
    const client = createClient();
    if (!client) return { success: false, error: 'Supabase is not configured' };

    if (params.scope === 'friends' && (!params.friendIds || params.friendIds.length === 0)) {
      return { success: true, data: [] };
    }

    let query = client
      .from('users')
      .select('id, display_name, username, avatar_url, points_total, points_level')
      .order('points_total', { ascending: false })
      .order('points_level', { ascending: false })
      .limit(params.limit ?? 25);

    if (params.scope === 'friends') {
      query = query.in('id', params.friendIds!);
    }

    const { data, error } = await query;
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []).map(toLeaderboardEntry) };
  },

  async getUserRank(userId: string): Promise<PointsResult<number>> {
    const client = createClient();
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const { data: me, error: meError } = await client
      .from('users')
      .select('points_total')
      .eq('id', userId)
      .maybeSingle();

    if (meError || !me) {
      return { success: false, error: meError?.message || 'User not found' };
    }

    const { count, error } = await client
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gt('points_total', me.points_total);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (count ?? 0) + 1 };
  },
};

export default PointsService;
