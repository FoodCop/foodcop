/**
 * PresenceTracker Component
 *
 * Automatically tracks user presence when authenticated.
 * Place this component in the app root after authentication.
 *
 * Features:
 * - Auto-starts presence tracking on mount
 * - Auto-stops on unmount
 * - Handles window visibility changes
 * - Manages heartbeat intervals
 */

import { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { PresenceService } from '../../services/presenceService';

export function PresenceTracker() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.id) {
      console.log('⏸️ User not authenticated, skipping presence tracking');
      return;
    }

    console.log(`🟢 PresenceTracker: Starting for user ${user.id}`);

    // Start presence tracking
    PresenceService.startPresenceTracking(user.id);

    // Cleanup on unmount or user change
    return () => {
      console.log(`🔴 PresenceTracker: Stopping for user ${user.id}`);
      PresenceService.stopPresenceTracking();

      // Mark user offline when component unmounts
      if (user?.id) {
        PresenceService.markUserOffline(user.id);
      }
    };
  }, [user?.id]);

  // This component doesn't render anything
  return null;
}
