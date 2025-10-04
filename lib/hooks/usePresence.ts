'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

interface UsePresenceOptions {
  enabled?: boolean;
  heartbeatInterval?: number; // milliseconds
  offlineThreshold?: number; // milliseconds of inactivity
}

export function usePresence(options: UsePresenceOptions = {}) {
  const { 
    enabled = true, 
    heartbeatInterval = 30000, // 30 seconds
    offlineThreshold = 300000  // 5 minutes
  } = options;
  
  const { user } = useAuth();
  const lastActivityRef = useRef<number>(Date.now());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const activityTimeoutRef = useRef<NodeJS.Timeout>();

  // Update presence on server
  const updatePresence = useCallback(async (isOnline: boolean = true) => {
    if (!user || !enabled) return;

    try {
      await fetch('/api/user/presence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isOnline }),
      });
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  }, [user, enabled]);

  // Track user activity
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Clear any existing offline timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    // Set new offline timeout
    activityTimeoutRef.current = setTimeout(() => {
      updatePresence(false); // Set offline after inactivity
    }, offlineThreshold);
  }, [offlineThreshold, updatePresence]);

  // Start heartbeat to keep online status updated
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    heartbeatIntervalRef.current = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      
      // Only send heartbeat if user was active recently
      if (timeSinceActivity < offlineThreshold) {
        updatePresence(true);
      }
    }, heartbeatInterval);
  }, [heartbeatInterval, offlineThreshold, updatePresence]);

  // Set initial online status and start tracking
  useEffect(() => {
    if (!user || !enabled) return;

    // Set initial online status
    updatePresence(true);
    
    // Start activity tracking
    handleActivity(); // Initialize activity tracking
    startHeartbeat();

    // Activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Set offline when tab becomes hidden or user navigates away
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence(false);
      } else {
        updatePresence(true);
        handleActivity(); // Reset activity tracking
      }
    };

    const handleBeforeUnload = () => {
      updatePresence(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      // Clear intervals and timeouts
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      // Remove event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Set offline when component unmounts
      updatePresence(false);
    };
  }, [user, enabled, handleActivity, startHeartbeat, updatePresence]);

  return {
    updatePresence,
    setOnline: () => updatePresence(true),
    setOffline: () => updatePresence(false)
  };
}