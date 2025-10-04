'use client';

import { Users, UserPlus, MessageCircle, User, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFriends } from '@/lib/hooks/useFriends';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export function CrewTab() {
  const { friends, loading, error } = useFriends();
  const { user } = useAuth();
  const router = useRouter();

  const handleViewProfile = (username: string) => {
    router.push(`/users/${username}`);
  };

  const handleStartChat = (friendId: string) => {
    // For now, navigate to the chat page
    // In the future, this could open a direct message
    router.push(`/chat?friend=${friendId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Users className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-500">Loading your crew...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-red-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Crew</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sign In Required</h3>
        <p className="text-gray-600 mb-4">
          Sign in to see your crew and connect with friends.
        </p>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Your Crew</h3>
        <p className="text-gray-600 mb-4">
          Connect with friends and discover what they&apos;re eating.
        </p>
        <Button variant="outline" onClick={() => router.push('/chat')}>
          <UserPlus className="w-4 h-4 mr-2" />
          Find Friends
        </Button>
      </div>
    );
  }

  const masterbots = friends.filter(friend => friend.is_master_bot);
  const realFriends = friends.filter(friend => !friend.is_master_bot);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Your Crew</h3>
          <p className="text-sm text-gray-600">
            {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/chat')}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Friends
        </Button>
      </div>

      {/* Food Experts (Masterbots) */}
      {masterbots.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-medium text-gray-700">Food Experts</h4>
            <Badge variant="secondary" className="text-xs">
              {masterbots.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {masterbots.map((friend) => (
              <Card key={friend.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        {friend.avatar_url ? (
                          <Image
                            src={friend.avatar_url}
                            alt={friend.display_name}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          <User className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <Crown className="absolute -top-1 -right-1 w-4 h-4 text-amber-500 bg-white rounded-full p-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {friend.display_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        @{friend.username}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewProfile(friend.username)}
                        title="View Profile"
                      >
                        <User className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleStartChat(friend.id)}
                        title="Start Chat"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Real Friends */}
      {realFriends.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-blue-500" />
            <h4 className="text-sm font-medium text-gray-700">Friends</h4>
            <Badge variant="secondary" className="text-xs">
              {realFriends.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {realFriends.map((friend) => (
              <Card key={friend.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                        {friend.avatar_url ? (
                          <Image
                            src={friend.avatar_url}
                            alt={friend.display_name}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          <User className="w-6 h-6 text-white" />
                        )}
                      </div>
                      {friend.is_online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {friend.display_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        @{friend.username}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewProfile(friend.username)}
                        title="View Profile"
                      >
                        <User className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleStartChat(friend.id)}
                        title="Start Chat"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for no friends */}
      {friends.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            No friends yet. Start connecting with other food lovers!
          </p>
          <Button variant="outline" onClick={() => router.push('/chat')}>
            <UserPlus className="w-4 h-4 mr-2" />
            Find Friends
          </Button>
        </div>
      )}
    </div>
  );
}