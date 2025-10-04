'use client';

import { useAuth } from '@/components/auth/AuthProvider';

export function SimpleUserStatus() {
  const { user, loading } = useAuth();

  // Always render something to maintain layout
  if (loading) {
    return (
      <span className="text-sm text-gray-400 italic min-w-48 text-right">
        Loading...
      </span>
    );
  }

  if (!user) {
    return (
      <span className="text-sm text-gray-400 italic min-w-48 text-right">
        Not signed in
      </span>
    );
  }

  const displayName = user.name || user.email?.split('@')[0] || 'User';

  return (
    <span className="text-sm text-gray-600 font-medium min-w-48 text-right">
      Logged in as {displayName}
    </span>
  );
}