import { useState, useEffect } from 'react';
import { ArrowBack, Message, PersonAdd, Place, CalendarMonth, Loop } from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { FriendService } from '../../services/friendService';
import { ProfileService } from '../../services/profileService';
import type { UserProfile } from '../../types/profile';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { useDMChatStore } from '../../stores/chatStore';

interface UserProfileViewProps {
  userId: string;
  onBack: () => void;
  onStartConversation?: (userId: string) => void;
}

export function UserProfileView({ userId, onBack, onStartConversation }: UserProfileViewProps) {
  const { user } = useAuthStore();
  const { startConversation } = useDMChatStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState<'none' | 'incoming' | 'outgoing' | 'friend'>('none');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadProfile();
    checkFriendStatus();
  }, [userId]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      // Note: ProfileService.getProfile() gets current user's profile
      // We need to fetch another user's profile - using supabase directly
      const { supabase } = await import('../../services/supabase');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
      } else {
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkFriendStatus = async () => {
    if (!user?.id) return;

    const result = await FriendService.fetchAllFriendData(user.id);
    if (result.success && result.data) {
      const friend = result.data.friends.find(f => f.userId === userId);
      const incoming = result.data.incomingRequests.find(f => f.userId === userId);
      const outgoing = result.data.outgoingRequests.find(f => f.userId === userId);

      if (friend) {
        setIsFriend(true);
        setFriendRequestStatus('friend');
        setRequestId(friend.friendshipId);
      } else if (incoming) {
        setFriendRequestStatus('incoming');
        setRequestId(incoming.friendshipId);
      } else if (outgoing) {
        setFriendRequestStatus('outgoing');
        setRequestId(outgoing.friendshipId);
      } else {
        setFriendRequestStatus('none');
      }
    }
  };

  const handleSendRequest = async () => {
    if (!user?.id || actionLoading) return;

    setActionLoading(true);
    const result = await FriendService.sendFriendRequest(user.id, userId);

    if (result.success) {
      await checkFriendStatus();
    }

    setActionLoading(false);
  };

  const handleAcceptRequest = async () => {
    if (!requestId || actionLoading) return;

    setActionLoading(true);
    const result = await FriendService.acceptFriendRequest(requestId);

    if (result.success) {
      await checkFriendStatus();
    }

    setActionLoading(false);
  };

  const handleDeclineRequest = async () => {
    if (!requestId || actionLoading) return;

    setActionLoading(true);
    const result = await FriendService.declineFriendRequest(requestId);

    if (result.success) {
      await checkFriendStatus();
    }

    setActionLoading(false);
  };

  const handleCancelRequest = async () => {
    if (!requestId || actionLoading) return;

    setActionLoading(true);
    const result = await FriendService.cancelFriendRequest(requestId);

    if (result.success) {
      await checkFriendStatus();
    }

    setActionLoading(false);
  };

  const handleStartConversation = async () => {
    if (!user?.id || !onStartConversation) return;

    const conversationId = await startConversation(user.id, userId);
    if (conversationId) {
      onStartConversation(userId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p>User not found</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-semibold text-lg">Profile</h2>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Avatar and Basic Info */}
        <div className="flex flex-col items-center mb-6">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="bg-orange-100 text-orange-600 text-2xl">
              {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {profile.display_name || profile.username || 'Unknown User'}
          </h3>
          {profile.username && (
            <p className="text-sm text-gray-500 mb-4">@{profile.username}</p>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-6">
            <p className="text-gray-700">{profile.bio}</p>
          </div>
        )}

        {/* Location */}
        {(profile.location_city || profile.location_country) && (
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">
              {[profile.location_city, profile.location_state, profile.location_country]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
        )}

        {/* Member Since */}
        {profile.created_at && (
          <div className="flex items-center gap-2 text-gray-600 mb-6">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              Member since {new Date(profile.created_at).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 mt-6">
          {friendRequestStatus === 'friend' ? (
            <>
              {onStartConversation && (
                <Button
                  onClick={handleStartConversation}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              )}
            </>
          ) : friendRequestStatus === 'incoming' ? (
            <>
              <Button
                onClick={handleAcceptRequest}
                disabled={actionLoading}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Accept Friend Request
              </Button>
              <Button
                variant="outline"
                onClick={handleDeclineRequest}
                disabled={actionLoading}
                className="w-full"
              >
                Decline
              </Button>
            </>
          ) : friendRequestStatus === 'outgoing' ? (
            <Button
              variant="outline"
              onClick={handleCancelRequest}
              disabled={actionLoading}
              className="w-full"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                'Cancel Friend Request'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSendRequest}
              disabled={actionLoading}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Send Friend Request
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfileView;

