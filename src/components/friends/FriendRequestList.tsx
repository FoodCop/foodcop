import { useState, useEffect } from 'react';
import { Check, X, Loader2, UserPlus, Users } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { FriendService, type FriendData } from '../../services/friendService';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';

interface FriendRequestListProps {
  onUserClick?: (userId: string) => void;
  onStartConversation?: (userId: string) => void;
}

export function FriendRequestList({ onUserClick, onStartConversation }: FriendRequestListProps) {
  const { user } = useAuthStore();
  const [friendData, setFriendData] = useState<{
    friends: FriendData[];
    incomingRequests: FriendData[];
    outgoingRequests: FriendData[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadFriendData();
    }
  }, [user?.id]);

  const loadFriendData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    const result = await FriendService.fetchAllFriendData(user.id);
    
    if (result.success && result.data) {
      setFriendData(result.data);
    }
    
    setIsLoading(false);
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (actionLoading) return;

    setActionLoading(requestId);
    const result = await FriendService.acceptFriendRequest(requestId);
    
    if (result.success) {
      await loadFriendData();
    }
    
    setActionLoading(null);
  };

  const handleDeclineRequest = async (requestId: string) => {
    if (actionLoading) return;

    setActionLoading(requestId);
    const result = await FriendService.declineFriendRequest(requestId);
    
    if (result.success) {
      await loadFriendData();
    }
    
    setActionLoading(null);
  };

  const handleCancelRequest = async (requestId: string) => {
    if (actionLoading) return;

    setActionLoading(requestId);
    const result = await FriendService.cancelFriendRequest(requestId);
    
    if (result.success) {
      await loadFriendData();
    }
    
    setActionLoading(null);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <p>Please sign in to view friend requests</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const incomingCount = friendData?.incomingRequests.length || 0;
  const outgoingCount = friendData?.outgoingRequests.length || 0;

  if (incomingCount === 0 && outgoingCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 px-4">
        <Users className="h-12 w-12 mb-2 stroke-1" />
        <p className="text-center">No friend requests</p>
        <p className="text-sm text-center mt-1">
          Friend requests will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Incoming Requests */}
      {incomingCount > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 px-4">
            Incoming Requests ({incomingCount})
          </h3>
          <div className="divide-y divide-gray-100">
            {friendData!.incomingRequests.map((request) => {
              const isLoading = actionLoading === request.friendshipId;

              return (
                <div
                  key={request.friendshipId}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.avatarUrl} />
                      <AvatarFallback className="bg-orange-100 text-orange-600">
                        {request.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {request.displayName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        @{request.username}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeclineRequest(request.friendshipId)}
                        disabled={isLoading}
                        className="text-xs"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAcceptRequest(request.friendshipId)}
                        disabled={isLoading}
                        className="bg-orange-500 hover:bg-orange-600 text-xs"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Outgoing Requests */}
      {outgoingCount > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 px-4">
            Outgoing Requests ({outgoingCount})
          </h3>
          <div className="divide-y divide-gray-100">
            {friendData!.outgoingRequests.map((request) => {
              const isLoading = actionLoading === request.friendshipId;

              return (
                <div
                  key={request.friendshipId}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.avatarUrl} />
                      <AvatarFallback className="bg-orange-100 text-orange-600">
                        {request.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {request.displayName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        @{request.username}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelRequest(request.friendshipId)}
                        disabled={isLoading}
                        className="text-xs"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          'Cancel'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default FriendRequestList;

