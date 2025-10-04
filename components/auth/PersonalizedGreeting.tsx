'use client';

import { useAuth } from '@/components/auth/AuthProvider';

interface PersonalizedGreetingProps {
  prefix?: string;
  suffix?: string;
  className?: string;
  showFullGreeting?: boolean;
}

export function PersonalizedGreeting({ 
  prefix = "Hi", 
  suffix = "!", 
  className = "",
  showFullGreeting = true
}: PersonalizedGreetingProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (!user) {
    return showFullGreeting ? (
      <span className={className}>Welcome to FUZO!</span>
    ) : null;
  }

  const displayName = user.name || user.email?.split('@')[0] || 'User';

  return (
    <span className={className}>
      {prefix} {displayName}{suffix}
    </span>
  );
}

interface UserIndicatorProps {
  className?: string;
  showAvatar?: boolean;
}

export function UserIndicator({ className = "", showAvatar = false }: UserIndicatorProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse">
          {showAvatar && <div className="h-8 w-8 bg-gray-200 rounded-full"></div>}
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = user.name || user.email?.split('@')[0] || 'User';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showAvatar && user.avatar_url && (
        <img 
          src={user.avatar_url} 
          alt={displayName}
          className="h-8 w-8 rounded-full"
        />
      )}
      <span className="text-sm font-medium text-gray-700">
        Signed in as {displayName}
      </span>
    </div>
  );
}