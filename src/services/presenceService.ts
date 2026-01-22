/**
 * Presence Service
 *
 * Manages user online status tracking using Supabase Realtime Presence
 * and database-backed presence tracking.
 *
 * Features:
 * - Real-time online/offline status
 * - Heartbeat system (30s intervals)
 * - Multi-device support
 * - Last seen timestamps
 * - Activity tracking
 *
 * Architecture:
 * - Uses Supabase Presence for real-time collaboration
 * - Database backup for persistent status
 * - Automatic cleanup of stale sessions
 */

import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Types
export interface UserPresence {
  user_id: string;
  is_online: boolean;
  last_activity_at: string;
  last_seen: string;
}

export interface PresenceState {
  online_at: string;
  user_id: string;
  session_id: string;
  device_info?: {
    browser?: string;
    os?: string;
    device_type?: string;
  };
}

export interface OnlineUser {
  user_id: string;
  presence_count: number; // Number of active sessions
  last_heartbeat: string;
}

// Singleton presence channel
let globalPresenceChannel: RealtimeChannel | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let currentSessionId: string | null = null;

/**
 * Generate unique session ID for this browser tab
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get device information
 */
function getDeviceInfo() {
  const userAgent = navigator.userAgent;

  // Detect browser
  let browser = 'Unknown';
  if (userAgent.indexOf('Firefox') > -1) browser = 'Firefox';
  else if (userAgent.indexOf('Chrome') > -1) browser = 'Chrome';
  else if (userAgent.indexOf('Safari') > -1) browser = 'Safari';
  else if (userAgent.indexOf('Edge') > -1) browser = 'Edge';

  // Detect OS
  let os = 'Unknown';
  if (userAgent.indexOf('Win') > -1) os = 'Windows';
  else if (userAgent.indexOf('Mac') > -1) os = 'MacOS';
  else if (userAgent.indexOf('Linux') > -1) os = 'Linux';
  else if (userAgent.indexOf('Android') > -1) os = 'Android';
  else if (userAgent.indexOf('iOS') > -1) os = 'iOS';

  // Detect device type
  const device_type = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 'desktop';

  return { browser, os, device_type };
}

/**
 * Update user activity in database
 */
export async function updateUserActivity(userId: string): Promise<void> {
  try {
    if (!currentSessionId) {
      currentSessionId = generateSessionId();
    }

    const deviceInfo = getDeviceInfo();

    const { error } = await supabase.rpc('update_user_activity', {
      p_user_id: userId,
      p_session_id: currentSessionId,
      p_device_info: deviceInfo,
    });

    if (error) {
      console.error('Error updating user activity:', error);
    }
  } catch (error) {
    console.error('Failed to update user activity:', error);
  }
}

/**
 * Mark user as offline in database
 */
export async function markUserOffline(userId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('mark_user_offline', {
      p_user_id: userId,
      p_session_id: currentSessionId,
    });

    if (error) {
      console.error('Error marking user offline:', error);
    }
  } catch (error) {
    console.error('Failed to mark user offline:', error);
  }
}

/**
 * Start presence tracking for current user
 *
 * This sets up:
 * 1. Supabase Presence channel for real-time tracking
 * 2. Heartbeat interval (30s)
 * 3. Window focus/blur listeners
 * 4. Beforeunload cleanup
 */
export async function startPresenceTracking(userId: string): Promise<void> {
  // Avoid double initialization
  if (globalPresenceChannel) {
    console.warn('Presence tracking already started');
    return;
  }

  currentSessionId = generateSessionId();

  console.log(`🟢 Starting presence tracking for user ${userId}, session: ${currentSessionId}`);

  // Create presence channel
  globalPresenceChannel = supabase.channel('global-presence', {
    config: {
      presence: {
        key: userId, // Use user ID as presence key
      },
    },
  });

  // Subscribe to presence
  globalPresenceChannel
    .on('presence', { event: 'sync' }, () => {
      const presenceState = globalPresenceChannel!.presenceState();
      console.log('Presence synced:', Object.keys(presenceState).length, 'users online');
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', key, leftPresences);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track presence in Supabase
        await globalPresenceChannel!.track({
          online_at: new Date().toISOString(),
          user_id: userId,
          session_id: currentSessionId!,
          device_info: getDeviceInfo(),
        } as PresenceState);

        // Also update database
        await updateUserActivity(userId);

        console.log('✅ Presence tracking active');
      }
    });

  // Start heartbeat (every 30 seconds)
  heartbeatInterval = setInterval(async () => {
    await updateUserActivity(userId);
    console.log('💓 Heartbeat sent');
  }, 30000); // 30 seconds

  // Handle window focus/blur
  window.addEventListener('focus', () => {
    updateUserActivity(userId);
    console.log('🔵 Window focused - marking online');
  });

  window.addEventListener('blur', () => {
    // Don't mark offline on blur - wait for heartbeat timeout
    console.log('🔘 Window blurred - presence maintained');
  });

  // Handle page unload
  window.addEventListener('beforeunload', () => {
    markUserOffline(userId);
    stopPresenceTracking();
  });

  // Handle visibility change (tab switching)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('👁️ Tab hidden');
    } else {
      updateUserActivity(userId);
      console.log('👁️ Tab visible - marking online');
    }
  });
}

/**
 * Stop presence tracking
 */
export function stopPresenceTracking(): void {
  console.log('🔴 Stopping presence tracking');

  // Clear heartbeat
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  // Unsubscribe from presence channel
  if (globalPresenceChannel) {
    globalPresenceChannel.untrack();
    globalPresenceChannel.unsubscribe();
    globalPresenceChannel = null;
  }

  currentSessionId = null;
}

/**
 * Get user's online status from database
 */
export async function getUserOnlineStatus(userId: string): Promise<UserPresence | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, is_online, last_activity_at, last_seen')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return {
      user_id: data.id,
      is_online: data.is_online || false,
      last_activity_at: data.last_activity_at || data.last_seen,
      last_seen: data.last_seen || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching user online status:', error);
    return null;
  }
}

/**
 * Get multiple users' online status (batch)
 */
export async function getBatchOnlineStatus(
  userIds: string[]
): Promise<Map<string, UserPresence>> {
  const statusMap = new Map<string, UserPresence>();

  if (userIds.length === 0) return statusMap;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, is_online, last_activity_at, last_seen')
      .in('id', userIds);

    if (error) throw error;

    data?.forEach((user) => {
      statusMap.set(user.id, {
        user_id: user.id,
        is_online: user.is_online || false,
        last_activity_at: user.last_activity_at || user.last_seen,
        last_seen: user.last_seen || new Date().toISOString(),
      });
    });
  } catch (error) {
    console.error('Error fetching batch online status:', error);
  }

  return statusMap;
}

/**
 * Subscribe to a user's online status changes
 */
export function subscribeToUserStatus(
  userId: string,
  callback: (presence: UserPresence) => void
): () => void {
  const channel = supabase
    .channel(`user-status-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        const newData = payload.new as any;
        callback({
          user_id: newData.id,
          is_online: newData.is_online || false,
          last_activity_at: newData.last_activity_at || newData.last_seen,
          last_seen: newData.last_seen || new Date().toISOString(),
        });
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    channel.unsubscribe();
  };
}

/**
 * Get all currently online users from Supabase Presence
 */
export function getOnlineUsersFromPresence(): OnlineUser[] {
  if (!globalPresenceChannel) {
    console.warn('Presence channel not initialized');
    return [];
  }

  const presenceState = globalPresenceChannel.presenceState();
  const onlineUsers: OnlineUser[] = [];

  Object.entries(presenceState).forEach(([userId, presences]) => {
    const presenceArray = Array.isArray(presences) ? presences : [presences as unknown as PresenceState];
    if (presenceArray.length > 0) {
      const firstPresence = presenceArray[0] as PresenceState;
      onlineUsers.push({
        user_id: userId,
        presence_count: presenceArray.length,
        last_heartbeat: firstPresence.online_at,
      });
    }
  });

  return onlineUsers;
}

/**
 * Check if a specific user is online (from Presence)
 */
export function isUserOnlineInPresence(userId: string): boolean {
  if (!globalPresenceChannel) return false;

  const presenceState = globalPresenceChannel.presenceState();
  return userId in presenceState && (presenceState[userId] as any[]).length > 0;
}

/**
 * Format "last seen" timestamp into human-readable string
 */
export function formatLastSeen(lastSeen: string | Date): string {
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Active now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return lastSeenDate.toLocaleDateString();
  }
}

/**
 * Clean up stale presence records (call periodically)
 */
export async function cleanupStalePresence(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('cleanup_stale_presence');

    if (error) throw error;

    console.log(`🧹 Cleaned up ${data} stale presence records`);
    return data || 0;
  } catch (error) {
    console.error('Error cleaning up stale presence:', error);
    return 0;
  }
}

// Export for use in components
export const PresenceService = {
  startPresenceTracking,
  stopPresenceTracking,
  updateUserActivity,
  markUserOffline,
  getUserOnlineStatus,
  getBatchOnlineStatus,
  subscribeToUserStatus,
  getOnlineUsersFromPresence,
  isUserOnlineInPresence,
  formatLastSeen,
  cleanupStalePresence,
};
