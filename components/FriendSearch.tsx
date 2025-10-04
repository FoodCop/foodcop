'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseBrowser } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  bio?: string;
  is_master_bot?: boolean;
  isFriend?: boolean;
  hasPendingRequest?: boolean;
}

interface FriendSearchProps {
  onFriendAdded?: () => void;
}

export function FriendSearch({ onFriendAdded }: FriendSearchProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);

  // Debounced search effect
  useEffect(() => {
    const performSearch = async () => {
      if (!user || searchQuery.trim().length < 2) return;

      setIsSearching(true);
      const supabase = supabaseBrowser();

      try {
        // Search users by username, display_name, or email
        const { data: users, error } = await supabase
          .from('users')
          .select('id, email, username, display_name, bio, is_master_bot')
          .neq('id', user.id) // Exclude current user
          .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
          .limit(10);

        if (error) {
          console.error('Search error:', error);
          return;
        }

        // Check friendship status for each user
        if (users && users.length > 0) {
          const userIds = users.map((u: any) => u.id);
          const { data: friendRequests } = await supabase
            .from('friend_requests')
            .select('requester_id, requested_id, status')
            .or(`and(requester_id.eq.${user.id},requested_id.in.(${userIds.join(',')})),and(requested_id.eq.${user.id},requester_id.in.(${userIds.join(',')}))`);

          // Map friendship status to users
          const usersWithFriendshipStatus = users.map((searchUser: any) => {
            const friendRequest = friendRequests?.find((req: any) => 
              (req.requester_id === user.id && req.requested_id === searchUser.id) ||
              (req.requested_id === user.id && req.requester_id === searchUser.id)
            );

            return {
              ...searchUser,
              isFriend: friendRequest?.status === 'accepted',
              hasPendingRequest: friendRequest?.status === 'pending'
            };
          });

          setSearchResults(usersWithFriendshipStatus);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Failed to search users');
      } finally {
        setIsSearching(false);
      }
    };

    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, user]);

  const sendFriendRequest = async (targetUserId: string) => {
    if (!user) return;

    setSendingRequestTo(targetUserId);
    
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          requester_id: user.id,
          requested_id: targetUserId,
          message: `Hi! I'd like to connect with you on FUZO.`,
          status: 'pending'
        });

      if (error) {
        console.error('Error sending friend request:', error);
        toast.error('Failed to send friend request');
      } else {
        toast.success('Friend request sent!');
        // Update the local state to show pending request
        setSearchResults(prev => prev.map(user => 
          user.id === targetUserId 
            ? { ...user, hasPendingRequest: true }
            : user
        ));
        onFriendAdded?.();
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    } finally {
      setSendingRequestTo(null);
    }
  };

  const getUserBadge = (user: User) => {
    if (user.is_master_bot) {
      return (
        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
          🤖 Masterbot
        </span>
      );
    }
    return null;
  };

  const getActionButton = (searchUser: User) => {
    if (searchUser.isFriend) {
      return (
        <Button variant="outline" size="sm" disabled>
          <Users className="h-4 w-4 mr-2" />
          Friends
        </Button>
      );
    }

    if (searchUser.hasPendingRequest) {
      return (
        <Button variant="outline" size="sm" disabled>
          ⏳ Pending
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        onClick={() => sendFriendRequest(searchUser.id)}
        disabled={sendingRequestTo === searchUser.id}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        {sendingRequestTo === searchUser.id ? 'Sending...' : 'Add Friend'}
      </Button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search for friends by name, username, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isSearching && (
        <div className="text-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Searching...</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-700">Search Results</h3>
          {searchResults.map((searchUser) => (
            <div key={searchUser.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/users/${searchUser.username}`}>
                    <h4 className="font-semibold hover:text-blue-600 cursor-pointer">{searchUser.display_name}</h4>
                  </Link>
                  {getUserBadge(searchUser)}
                </div>
                <Link href={`/users/${searchUser.username}`}>
                  <p className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer">@{searchUser.username}</p>
                </Link>
                {searchUser.bio && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{searchUser.bio}</p>
                )}
              </div>
              <div className="ml-4">
                {getActionButton(searchUser)}
              </div>
            </div>
          ))}
        </div>
      )}

      {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No users found matching &ldquo;{searchQuery}&rdquo;</p>
          <p className="text-sm">Try searching by username, name, or email</p>
        </div>
      )}

      {!searchQuery.trim() && (
        <div className="text-center py-8 text-gray-500">
          <Search className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>Search for friends to connect with</p>
          <p className="text-sm">Try searching for &ldquo;tako&rdquo;, &ldquo;chef_sophia&rdquo;, or &ldquo;streetfood_samurai&rdquo;</p>
        </div>
      )}
    </div>
  );
}