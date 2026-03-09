import { supabase } from '../../../services/supabaseClient';

type ChatSharedItem = {
  name?: string;
  [key: string]: unknown;
};

export interface ChatContact {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  sharedItem: ChatSharedItem | null;
  createdAt: string;
}

interface ChatResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ChatConversationParticipants {
  id: string;
  participant1: string;
  participant2: string;
}

interface ChatIncomingMessageNotice {
  message: ChatMessage;
  otherUserId: string;
}

export const ChatService = {
  async listContacts(currentUserId: string): Promise<ChatResult<ChatContact[]>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const { data, error } = await client
      .from('users')
      .select('id, display_name, username, avatar_url, is_online, last_seen, is_master_bot')
      .neq('id', currentUserId)
      .eq('is_master_bot', false)
      .order('points_total', { ascending: false })
      .limit(100);

    if (error) {
      return { success: false, error: error.message };
    }

    const contacts = (data || []).map((row: any) => ({
      id: row.id,
      name: row.display_name || row.username || 'User',
      username: row.username || 'fuzo_user',
      avatar: row.avatar_url || `https://i.pravatar.cc/150?u=${row.id}`,
      isOnline: Boolean(row.is_online),
      lastSeen: row.last_seen || null,
    }));

    return { success: true, data: contacts };
  },

  async getOrCreateConversation(currentUserId: string, otherUserId: string): Promise<ChatResult<{ id: string }>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const [participant1, participant2] = [currentUserId, otherUserId].sort((left, right) => left.localeCompare(right));

    const { data: existing, error: existingError } = await client
      .from('dm_conversations')
      .select('id')
      .or(`and(participant_1.eq.${participant1},participant_2.eq.${participant2})`)
      .maybeSingle();

    if (existingError) {
      return { success: false, error: existingError.message };
    }

    if (existing?.id) {
      return { success: true, data: { id: existing.id } };
    }

    const { data, error } = await client
      .from('dm_conversations')
      .insert({
        participant_1: participant1,
        participant_2: participant2,
        initiator_id: currentUserId,
        status: 'active',
        accepted_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { id: data.id } };
  },

  async listMessages(conversationId: string): Promise<ChatResult<ChatMessage[]>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const { data, error } = await client
      .from('dm_messages')
      .select('id, conversation_id, sender_id, content, shared_item, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: (data || []).map((row: any) => ({
        id: row.id,
        conversationId: row.conversation_id,
        senderId: row.sender_id,
        content: row.content || '',
        sharedItem: row.shared_item || null,
        createdAt: row.created_at,
      })),
    };
  },

  async getConversationParticipants(conversationId: string): Promise<ChatResult<ChatConversationParticipants>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const { data, error } = await client
      .from('dm_conversations')
      .select('id, participant_1, participant_2')
      .eq('id', conversationId)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: error?.message || 'Conversation not found' };
    }

    return {
      success: true,
      data: {
        id: data.id,
        participant1: data.participant_1,
        participant2: data.participant_2,
      },
    };
  },

  async sendTextMessage(params: {
    conversationId: string;
    senderId: string;
    content: string;
  }): Promise<ChatResult<ChatMessage>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const { data, error } = await client
      .from('dm_messages')
      .insert({
        conversation_id: params.conversationId,
        sender_id: params.senderId,
        content: params.content,
      })
      .select('id, conversation_id, sender_id, content, shared_item, created_at')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        id: data.id,
        conversationId: data.conversation_id,
        senderId: data.sender_id,
        content: data.content || '',
        sharedItem: data.shared_item || null,
        createdAt: data.created_at,
      },
    };
  },

  async sendSharedItemMessage(params: {
    conversationId: string;
    senderId: string;
    item: ChatSharedItem;
  }): Promise<ChatResult<ChatMessage>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const { data, error } = await client
      .from('dm_messages')
      .insert({
        conversation_id: params.conversationId,
        sender_id: params.senderId,
        content: `Shared: ${params.item?.name || 'item'}`,
        shared_item: params.item,
      })
      .select('id, conversation_id, sender_id, content, shared_item, created_at')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        id: data.id,
        conversationId: data.conversation_id,
        senderId: data.sender_id,
        content: data.content || '',
        sharedItem: data.shared_item || null,
        createdAt: data.created_at,
      },
    };
  },

  subscribeToConversationMessages(conversationId: string, onMessage: (message: ChatMessage) => void) {
    const client = supabase;
    if (!client) {
      return () => undefined;
    }

    const channel = client
      .channel(`dm_messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'dm_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload: any) => {
        const row = payload.new || {};
        onMessage({
          id: row.id,
          conversationId: row.conversation_id,
          senderId: row.sender_id,
          content: row.content || '',
          sharedItem: row.shared_item || null,
          createdAt: row.created_at,
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  },

  subscribeToIncomingMessages(currentUserId: string, onIncoming: (notice: ChatIncomingMessageNotice) => void) {
    const client = supabase;
    if (!client) {
      return () => undefined;
    }

    const channel = client
      .channel(`dm_messages:user:${currentUserId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'dm_messages',
      }, async (payload: any) => {
        const row = payload.new || {};
        if (!row.id || !row.conversation_id || !row.sender_id) return;
        if (row.sender_id === currentUserId) return;

        const conversation = await ChatService.getConversationParticipants(row.conversation_id);
        if (!conversation.success || !conversation.data) return;

        const { participant1, participant2 } = conversation.data;
        if (participant1 !== currentUserId && participant2 !== currentUserId) return;

        const otherUserId = participant1 === currentUserId ? participant2 : participant1;

        onIncoming({
          otherUserId,
          message: {
            id: row.id,
            conversationId: row.conversation_id,
            senderId: row.sender_id,
            content: row.content || '',
            sharedItem: row.shared_item || null,
            createdAt: row.created_at,
          },
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  },
};
