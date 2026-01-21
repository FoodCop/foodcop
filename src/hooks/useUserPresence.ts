/**
 * useUserPresence Hook
 *
 * React hook for easily accessing user presence status
 * with automatic real-time updates
 */

import { useState, useEffect } from 'react';
import { PresenceService, type UserPresence } from '../services/presenceService';

export interface UseUserPresenceOptions {
  realtime?: boolean;
  userId: string;
}

export function useUserPresence({ userId, realtime = true }: UseUserPresenceOptions) {
  const [presence, setPresence] = useState<UserPresence | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch initial status
  useEffect(() => {
    let isMounted = true;

    async function fetchStatus() {
      try {
        const status = await PresenceService.getUserOnlineStatus(userId);
        if (isMounted) {
          setPresence(status);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    }

    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!realtime) return;

    const unsubscribe = PresenceService.subscribeToUserStatus(userId, (newPresence) => {
      setPresence(newPresence);
    });

    return unsubscribe;
  }, [userId, realtime]);

  const isOnline = presence?.is_online || false;
  const lastSeenText = presence
    ? presence.is_online
      ? 'Active now'
      : PresenceService.formatLastSeen(presence.last_seen)
    : '';

  return {
    presence,
    isOnline,
    lastSeenText,
    isLoading,
    error,
  };
}

/**
 * useBatchPresence Hook
 *
 * Fetch presence for multiple users at once (more efficient)
 */
export function useBatchPresence(userIds: string[]) {
  const [presenceMap, setPresenceMap] = useState<Map<string, UserPresence>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchBatchStatus() {
      try {
        const statusMap = await PresenceService.getBatchOnlineStatus(userIds);
        if (isMounted) {
          setPresenceMap(statusMap);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (userIds.length > 0) {
      fetchBatchStatus();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [userIds.join(',')]);

  return {
    presenceMap,
    isLoading,
    getPresence: (userId: string) => presenceMap.get(userId) || null,
    isOnline: (userId: string) => presenceMap.get(userId)?.is_online || false,
  };
}
