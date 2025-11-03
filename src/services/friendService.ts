import { supabase } from './supabase';

// Friend request relationship types
export interface FriendRequest {
  id: string;
  requester_id: string;
  requested_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at?: string;
}

// Enriched friend data with user profile
export interface FriendData {
  friendshipId: string; // The friend_request ID
  userId: string; // The friend's user ID
  displayName: string;
  username: string;
  avatarUrl?: string;
  status: 'accepted' | 'pending_incoming' | 'pending_outgoing';
  createdAt: string;
  initiatedByMe: boolean; // Who sent the request
}

// Service response type
export interface FriendServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Comprehensive Friend Management Service
 * Handles all friend request operations and provides normalized data for chat integration
 */
export class FriendService {
  /**
   * Fetch all friend-related data for a user
   * Returns accepted friends, incoming requests, and outgoing requests
   */
  static async fetchAllFriendData(userId: string): Promise<FriendServiceResponse<{
    friends: FriendData[];
    incomingRequests: FriendData[];
    outgoingRequests: FriendData[];
  }>> {
    try {
      console.log('👥 Fetching all friend data for user:', userId);

      // Fetch all friend requests involving this user
      const { data: requests, error: requestError } = await supabase
        .from('friend_requests')
        .select(`
          id,
          requester_id,
          requested_id,
          status,
          created_at,
          updated_at,
          requester:users!friend_requests_requester_id_fkey(id, display_name, username, avatar_url),
          requested:users!friend_requests_requested_id_fkey(id, display_name, username, avatar_url)
        `)
        .or(`requester_id.eq.${userId},requested_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (requestError) {
        console.error('❌ Error fetching friend requests:', requestError);
        return {
          success: false,
          error: requestError.message
        };
      }

      console.log('📦 Raw friend requests:', requests);

      // Separate into categories
      const friends: FriendData[] = [];
      const incomingRequests: FriendData[] = [];
      const outgoingRequests: FriendData[] = [];

      requests?.forEach((request) => {
        const req = request as Record<string, unknown>;
        const isRequester = req.requester_id === userId;
        const friendUserRaw = isRequester ? req.requested : req.requester;
        const friendUser = Array.isArray(friendUserRaw) ? friendUserRaw[0] : (friendUserRaw as Record<string, unknown>);
        
        if (!friendUser || typeof friendUser !== 'object') {
          console.warn('⚠️ Missing user data for request:', req.id);
          return;
        }

        const friendData: FriendData = {
          friendshipId: req.id as string,
          userId: friendUser.id as string,
          displayName: (friendUser.display_name || friendUser.username || 'Unknown') as string,
          username: (friendUser.username || friendUser.id) as string,
          avatarUrl: friendUser.avatar_url as string | undefined,
          status: req.status === 'accepted' 
            ? 'accepted' 
            : isRequester 
              ? 'pending_outgoing' 
              : 'pending_incoming',
          createdAt: req.created_at as string,
          initiatedByMe: isRequester
        };

        // Categorize based on status and direction
        if (req.status === 'accepted') {
          friends.push(friendData);
        } else if (req.status === 'pending') {
          if (isRequester) {
            outgoingRequests.push(friendData);
          } else {
            incomingRequests.push(friendData);
          }
        }
      });

      console.log('✅ Friend data categorized:', {
        friends: friends.length,
        incoming: incomingRequests.length,
        outgoing: outgoingRequests.length
      });

      return {
        success: true,
        data: {
          friends,
          incomingRequests,
          outgoingRequests
        }
      };
    } catch (error) {
      console.error('💥 Error in fetchAllFriendData:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send a friend request
   */
  static async sendFriendRequest(
    requesterId: string,
    requestedId: string
  ): Promise<FriendServiceResponse<FriendRequest>> {
    try {
      console.log('📤 Sending friend request:', { requesterId, requestedId });

      // Check if request already exists
      const { data: existing } = await supabase
        .from('friend_requests')
        .select('id, status')
        .or(`and(requester_id.eq.${requesterId},requested_id.eq.${requestedId}),and(requester_id.eq.${requestedId},requested_id.eq.${requesterId})`)
        .single();

      if (existing) {
        return {
          success: false,
          error: 'Friend request already exists'
        };
      }

      // Create new request
      const { data, error } = await supabase
        .from('friend_requests')
        .insert({
          requester_id: requesterId,
          requested_id: requestedId,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error sending friend request:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Friend request sent:', data);
      return {
        success: true,
        data: data as FriendRequest
      };
    } catch (error) {
      console.error('💥 Error in sendFriendRequest:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Accept a friend request
   */
  static async acceptFriendRequest(requestId: string): Promise<FriendServiceResponse<FriendRequest>> {
    try {
      console.log('✅ Accepting friend request:', requestId);

      const { data, error } = await supabase
        .from('friend_requests')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error accepting friend request:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Friend request accepted:', data);
      return {
        success: true,
        data: data as FriendRequest
      };
    } catch (error) {
      console.error('💥 Error in acceptFriendRequest:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Decline a friend request
   */
  static async declineFriendRequest(requestId: string): Promise<FriendServiceResponse<void>> {
    try {
      console.log('❌ Declining friend request:', requestId);

      const { error } = await supabase
        .from('friend_requests')
        .update({
          status: 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        console.error('❌ Error declining friend request:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Friend request declined');
      return {
        success: true
      };
    } catch (error) {
      console.error('💥 Error in declineFriendRequest:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cancel a friend request (delete it)
   */
  static async cancelFriendRequest(requestId: string): Promise<FriendServiceResponse<void>> {
    try {
      console.log('🗑️ Canceling friend request:', requestId);

      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('❌ Error canceling friend request:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Friend request canceled');
      return {
        success: true
      };
    } catch (error) {
      console.error('💥 Error in cancelFriendRequest:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Remove a friend (delete the accepted friend request)
   */
  static async removeFriend(requestId: string): Promise<FriendServiceResponse<void>> {
    try {
      console.log('👋 Removing friend:', requestId);

      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('❌ Error removing friend:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Friend removed');
      return {
        success: true
      };
    } catch (error) {
      console.error('💥 Error in removeFriend:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search for users to add as friends
   * Excludes current user and annotates with relationship status
   */
  static async searchUsers(
    currentUserId: string,
    searchQuery?: string
  ): Promise<FriendServiceResponse<Array<FriendData & { relationshipStatus: 'none' | 'friend' | 'incoming' | 'outgoing' }>>> {
    try {
      console.log('🔍 Searching users:', searchQuery);

      // First, get all friend relationships for this user
      const friendData = await this.fetchAllFriendData(currentUserId);
      
      if (!friendData.success || !friendData.data) {
        return {
          success: false,
          error: 'Failed to fetch friend data'
        };
      }

      // Build sets for quick lookup
      const friendIds = new Set(friendData.data.friends.map(f => f.userId));
      const incomingIds = new Set(friendData.data.incomingRequests.map(f => f.userId));
      const outgoingIds = new Set(friendData.data.outgoingRequests.map(f => f.userId));

      // Search users
      let query = supabase
        .from('users')
        .select('id, display_name, username, avatar_url')
        .neq('id', currentUserId);

      if (searchQuery && searchQuery.trim()) {
        query = query.or(`display_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`);
      }

      const { data: users, error } = await query
        .order('display_name', { ascending: true })
        .limit(50);

      if (error) {
        console.error('❌ Error searching users:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Annotate with relationship status
      const annotatedUsers = (users || []).map(user => {
        const relationshipStatus: 'friend' | 'none' | 'incoming' | 'outgoing' = friendIds.has(user.id) 
          ? 'friend' 
          : incomingIds.has(user.id)
            ? 'incoming'
            : outgoingIds.has(user.id)
              ? 'outgoing'
              : 'none';
        
        return {
          friendshipId: '', // No friendship yet for search results
          userId: user.id,
          displayName: user.display_name || user.username || 'Unknown',
          username: user.username || user.id,
          avatarUrl: user.avatar_url,
          status: 'accepted' as const, // Placeholder
          createdAt: new Date().toISOString(),
          initiatedByMe: false,
          relationshipStatus
        };
      });

      console.log('✅ User search complete:', annotatedUsers.length, 'results');
      return {
        success: true,
        data: annotatedUsers
      };
    } catch (error) {
      console.error('💥 Error in searchUsers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get friend count statistics
   */
  static async getFriendStats(userId: string): Promise<FriendServiceResponse<{
    friendCount: number;
    incomingCount: number;
    outgoingCount: number;
  }>> {
    try {
      const result = await this.fetchAllFriendData(userId);
      
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error
        };
      }

      return {
        success: true,
        data: {
          friendCount: result.data.friends.length,
          incomingCount: result.data.incomingRequests.length,
          outgoingCount: result.data.outgoingRequests.length
        }
      };
    } catch (error) {
      console.error('💥 Error in getFriendStats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default FriendService;
