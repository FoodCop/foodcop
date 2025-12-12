import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types
export interface DMConversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  created_at: string;
  status?: 'pending' | 'active' | 'declined';
  accepted_at?: string | null;
  initiator_id?: string | null;
  // Enriched fields (joined)
  other_user?: {
    id: string;
    display_name: string;
    username: string;
    avatar_url?: string;
  };
  last_message?: DMMessage;
  unread_count?: number;
}

export interface SharedItem {
  type: 'restaurant' | 'recipe' | 'video';
  id: string;
  title: string;
  image_url?: string;
  subtitle?: string;
  metadata?: Record<string, unknown>;
}

export interface DMMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  shared_item: SharedItem | null;
  read_at: string | null;
  created_at: string;
  // Enriched
  sender?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface DMServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * DM Chat Service
 * Handles 1-on-1 direct messaging with Supabase Realtime
 */
export class DMChatService {
  private static readonly messageChannels: Map<string, RealtimeChannel> = new Map();

  /**
   * Get or create a conversation between two users
   * Creates as 'pending' if users aren't friends, 'active' if they are
   */
  static async getOrCreateConversation(
    userId: string,
    otherUserId: string,
    isFriend: boolean = false
  ): Promise<DMServiceResponse<DMConversation>> {
    try {
      // Normalize order for unique constraint
      const [p1, p2] = [userId, otherUserId].sort((a, b) => a.localeCompare(b));

      // Check if conversation exists
      const { data: existing, error: fetchError } = await supabase
        .from('dm_conversations')
        .select('*')
        .or(`and(participant_1.eq.${p1},participant_2.eq.${p2})`)
        .single();

      if (existing && !fetchError) {
        return { success: true, data: existing };
      }

      // Create new conversation
      // If users are friends, create as 'active', otherwise 'pending'
      const status = isFriend ? 'active' : 'pending';
      const acceptedAt = isFriend ? new Date().toISOString() : null;

      const { data, error } = await supabase
        .from('dm_conversations')
        .insert({
          participant_1: p1,
          participant_2: p2,
          status,
          accepted_at: acceptedAt,
          initiator_id: userId, // The user who initiated
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating conversation:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('💥 Error in getOrCreateConversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Accept a message request (move from pending to active)
   */
  static async acceptMessageRequest(
    conversationId: string
  ): Promise<DMServiceResponse<DMConversation>> {
    try {
      const { data, error } = await supabase
        .from('dm_conversations')
        .update({
          status: 'active',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error accepting message request:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('💥 Error in acceptMessageRequest:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Decline a message request
   */
  static async declineMessageRequest(
    conversationId: string
  ): Promise<DMServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('dm_conversations')
        .update({
          status: 'declined',
        })
        .eq('id', conversationId);

      if (error) {
        console.error('❌ Error declining message request:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('💥 Error in declineMessageRequest:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetch pending message requests for a user
   */
  static async fetchPendingRequests(
    userId: string
  ): Promise<DMServiceResponse<DMConversation[]>> {
    try {
      const { data, error } = await supabase
        .from('dm_conversations')
        .select(
          `
          *,
          user1:users!dm_conversations_participant_1_fkey(id, display_name, username, avatar_url),
          user2:users!dm_conversations_participant_2_fkey(id, display_name, username, avatar_url)
        `
        )
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching pending requests:', error);
        return { success: false, error: error.message };
      }

      // Enrich with other_user and last message
      const enriched = await Promise.all(
        (data || []).map(async (conv) => {
          const isP1 = conv.participant_1 === userId;
          const otherUserData = isP1 ? conv.user2 : conv.user1;
          const otherUser = Array.isArray(otherUserData)
            ? otherUserData[0]
            : otherUserData;

          // Get last message
          const { data: lastMsg } = await supabase
            .from('dm_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            other_user: otherUser,
            last_message: lastMsg || undefined,
            unread_count: 0, // Pending requests don't count as unread
          };
        })
      );

      return { success: true, data: enriched };
    } catch (error) {
      console.error('💥 Error in fetchPendingRequests:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetch all conversations for a user with enriched data
   * Only returns 'active' conversations (not pending requests)
   */
  static async fetchConversations(
    userId: string
  ): Promise<DMServiceResponse<DMConversation[]>> {
    try {
      const { data, error } = await supabase
        .from('dm_conversations')
        .select(
          `
          *,
          user1:users!dm_conversations_participant_1_fkey(id, display_name, username, avatar_url),
          user2:users!dm_conversations_participant_2_fkey(id, display_name, username, avatar_url)
        `
        )
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching conversations:', error);
        return { success: false, error: error.message };
      }

      // Enrich with other_user and last message
      const enriched = await Promise.all(
        (data || []).map(async (conv) => {
          const isP1 = conv.participant_1 === userId;
          const otherUserData = isP1 ? conv.user2 : conv.user1;
          const otherUser = Array.isArray(otherUserData)
            ? otherUserData[0]
            : otherUserData;

          // Get last message
          const { data: lastMsg } = await supabase
            .from('dm_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count } = await supabase
            .from('dm_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', userId)
            .is('read_at', null);

          return {
            ...conv,
            other_user: otherUser,
            last_message: lastMsg || undefined,
            unread_count: count || 0,
          };
        })
      );

      return { success: true, data: enriched };
    } catch (error) {
      console.error('💥 Error in fetchConversations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetch messages for a conversation
   */
  static async fetchMessages(
    conversationId: string,
    limit = 50,
    before?: string
  ): Promise<DMServiceResponse<DMMessage[]>> {
    try {
      let query = supabase
        .from('dm_messages')
        .select(
          `
          *,
          sender:users!dm_messages_sender_id_fkey(id, display_name, avatar_url)
        `
        )
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching messages:', error);
        return { success: false, error: error.message };
      }

      // Flatten sender
      const messages = (data || []).map((msg) => ({
        ...msg,
        sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender,
      }));

      return { success: true, data: [...messages].reverse() };
    } catch (error) {
      console.error('💥 Error in fetchMessages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send a text message
   */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    content: string
  ): Promise<DMServiceResponse<DMMessage>> {
    try {
      const { data, error } = await supabase
        .from('dm_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error sending message:', error);
        return { success: false, error: error.message };
      }

      // Update conversation last_message_at
      await supabase
        .from('dm_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return { success: true, data };
    } catch (error) {
      console.error('💥 Error in sendMessage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Share an item (restaurant, recipe, video) in a conversation
   */
  static async shareItem(
    conversationId: string,
    senderId: string,
    sharedItem: SharedItem,
    message?: string
  ): Promise<DMServiceResponse<DMMessage>> {
    try {
      const { data, error } = await supabase
        .from('dm_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: message || null,
          shared_item: sharedItem,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error sharing item:', error);
        return { success: false, error: error.message };
      }

      // Update conversation last_message_at
      await supabase
        .from('dm_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return { success: true, data };
    } catch (error) {
      console.error('💥 Error in shareItem:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(
    conversationId: string,
    userId: string
  ): Promise<DMServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('dm_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .is('read_at', null);

      if (error) {
        console.error('❌ Error marking as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('💥 Error in markAsRead:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Subscribe to new messages in a conversation
   */
  static subscribeToMessages(
    conversationId: string,
    onMessage: (message: DMMessage) => void
  ): () => void {
    const channelName = `dm_messages:${conversationId}`;

    // Cleanup existing subscription
    if (this.messageChannels.has(channelName)) {
      this.messageChannels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dm_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onMessage(payload.new as DMMessage);
        }
      )
      .subscribe();

    this.messageChannels.set(channelName, channel);

    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
      this.messageChannels.delete(channelName);
    };
  }

  /**
   * Subscribe to all new messages for a user (across all conversations)
   * Used for unread count tracking
   */
  static subscribeToUserMessages(
    userId: string,
    onMessage: (message: DMMessage) => void
  ): () => void {
    const channelName = `user_messages:${userId}`;

    // Cleanup existing subscription
    if (this.messageChannels.has(channelName)) {
      this.messageChannels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dm_messages',
        },
        async (payload) => {
          const message = payload.new as DMMessage;

          // Check if this message belongs to a conversation involving this user
          const { data: conversation } = await supabase
            .from('dm_conversations')
            .select('*')
            .eq('id', message.conversation_id)
            .single();

          if (conversation &&
            (conversation.participant_1 === userId || conversation.participant_2 === userId)) {
            onMessage(message);
          }
        }
      )
      .subscribe();

    this.messageChannels.set(channelName, channel);

    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
      this.messageChannels.delete(channelName);
    };
  }

  /**
   * Subscribe to conversation updates (new messages in any conversation)
   */
  static subscribeToConversations(
    userId: string,
    onUpdate: () => void
  ): () => void {
    const channel = supabase
      .channel(`user_conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dm_conversations',
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }

  /**
   * Get total unread count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      // Get all conversation IDs for this user
      const { data: convs } = await supabase
        .from('dm_conversations')
        .select('id')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

      if (!convs || convs.length === 0) return 0;

      const convIds = convs.map((c) => c.id);

      const { count } = await supabase
        .from('dm_messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', convIds)
        .neq('sender_id', userId)
        .is('read_at', null);

      return count || 0;
    } catch (error) {
      console.error('💥 Error getting unread count:', error);
      return 0;
    }
  }
}

export default DMChatService;

