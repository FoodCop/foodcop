/**
 * ============================================================================
 * FRIEND REQUEST SERVICE — Social Graph Gate
 * ============================================================================
 *
 * Resolves and mutates the friend_requests relationship between two users.
 * ChatView uses FriendRelationshipState to decide whether a contact can be
 * messaged directly ('accepted'), needs a request sent ('none'), is waiting
 * on the other side ('outgoing-pending'), or has a request to respond to
 * ('incoming-pending').
 */

import { createClient } from '../supabase/client';

const supabase = createClient();

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';
export type FriendRelationshipState = 'none' | 'outgoing-pending' | 'incoming-pending' | 'accepted';

export interface FriendRequestRecord {
  id: string;
  requesterId: string;
  requestedId: string;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FriendRequestRelationship {
  state: FriendRelationshipState;
  request: FriendRequestRecord | null;
}

interface FriendResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const asRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
};

const toFriendRequestRecord = (value: unknown): FriendRequestRecord => {
  const row = asRecord(value);

  return {
    id: String(row.id || ''),
    requesterId: String(row.requester_id || ''),
    requestedId: String(row.requested_id || ''),
    status: row.status === 'accepted' || row.status === 'declined' ? row.status : 'pending',
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
};

const resolveRelationship = (
  currentUserId: string,
  otherUserId: string,
  requests: FriendRequestRecord[],
): FriendRequestRelationship => {
  const accepted = requests.find((request) => request.status === 'accepted');
  if (accepted) {
    return { state: 'accepted', request: accepted };
  }

  const incomingPending = requests.find((request) => (
    request.status === 'pending'
    && request.requesterId === otherUserId
    && request.requestedId === currentUserId
  ));
  if (incomingPending) {
    return { state: 'incoming-pending', request: incomingPending };
  }

  const outgoingPending = requests.find((request) => (
    request.status === 'pending'
    && request.requesterId === currentUserId
    && request.requestedId === otherUserId
  ));
  if (outgoingPending) {
    return { state: 'outgoing-pending', request: outgoingPending };
  }

  return { state: 'none', request: null };
};

export const FriendRequestService = {
  async getRelationship(currentUserId: string, otherUserId: string): Promise<FriendResult<FriendRequestRelationship>> {
    const client = supabase;
    if (!client) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const currentId = currentUserId.trim();
    const otherId = otherUserId.trim();
    if (!currentId || !otherId) {
      return { success: false, error: 'Both user ids are required' };
    }

    if (currentId === otherId) {
      return { success: true, data: { state: 'accepted', request: null } };
    }

    const { data, error } = await client
      .from('friend_requests')
      .select('id, requester_id, requested_id, status, created_at, updated_at')
      .or(`and(requester_id.eq.${currentId},requested_id.eq.${otherId}),and(requester_id.eq.${otherId},requested_id.eq.${currentId})`)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const requests = (data || []).map((row) => toFriendRequestRecord(row));

    return {
      success: true,
      data: resolveRelationship(currentId, otherId, requests),
    };
  },

  /**
   * Bulk variant of getRelationship - one query for every contact in the
   * inbox instead of one round-trip per contact (listContacts can return up
   * to 100 rows). Not present in the legacy service.
   */
  async getRelationshipsForUsers(
    currentUserId: string,
    otherUserIds: string[],
  ): Promise<FriendResult<Record<string, FriendRequestRelationship>>> {
    const client = supabase;
    if (!client) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const currentId = currentUserId.trim();
    const otherIds = [...new Set(otherUserIds.map((id) => id.trim()).filter(Boolean))];

    if (!currentId || otherIds.length === 0) {
      return { success: true, data: {} };
    }

    const { data, error } = await client
      .from('friend_requests')
      .select('id, requester_id, requested_id, status, created_at, updated_at')
      .or(`requester_id.eq.${currentId},requested_id.eq.${currentId}`)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const allRequests = (data || []).map((row) => toFriendRequestRecord(row));

    const relationships: Record<string, FriendRequestRelationship> = {};
    for (const otherId of otherIds) {
      const relevant = allRequests.filter((request) => (
        (request.requesterId === currentId && request.requestedId === otherId)
        || (request.requesterId === otherId && request.requestedId === currentId)
      ));
      relationships[otherId] = resolveRelationship(currentId, otherId, relevant);
    }

    return { success: true, data: relationships };
  },

  // All accepted friend ids for a user, either direction - used by the
  // Leaderboard's Friends tab and the card-sharing friend picker, both of
  // which only care about "who can I actually reach," not full relationship
  // state.
  async listAcceptedFriendIds(userId: string): Promise<FriendResult<string[]>> {
    const client = supabase;
    if (!client) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const id = userId.trim();
    if (!id) {
      return { success: true, data: [] };
    }

    const { data, error } = await client
      .from('friend_requests')
      .select('requester_id, requested_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${id},requested_id.eq.${id}`);

    if (error) {
      return { success: false, error: error.message };
    }

    const friendIds = (data || []).map((row) => (row.requester_id === id ? row.requested_id : row.requester_id));

    return { success: true, data: [...new Set(friendIds)] };
  },

  async sendRequest(currentUserId: string, otherUserId: string): Promise<FriendResult<FriendRequestRecord>> {
    const client = supabase;
    if (!client) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const currentId = currentUserId.trim();
    const otherId = otherUserId.trim();
    if (!currentId || !otherId) {
      return { success: false, error: 'Both user ids are required' };
    }

    const { data, error } = await client
      .from('friend_requests')
      .upsert({
        requester_id: currentId,
        requested_id: otherId,
        status: 'pending',
      }, {
        onConflict: 'requester_id,requested_id',
      })
      .select('id, requester_id, requested_id, status, created_at, updated_at')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: toFriendRequestRecord(data),
    };
  },

  async acceptRequest(requestId: string): Promise<FriendResult<FriendRequestRecord>> {
    const client = supabase;
    if (!client) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const trimmedRequestId = requestId.trim();
    if (!trimmedRequestId) {
      return { success: false, error: 'Request id is required' };
    }

    const { data, error } = await client
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', trimmedRequestId)
      .select('id, requester_id, requested_id, status, created_at, updated_at')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: toFriendRequestRecord(data),
    };
  },

  async declineRequest(requestId: string): Promise<FriendResult<FriendRequestRecord>> {
    const client = supabase;
    if (!client) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const trimmedRequestId = requestId.trim();
    if (!trimmedRequestId) {
      return { success: false, error: 'Request id is required' };
    }

    const { data, error } = await client
      .from('friend_requests')
      .update({ status: 'declined' })
      .eq('id', trimmedRequestId)
      .select('id, requester_id, requested_id, status, created_at, updated_at')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: toFriendRequestRecord(data),
    };
  },

  async cancelRequest(requestId: string): Promise<FriendResult<null>> {
    const client = supabase;
    if (!client) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const trimmedRequestId = requestId.trim();
    if (!trimmedRequestId) {
      return { success: false, error: 'Request id is required' };
    }

    const { error } = await client
      .from('friend_requests')
      .delete()
      .eq('id', trimmedRequestId);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: null,
    };
  },
};
