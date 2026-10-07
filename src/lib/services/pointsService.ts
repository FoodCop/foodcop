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

export interface PointsHistoryEntry {
  id: string;
  actionType: string;
  points: number;
  createdAt: string;
}

export interface UserPointsStats {
  points: number;
  level: number;
  counters: Record<string, number>;
}

const asRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
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

  /** The signed-in user's own most recent point awards (points_ledger is owner-only). */
  async getRecentPoints(userId: string, limit = 5): Promise<PointsResult<PointsHistoryEntry[]>> {
    const client = createClient();
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const { data, error } = await client
      .from('points_ledger')
      .select('id, action_type, points, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return { success: false, error: error.message };

    return {
      success: true,
      data: (data ?? []).map((r) => ({
        id: String(r.id),
        actionType: String(r.action_type),
        points: Number(r.points) || 0,
        createdAt: String(r.created_at),
      })),
    };
  },
};

export default PointsService;
