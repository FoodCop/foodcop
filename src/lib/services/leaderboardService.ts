/**
 * LEADERBOARD SERVICE
 * Real rankings from the database - no fixture rows, no fabricated avatars.
 *
 * Primary path: the get_leaderboard() RPC (supabase/migrations/
 * 20260919020000_leaderboard.sql), which supports scope (global / friends) and
 * period (all time / this month / this week), ties, profile-visibility rules
 * and the caller's own true rank.
 *
 * Fallback (RPC not deployed yet): a plain all-time query over the public
 * columns of `users`. Periods are unavailable there, and the result says so
 * via `periodsSupported` so the UI can be honest about it instead of showing
 * all-time numbers under a "This week" label.
 */

import { createClient } from '@/lib/supabase/client';
import { FriendRequestService } from '@/lib/services/friendRequestService';

export type LeaderboardScope = 'global' | 'friends';
export type LeaderboardPeriod = 'all' | 'month' | 'week';

export interface LeaderboardRow {
  rank: number;
  userId: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  points: number;
  level: number;
  isMe: boolean;
}

export interface LeaderboardResult {
  /** The top N, in rank order (ties share a rank). */
  rows: LeaderboardRow[];
  /** The caller's own row with their true rank, even when outside the top N. null if not ranked. */
  me: LeaderboardRow | null;
  /** The closest person ranked above the caller - powers "X pts to pass ...". */
  above: LeaderboardRow | null;
  periodsSupported: boolean;
}

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const DEFAULT_LIMIT = 25;

const nameOf = (displayName: unknown, username: unknown) =>
  (typeof displayName === 'string' && displayName.trim()) || (typeof username === 'string' && username.trim()) || 'FUZO member';

const cleanUrl = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null);

function assemble(all: LeaderboardRow[], limit: number, periodsSupported: boolean): LeaderboardResult {
  const me = all.find((r) => r.isMe) ?? null;
  const rows = all.filter((r) => r.rank <= limit);
  // Closest person ranked above me (highest rank number that is still < mine).
  const above = me && me.rank > 1
    ? all.filter((r) => r.rank < me.rank).sort((a, b) => b.rank - a.rank)[0] ?? null
    : null;
  return { rows, me, above, periodsSupported };
}

async function viaRpc(scope: LeaderboardScope, period: LeaderboardPeriod, limit: number): Promise<LeaderboardResult | null> {
  const client = createClient();
  if (!client) return null;
  const { data, error } = await client.rpc('get_leaderboard', { p_scope: scope, p_period: period, p_limit: limit });
  if (error) return null;

  type Row = {
    out_rank: number | string;
    out_user_id: string;
    out_display_name: string | null;
    out_username: string | null;
    out_avatar_url: string | null;
    out_points: number | string;
    out_level: number | null;
    out_is_me: boolean;
  };
  const all: LeaderboardRow[] = ((data ?? []) as Row[]).map((r) => ({
    rank: Number(r.out_rank),
    userId: r.out_user_id,
    displayName: nameOf(r.out_display_name, r.out_username),
    username: r.out_username ?? null,
    avatarUrl: cleanUrl(r.out_avatar_url),
    points: Number(r.out_points) || 0,
    level: Number(r.out_level) || 1,
    isMe: !!r.out_is_me,
  }));
  return assemble(all, limit, true);
}

// All-time only, computed client-side over public columns. Seeded demo accounts are excluded.
async function viaFallback(scope: LeaderboardScope, userId: string, limit: number): Promise<ServiceResult<LeaderboardResult>> {
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase is not configured' };

  let friendIds: string[] = [];
  if (scope === 'friends') {
    const friends = await FriendRequestService.listAcceptedFriendIds(userId);
    friendIds = friends.success ? friends.data ?? [] : [];
  }

  let query = client
    .from('users')
    .select('id, display_name, username, avatar_url, points_total, points_level')
    .eq('is_master_bot', false)
    .order('points_total', { ascending: false })
    .limit(500);
  if (scope === 'friends') query = query.in('id', [userId, ...friendIds]);
  else query = query.gt('points_total', 0);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };

  const sorted = data ?? [];
  let lastPoints: number | null = null;
  let lastRank = 0;
  const all: LeaderboardRow[] = sorted.map((r, i) => {
    const points = Number(r.points_total) || 0;
    if (points !== lastPoints) { lastRank = i + 1; lastPoints = points; }
    return {
      rank: lastRank,
      userId: r.id,
      displayName: nameOf(r.display_name, r.username),
      username: r.username ?? null,
      avatarUrl: cleanUrl(r.avatar_url),
      points,
      level: Number(r.points_level) || 1,
      isMe: r.id === userId,
    };
  });
  return { success: true, data: assemble(all, limit, false) };
}

export const LeaderboardService = {
  async get(params: {
    scope: LeaderboardScope;
    period: LeaderboardPeriod;
    userId: string;
    limit?: number;
  }): Promise<ServiceResult<LeaderboardResult>> {
    const limit = params.limit ?? DEFAULT_LIMIT;
    const rpc = await viaRpc(params.scope, params.period, limit);
    if (rpc) return { success: true, data: rpc };
    return viaFallback(params.scope, params.userId, limit);
  },
};

export default LeaderboardService;
