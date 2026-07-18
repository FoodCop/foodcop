/**
 * ============================================================================
 * NOTIFICATIONS SERVICE
 * ============================================================================
 * Backs /notifications (closes the header bell's 404 and its permanently-on
 * "new alerts" dot, src/components/header/SiteHeader.tsx). No new event-log
 * table: the feed is assembled from data that already exists - incoming/
 * accepted friend_requests, points_ledger entries - rather than duplicating
 * it. The only new state is users.notifications_seen_at (one nullable
 * timestamp, supabase/migrations/20260721000000_notifications_seen_at.sql)
 * so the header dot can reflect real unread state instead of always being on.
 */

import { createClient } from '../supabase/client';

export type NotificationType = 'friend_request' | 'friend_accepted' | 'points';

export interface AppNotification {
  id: string;
  type: NotificationType;
  createdAt: string;
  requestId?: string;
  actorId?: string;
  actorName?: string;
  actorAvatarUrl?: string | null;
  pointsAwarded?: number;
  actionType?: string;
}

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const POINTS_ACTION_COPY: Record<string, string> = {
  create_recipe: 'for publishing a recipe',
  create_restaurant: 'for a restaurant visit',
  create_video: 'for a video',
  create_discovery: 'for a discovery post',
  share_card: 'for sharing a card with a friend',
};

interface FriendRequestRow {
  id: string;
  requester_id: string;
  requested_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const NotificationsService = {
  async list(userId: string): Promise<ServiceResult<AppNotification[]>> {
    const client = createClient();
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const [requestsResult, pointsResult] = await Promise.all([
      client
        .from('friend_requests')
        .select('id, requester_id, requested_id, status, created_at, updated_at')
        .or(`requester_id.eq.${userId},requested_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50),
      client
        .from('points_ledger')
        .select('id, action_type, points, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (requestsResult.error) return { success: false, error: requestsResult.error.message };
    if (pointsResult.error) return { success: false, error: pointsResult.error.message };

    const requests = (requestsResult.data || []) as FriendRequestRow[];
    const otherIds = [...new Set(requests.map((r) => (r.requester_id === userId ? r.requested_id : r.requester_id)))];

    const { data: users } = otherIds.length
      ? await client.from('users').select('id, display_name, username, avatar_url').in('id', otherIds)
      : { data: [] as { id: string; display_name: string | null; username: string | null; avatar_url: string | null }[] };
    const usersById = new Map((users || []).map((u) => [u.id, u]));

    const notifications: AppNotification[] = [];

    for (const r of requests) {
      const isIncoming = r.requested_id === userId;
      const otherId = isIncoming ? r.requester_id : r.requested_id;
      const other = usersById.get(otherId);
      const actorName = other?.display_name || other?.username || 'Someone';
      const actorAvatarUrl = other?.avatar_url || null;

      if (isIncoming && r.status === 'pending') {
        notifications.push({
          id: `fr-${r.id}`,
          type: 'friend_request',
          createdAt: r.created_at,
          requestId: r.id,
          actorId: otherId,
          actorName,
          actorAvatarUrl,
        });
      } else if (!isIncoming && r.status === 'accepted') {
        notifications.push({
          id: `fa-${r.id}`,
          type: 'friend_accepted',
          createdAt: r.updated_at,
          actorId: otherId,
          actorName,
          actorAvatarUrl,
        });
      }
    }

    for (const p of pointsResult.data || []) {
      notifications.push({
        id: `pt-${p.id}`,
        type: 'points',
        createdAt: p.created_at,
        pointsAwarded: p.points,
        actionType: p.action_type,
      });
    }

    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { success: true, data: notifications };
  },

  /**
   * Pending incoming friend requests are always "unread" until acted on
   * (same gate ChatView already uses for its own banner); points and
   * accepted-request notifications are only unread since the user's last
   * notifications_seen_at.
   */
  async hasUnread(userId: string): Promise<boolean> {
    const client = createClient();
    if (!client) return false;

    const { data: userRow } = await client.from('users').select('notifications_seen_at').eq('id', userId).maybeSingle();
    const seenAt = userRow?.notifications_seen_at as string | null | undefined;

    const pendingQuery = client
      .from('friend_requests')
      .select('id', { count: 'exact', head: true })
      .eq('requested_id', userId)
      .eq('status', 'pending');

    let pointsQuery = client.from('points_ledger').select('id', { count: 'exact', head: true }).eq('user_id', userId);
    let acceptedQuery = client
      .from('friend_requests')
      .select('id', { count: 'exact', head: true })
      .eq('requester_id', userId)
      .eq('status', 'accepted');

    if (seenAt) {
      pointsQuery = pointsQuery.gt('created_at', seenAt);
      acceptedQuery = acceptedQuery.gt('updated_at', seenAt);
    }

    const [{ count: pendingCount }, { count: pointsCount }, { count: acceptedCount }] = await Promise.all([
      pendingQuery,
      pointsQuery,
      acceptedQuery,
    ]);

    return (pendingCount || 0) > 0 || (pointsCount || 0) > 0 || (acceptedCount || 0) > 0;
  },

  async markSeen(userId: string): Promise<void> {
    const client = createClient();
    if (!client) return;
    await client.from('users').update({ notifications_seen_at: new Date().toISOString() }).eq('id', userId);
  },
};

export default NotificationsService;
