'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Check, 
  X, 
  Search, 
  MessageCircle,
  Clock,
  UserCheck
} from 'lucide-react';
import Image from 'next/image';

interface User {
  id: string;
  display_name: string;
  username: string;
  email: string;
  avatar_url?: string;
}

interface FriendRequest {
  id: string;
  requester_id: string;
  requested_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  created_at: string;
  requester?: User;
  requested?: User;
}

interface FriendManagementProps {
  onStartChat?: (friendId: string) => void;
}

export function FriendManagement({ onStartChat }: FriendManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [friendRequestMessage, setFriendRequestMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'pending' | 'friends'>('search');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const loadFriendRequests = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const supabase = supabaseBrowser();
      
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          requester:users!requester_id(id, display_name, username, email, avatar_url),
          requested:users!requested_id(id, display_name, username, email, avatar_url)
        `)
        .or(`requester_id.eq.${user.id},requested_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading friend requests:', error);
        return;
      }

      setFriendRequests(data || []);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFriendRequests();
    }
  }, [user, loadFriendRequests]);

  // Setup Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const supabase = supabaseBrowser();
    
    const friendRequestsSubscription = supabase
      .channel('friend_requests_realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'friend_requests'
        },
        (payload: any) => {
          // Check if this change is relevant to the current user
          const { new: newData, old: oldData } = payload;
          const relevantChange = 
            (newData && (newData.requester_id === user.id || newData.requested_id === user.id)) ||
            (oldData && (oldData.requester_id === user.id || oldData.requested_id === user.id));
          
          if (relevantChange) {
            loadFriendRequests();
          }
        }
      )
      .subscribe();

    return () => {
      friendRequestsSubscription.unsubscribe();
    };
  }, [user, loadFriendRequests]);

  const searchUsers = async () => {
    if (!searchTerm.trim() || !user) return;

    try {
      setIsSearching(true);
      const supabase = supabaseBrowser();
      
      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, username, email, avatar_url')
        .or(`display_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .neq('id', user.id)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        return;
      }

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    if (!user) return;

    try {
      const supabase = supabaseBrowser();
      
      // Check if request already exists
      const { data: existing } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`and(requester_id.eq.${user.id},requested_id.eq.${userId}),and(requester_id.eq.${userId},requested_id.eq.${user.id})`)
        .single();

      if (existing) {
        alert('Friend request already exists between you and this user.');
        return;
      }

      const { error } = await supabase
        .from('friend_requests')
        .insert({
          requester_id: user.id,
          requested_id: userId,
          status: 'pending',
          message: friendRequestMessage.trim() || 'Hi! Let\'s connect and share food discoveries!'
        });

      if (error) {
        console.error('Error sending friend request:', error);
        alert('Failed to send friend request');
        return;
      }

      alert('Friend request sent successfully!');
      setFriendRequestMessage('');
      loadFriendRequests();
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request');
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const supabase = supabaseBrowser();
      
      const { error } = await supabase
        .from('friend_requests')
        .update({ 
          status: 'accepted', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error accepting friend request:', error);
        alert('Failed to accept friend request');
        return;
      }

      alert('Friend request accepted!');
      loadFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request');
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const supabase = supabaseBrowser();
      
      const { error } = await supabase
        .from('friend_requests')
        .update({ 
          status: 'rejected', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting friend request:', error);
        alert('Failed to reject friend request');
        return;
      }

      alert('Friend request rejected.');
      loadFriendRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Failed to reject friend request');
    }
  };

  const getExistingRequestStatus = (userId: string): 'none' | 'sent' | 'received' | 'friends' => {
    if (!user) return 'none';

    const existing = friendRequests.find(req => 
      (req.requester_id === user.id && req.requested_id === userId) ||
      (req.requester_id === userId && req.requested_id === user.id)
    );

    if (!existing) return 'none';
    if (existing.status === 'accepted') return 'friends';
    if (existing.requester_id === user.id) return 'sent';
    return 'received';
  };

  const pendingRequests = friendRequests.filter(
    req => req.status === 'pending' && req.requested_id === user?.id
  );

  const sentRequests = friendRequests.filter(
    req => req.status === 'pending' && req.requester_id === user?.id
  );

  const acceptedFriends = friendRequests.filter(req => req.status === 'accepted');

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
          <p className="text-gray-600">Please sign in to manage your friends and send friend requests.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Friend Management
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'search' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('search')}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Find Friends
          </Button>
          <Button 
            variant={activeTab === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('pending')}
          >
            <Clock className="h-4 w-4 mr-1" />
            Requests ({pendingRequests.length})
          </Button>
          <Button 
            variant={activeTab === 'friends' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('friends')}
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Friends ({acceptedFriends.length})
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading...</p>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && !isLoading && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, username, or email..."
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              />
              <Button onClick={searchUsers} disabled={isSearching}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Friend Request Message</label>
              <textarea
                value={friendRequestMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFriendRequestMessage(e.target.value)}
                placeholder="Hi! Let's connect and share food discoveries!"
                rows={2}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Search Results:</h4>
                {searchResults.map((result) => {
                  const requestStatus = getExistingRequestStatus(result.id);
                  
                  return (
                    <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {result.avatar_url && (
                          <Image
                            src={result.avatar_url}
                            alt={result.display_name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        )}
                        <div>
                          <p className="font-medium">{result.display_name}</p>
                          <p className="text-sm text-gray-600">@{result.username}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {requestStatus === 'none' && (
                          <Button 
                            size="sm" 
                            onClick={() => sendFriendRequest(result.id)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Send Request
                          </Button>
                        )}
                        {requestStatus === 'sent' && (
                          <Badge variant="secondary">Request Sent</Badge>
                        )}
                        {requestStatus === 'received' && (
                          <Badge variant="secondary">Request Received</Badge>
                        )}
                        {requestStatus === 'friends' && (
                          <>
                            <Badge variant="default">Friends</Badge>
                            {onStartChat && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => onStartChat(result.id)}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                Chat
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Pending Requests Tab */}
        {activeTab === 'pending' && !isLoading && (
          <div className="space-y-4">
            <h4 className="font-semibold">Incoming Friend Requests ({pendingRequests.length})</h4>
            {pendingRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending friend requests</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {request.requester?.avatar_url && (
                        <Image
                          src={request.requester.avatar_url}
                          alt={request.requester.display_name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium">{request.requester?.display_name}</p>
                        <p className="text-sm text-gray-600">@{request.requester?.username}</p>
                        {request.message && (
                          <p className="text-sm text-gray-700 mt-1">&quot;{request.message}&quot;</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => acceptFriendRequest(request.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => rejectFriendRequest(request.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sentRequests.length > 0 && (
              <div className="mt-8">
                <h4 className="font-semibold mb-4">Sent Requests ({sentRequests.length})</h4>
                <div className="space-y-3">
                  {sentRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        {request.requested?.avatar_url && (
                          <Image
                            src={request.requested.avatar_url}
                            alt={request.requested.display_name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        )}
                        <div>
                          <p className="font-medium">{request.requested?.display_name}</p>
                          <p className="text-sm text-gray-600">@{request.requested?.username}</p>
                          <p className="text-xs text-gray-500">
                            Sent {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && !isLoading && (
          <div className="space-y-4">
            <h4 className="font-semibold">Your Friends ({acceptedFriends.length})</h4>
            {acceptedFriends.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No friends yet. Send some friend requests to get started!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {acceptedFriends.map((request) => {
                  const friend = request.requester_id === user.id ? request.requested : request.requester;
                  if (!friend) return null;
                  
                  return (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {friend.avatar_url && (
                          <Image
                            src={friend.avatar_url}
                            alt={friend.display_name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        )}
                        <div>
                          <p className="font-medium">{friend.display_name}</p>
                          <p className="text-sm text-gray-600">@{friend.username}</p>
                          <p className="text-xs text-gray-500">
                            Friends since {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {onStartChat && (
                        <Button 
                          size="sm"
                          onClick={() => onStartChat(friend.id)}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}