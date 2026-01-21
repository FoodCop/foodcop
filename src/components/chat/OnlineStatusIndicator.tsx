/**
 * Online Status Indicator Component
 *
 * Displays user online status with green dot and "Active now" text
 * Similar to Instagram's online indicators
 *
 * Variants:
 * - dot: Just the green/gray dot
 * - badge: Dot with optional text
 * - full: Dot + "Active now" / "Last seen X ago"
 */

import { useState, useEffect } from 'react';
import { PresenceService, type UserPresence } from '../../services/presenceService';
import { cn } from '../ui/utils';

export interface OnlineStatusIndicatorProps {
  userId: string;
  variant?: 'dot' | 'badge' | 'full';
  showText?: boolean;
  className?: string;
  dotClassName?: string;
  textClassName?: string;
  realtime?: boolean; // Subscribe to real-time updates
}

export function OnlineStatusIndicator({
  userId,
  variant = 'dot',
  showText = true,
  className,
  dotClassName,
  textClassName,
  realtime = true,
}: OnlineStatusIndicatorProps) {
  const [presence, setPresence] = useState<UserPresence | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial status
  useEffect(() => {
    let isMounted = true;

    async function fetchStatus() {
      const status = await PresenceService.getUserOnlineStatus(userId);
      if (isMounted && status) {
        setPresence(status);
        setIsLoading(false);
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

  if (isLoading || !presence) {
    return null;
  }

  const isOnline = presence.is_online;
  const lastSeenText = isOnline
    ? 'Active now'
    : PresenceService.formatLastSeen(presence.last_seen);

  // Dot-only variant
  if (variant === 'dot') {
    return (
      <div
        className={cn(
          'w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900',
          isOnline ? 'bg-green-500' : 'bg-neutral-400',
          dotClassName
        )}
        title={lastSeenText}
      />
    );
  }

  // Badge variant (dot with optional text)
  if (variant === 'badge') {
    return (
      <div className={cn('inline-flex items-center gap-2', className)}>
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full',
            isOnline ? 'bg-green-500' : 'bg-neutral-400',
            dotClassName
          )}
        />
        {showText && (
          <span
            className={cn(
              'text-xs font-medium',
              isOnline ? 'text-green-600 dark:text-green-400' : 'text-neutral-500',
              textClassName
            )}
          >
            {lastSeenText}
          </span>
        )}
      </div>
    );
  }

  // Full variant (dot + text)
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          isOnline ? 'bg-green-500 animate-pulse' : 'bg-neutral-400',
          dotClassName
        )}
      />
      <span
        className={cn(
          'text-sm',
          isOnline ? 'text-green-600 dark:text-green-400' : 'text-neutral-500',
          textClassName
        )}
      >
        {lastSeenText}
      </span>
    </div>
  );
}

/**
 * Online Status Dot (Absolute positioned)
 * For use with avatars
 */
export function OnlineStatusDot({
  userId,
  className,
  size = 'md',
  realtime = true,
}: {
  userId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  realtime?: boolean;
}) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchStatus() {
      const status = await PresenceService.getUserOnlineStatus(userId);
      if (isMounted && status) {
        setIsOnline(status.is_online);
      }
    }

    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!realtime) return;

    const unsubscribe = PresenceService.subscribeToUserStatus(userId, (presence) => {
      setIsOnline(presence.is_online);
    });

    return unsubscribe;
  }, [userId, realtime]);

  if (!isOnline) return null;

  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div
      className={cn(
        'absolute rounded-full bg-green-500 border-2 border-white dark:border-neutral-900',
        sizeClasses[size],
        className
      )}
      title="Online"
    />
  );
}

/**
 * Last Seen Text Only
 */
export function LastSeenText({
  userId,
  className,
  realtime = true,
}: {
  userId: string;
  className?: string;
  realtime?: boolean;
}) {
  const [lastSeenText, setLastSeenText] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function fetchStatus() {
      const status = await PresenceService.getUserOnlineStatus(userId);
      if (isMounted && status) {
        const text = status.is_online
          ? 'Active now'
          : PresenceService.formatLastSeen(status.last_seen);
        setLastSeenText(text);
      }
    }

    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!realtime) return;

    const unsubscribe = PresenceService.subscribeToUserStatus(userId, (presence) => {
      const text = presence.is_online
        ? 'Active now'
        : PresenceService.formatLastSeen(presence.last_seen);
      setLastSeenText(text);
    });

    return unsubscribe;
  }, [userId, realtime]);

  if (!lastSeenText) return null;

  return (
    <span className={cn('text-sm text-neutral-500 dark:text-neutral-400', className)}>
      {lastSeenText}
    </span>
  );
}
