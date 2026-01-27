import { useState, useEffect } from 'react';
import { Search, UserPlus, Check, X, Loader2, Users } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { FriendService, type FriendData } from '../../services/friendService';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../ui/utils';
import { useDebounce } from '../../hooks/useDebounce';

interface FriendFinderProps {
  onUserClick?: (userId: string) => void;
  onStartConversation?: (userId: string) => void;
}

interface UserSearchResult extends FriendData {
  relationshipStatus: 'none' | 'friend' | 'incoming' | 'outgoing';
}

export function FriendFinder({ onUserClick, onStartConversation }: FriendFinderProps) {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [friendData, setFriendData] = useState<{
    friends: FriendData[];
    incomingRequests: FriendData[];
    outgoingRequests: FriendData[];
  } | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Load friend data on mount
  useEffect(() => {
    if (user?.id) {
      loadFriendData();
    }
  }, [user?.id]);

  // Search users when query changes
  useEffect(() => {
    if (user?.id) {
      searchUsers();
    }
  }, [debouncedSearch, user?.id]);

  const loadFriendData = async () => {
    if (!user?.id) return;

    const result = await FriendService.fetchAllFriendData(user.id);
    if (result.success && result.data) {
      setFriendData(result.data);
    }
  };

  const searchUsers = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    const result = await FriendService.searchUsers(user.id, debouncedSearch || undefined);
    
    if (result.success && result.data) {
      setUsers(result.data);
    } else {
      setUsers([]);
    }
    
    setIsLoading(false);
  };

  const handleSendRequest = async (requestedId: string) => {
    if (!user?.id || actionLoading) return;

    setActionLoading(requestedId);
    const result = await FriendService.sendFriendRequest(user.id, requestedId);
    
    if (result.success) {
      await loadFriendData();
      await searchUsers();
    }
    
    setActionLoading(null);
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (actionLoading) return;

    setActionLoading(requestId);
    const result = await FriendService.acceptFriendRequest(requestId);
    
    if (result.success) {
      await loadFriendData();
      await searchUsers();
    }
    
    setActionLoading(null);
  };

  const handleDeclineRequest = async (requestId: string) => {
    if (actionLoading) return;

    setActionLoading(requestId);
    const result = await FriendService.declineFriendRequest(requestId);
    
    if (result.success) {
      await loadFriendData();
      await searchUsers();
    }
    
    setActionLoading(null);
  };

  const handleCancelRequest = async (requestId: string) => {
    if (actionLoading) return;

    setActionLoading(requestId);
    const result = await FriendService.cancelFriendRequest(requestId);
    
    if (result.success) {
      await loadFriendData();
      await searchUsers();
    }
    
    setActionLoading(null);
  };

  const getRequestId = (userId: string, status: string): string | null => {
    if (!friendData) return null;

    if (status === 'incoming') {
      const request = friendData.incomingRequests.find(r => r.userId === userId);
      return request?.friendshipId || null;
    } else if (status === 'outgoing') {
      const request = friendData.outgoingRequests.find(r => r.userId === userId);
      return request?.friendshipId || null;
    }

    return null;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <p>Please sign in to find friends</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <Input
            type="text"
            placeholder="Search for users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white text-[#6B7280] placeholder:text-[#9CA3AF] border-gray-200"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 px-4">
            <Users className="h-12 w-12 mb-2 stroke-1" />
            <p className="text-center">
              {searchQuery ? 'No users found' : 'Start typing to search for users'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((userResult) => {
              const requestId = getRequestId(userResult.userId, userResult.relationshipStatus);
              const isLoading = actionLoading === userResult.userId || actionLoading === requestId;

              return (
                <div
                  key={userResult.userId}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={userResult.avatarUrl} />
                      <AvatarFallback className="bg-orange-100 text-orange-600">
                        {userResult.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {userResult.displayName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        @{userResult.username}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {userResult.relationshipStatus === 'friend' ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUserClick?.(userResult.userId)}
                            className="text-xs"
                          >
                            View
                          </Button>
                          {onStartConversation && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => onStartConversation(userResult.userId)}
                              className="bg-orange-500 hover:bg-orange-600 text-xs"
                            >
                              Message
                            </Button>
                          )}
                        </>
                      ) : userResult.relationshipStatus === 'incoming' ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => requestId && handleDeclineRequest(requestId)}
                            disabled={isLoading}
                            className="text-xs"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => requestId && handleAcceptRequest(requestId)}
                            disabled={isLoading}
                            className="bg-orange-500 hover:bg-orange-600 text-xs"
                          >
                            {isLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </Button>
                        </>
                      ) : userResult.relationshipStatus === 'outgoing' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => requestId && handleCancelRequest(requestId)}
                          disabled={isLoading}
                          className="text-xs"
                        >
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Cancel'
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSendRequest(userResult.userId)}
                          disabled={isLoading}
                          className="bg-orange-500 hover:bg-orange-600 text-xs"
                        >
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="h-3 w-3" />
                              Add
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendFinder;

