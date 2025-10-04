'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useEffect, useState } from 'react';

export function UserStatusIndicator() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && user) {
      // Small delay to prevent flicker
      const timer = setTimeout(() => {
        setShowStatus(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } else if (!user) {
      setShowStatus(false);
    }
  }, [mounted, loading, user]);

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!mounted) {
    return <div className="w-48 h-5"></div>; // Placeholder to prevent layout shift
  }

  // Show loading state
  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-4 w-48 rounded"></div>
    );
  }

  // Don't show anything if not authenticated or not ready
  if (!user || !showStatus) {
    return <div className="w-48 h-5"></div>; // Maintain space to prevent layout shift
  }

  const displayName = user.name || user.email?.split('@')[0] || 'User';

  return (
    <span className="text-sm text-gray-600 font-medium min-w-48 text-right">
      You are logged in as {displayName}
    </span>
  );
}