import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseBrowser } from '@/lib/supabase/client';

interface Friend {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  is_master_bot?: boolean;
  is_online?: boolean;
  last_seen?: string;
}

interface UseFriendsReturn {
  friends: Friend[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFriends(): UseFriendsReturn {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchFriends = useCallback(async () => {
    if (!user?.id) {
      setFriends([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const supabase = supabaseBrowser();
      
      // Query to get all accepted friend relationships for the current user
      const { data, error: queryError } = await supabase
        .from('friend_requests')
        .select(`
          id,
          requester_id,
          requested_id,
          status,
          requester:users!requester_id(
            id,
            username,
            display_name,
            email,
            avatar_url,
            is_master_bot,
            is_online,
            last_seen
          ),
          requested:users!requested_id(
            id,
            username,
            display_name,
            email,
            avatar_url,
            is_master_bot,
            is_online,
            last_seen
          )
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},requested_id.eq.${user.id}`);

      if (queryError) {
        console.error('Error fetching friends:', queryError);
        setError('Failed to load friends');
        return;
      }

      // Transform the data to get the friend (the other user in each relationship)
      const friendsList: Friend[] = (data || []).map((relationship: any) => {
        // If current user is the requester, return the requested user
        // If current user is the requested, return the requester user
        const friend = relationship.requester_id === user.id 
          ? relationship.requested 
          : relationship.requester;

        return {
          id: friend.id,
          username: friend.username,
          display_name: friend.display_name,
          email: friend.email,
          avatar_url: friend.avatar_url,
          is_master_bot: friend.is_master_bot,
          is_online: friend.is_online,
          last_seen: friend.last_seen,
        };
      });

      // Sort friends: masterbots first, then by display name
      friendsList.sort((a, b) => {
        if (a.is_master_bot && !b.is_master_bot) return -1;
        if (!a.is_master_bot && b.is_master_bot) return 1;
        return a.display_name.localeCompare(b.display_name);
      });

      setFriends(friendsList);
    } catch (error) {
      console.error('Exception fetching friends:', error);
      setError('An error occurred while loading friends');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // Set up real-time subscription for friend changes
  useEffect(() => {
    if (!user?.id) return;

    const supabase = supabaseBrowser();
    
    const subscription = supabase
      .channel('friend_requests_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friend_requests',
        filter: `requester_id=eq.${user.id} OR requested_id=eq.${user.id}`
      }, () => {
        // Refetch friends when friend requests change
        fetchFriends();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, fetchFriends]);

  return {
    friends,
    loading,
    error,
    refetch: fetchFriends,
  };
}