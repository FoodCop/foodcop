import { create } from 'zustand';
import {
  DMConversation,
  DMMessage,
  SharedItem,
  DMChatService,
} from '../services/dmChatService';
import { FriendService } from '../services/friendService';

interface DMChatStore {
  // UI State
  isOpen: boolean;
  activeConversationId: string | null;

  // Data
  conversations: DMConversation[];
  messages: Record<string, DMMessage[]>; // keyed by conversation_id
  unreadCount: number;
  messageStatus: Record<string, 'sending' | 'sent' | 'failed'>; // keyed by message.id

  // Loading states
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;

  // Actions - UI
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  setActiveConversation: (conversationId: string | null) => void;

  // Actions - Data
  loadConversations: (userId: string) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (
    conversationId: string,
    senderId: string,
    content: string
  ) => Promise<boolean>;
  shareItem: (
    conversationId: string,
    senderId: string,
    item: SharedItem,
    message?: string
  ) => Promise<boolean>;
  markAsRead: (conversationId: string, userId: string) => Promise<void>;
  startConversation: (
    userId: string,
    otherUserId: string
  ) => Promise<string | null>;
  refreshUnreadCount: (userId: string) => Promise<void>;

  // Realtime
  addMessage: (message: DMMessage, currentUserId?: string) => void;
  subscribeToConversation: (conversationId: string) => () => void;
  subscribeToUnreadCount: (userId: string) => () => void;
  decrementUnreadCount: (count: number) => void;
  setMessageStatus: (messageId: string, status: 'sending' | 'sent' | 'failed') => void;
  retryMessage: (conversationId: string, senderId: string, content: string, tempId: string) => Promise<void>;
  
  // Notifications
  onNewMessageNotification?: (message: DMMessage, conversation: DMConversation | undefined) => void;
  setNotificationCallback: (callback: (message: DMMessage, conversation: DMConversation | undefined) => void) => void;
}

export const useDMChatStore = create<DMChatStore>((set, get) => ({
  // Initial state
  isOpen: false,
  activeConversationId: null,
  conversations: [],
  messages: {},
  unreadCount: 0,
  messageStatus: {},
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSending: false,

  // UI Actions
  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false, activeConversationId: null }),
  toggleChat: () =>
    set((state) => ({
      isOpen: !state.isOpen,
      activeConversationId: state.isOpen ? null : state.activeConversationId,
    })),
  setActiveConversation: (conversationId) =>
    set({ activeConversationId: conversationId }),

  // Data Actions
  loadConversations: async (userId: string) => {
    set({ isLoadingConversations: true });
    const result = await DMChatService.fetchConversations(userId);
    if (result.success && result.data) {
      set({ conversations: result.data });
    }
    set({ isLoadingConversations: false });
  },

  loadMessages: async (conversationId: string) => {
    set({ isLoadingMessages: true });
    const result = await DMChatService.fetchMessages(conversationId);
    if (result.success && result.data) {
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: result.data!,
        },
      }));
    }
    set({ isLoadingMessages: false });
  },

  sendMessage: async (conversationId, senderId, content) => {
    // Create temporary message ID for optimistic UI
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const tempMessage: DMMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      shared_item: null,
      read_at: null,
      created_at: new Date().toISOString(),
    };

    // Optimistically add message with 'sending' status
    set((state) => ({
      isSending: true,
      messages: {
        ...state.messages,
        [conversationId]: [
          ...(state.messages[conversationId] || []),
          tempMessage,
        ],
      },
      messageStatus: {
        ...state.messageStatus,
        [tempId]: 'sending',
      },
    }));

    const result = await DMChatService.sendMessage(
      conversationId,
      senderId,
      content
    );
    set({ isSending: false });

    if (result.success && result.data) {
      // Replace temp message with real message
      set((state) => {
        const messages = state.messages[conversationId] || [];
        const filtered = messages.filter((m) => m.id !== tempId);
        
        return {
          messages: {
            ...state.messages,
            [conversationId]: [...filtered, result.data!],
          },
          messageStatus: {
            ...state.messageStatus,
            [result.data!.id]: 'sent',
            [tempId]: undefined as any, // Remove temp status
          },
        };
      });
      return true;
    } else {
      // Mark as failed
      set((state) => ({
        messageStatus: {
          ...state.messageStatus,
          [tempId]: 'failed',
        },
      }));
      return false;
    }
  },

  shareItem: async (conversationId, senderId, item, message) => {
    set({ isSending: true });
    const result = await DMChatService.shareItem(
      conversationId,
      senderId,
      item,
      message
    );
    set({ isSending: false });

    if (result.success && result.data) {
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: [
            ...(state.messages[conversationId] || []),
            result.data!,
          ],
        },
      }));
      return true;
    }
    return false;
  },

  markAsRead: async (conversationId, userId) => {
    await DMChatService.markAsRead(conversationId, userId);
    // Update local state
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ),
    }));
  },

  startConversation: async (userId, otherUserId) => {
    // Check if users are friends
    let isFriend = false;
    try {
      const friendResult = await FriendService.fetchAllFriendData(userId);
      if (friendResult.success && friendResult.data) {
        isFriend = friendResult.data.friends.some(f => f.userId === otherUserId);
      }
    } catch (error) {
      console.error('Error checking friend status:', error);
      // Default to non-friend (pending) if check fails
    }

    const result = await DMChatService.getOrCreateConversation(
      userId,
      otherUserId,
      isFriend
    );
    if (result.success && result.data) {
      // Refresh conversations list (and requests if pending)
      await get().loadConversations(userId);
      return result.data.id;
    }
    return null;
  },

  refreshUnreadCount: async (userId: string) => {
    const count = await DMChatService.getUnreadCount(userId);
    set({ unreadCount: count });
  },

  // Realtime
  addMessage: (message: DMMessage, currentUserId?: string) => {
    const state = get();
    const convId = message.conversation_id;
    const existing = state.messages[convId] || [];
    
    // Avoid duplicates
    if (existing.some((m) => m.id === message.id)) {
      return;
    }

    // Find conversation for notification
    const conversation = state.conversations.find((c) => c.id === convId);

    // Increment unread count if message is not from current user
    // and conversation is not currently active
    const shouldIncrementUnread =
      state.activeConversationId !== convId &&
      message.sender_id !== currentUserId;

    set({
      messages: {
        ...state.messages,
        [convId]: [...existing, message],
      },
      unreadCount: shouldIncrementUnread ? state.unreadCount + 1 : state.unreadCount,
    });

    // Trigger notification callback if message is from another user
    // and chat is closed or different conversation is active
    if (
      message.sender_id !== currentUserId &&
      (!state.isOpen || state.activeConversationId !== convId) &&
      state.onNewMessageNotification
    ) {
      state.onNewMessageNotification(message, conversation);
    }
  },

  onNewMessageNotification: undefined,

  setNotificationCallback: (callback) => {
    set({ onNewMessageNotification: callback });
  },

  subscribeToConversation: (conversationId: string) => {
    const state = get();
    const userId = state.conversations.find(c => c.id === conversationId)?.participant_1 || 
                   state.conversations.find(c => c.id === conversationId)?.participant_2;
    
    return DMChatService.subscribeToMessages(conversationId, (message) => {
      // Try to get current user ID from auth store
      // For now, pass undefined and let addMessage handle it
      get().addMessage(message);
    });
  },

  subscribeToUnreadCount: (userId: string) => {
    // Subscribe to all new messages for conversations involving this user
    return DMChatService.subscribeToUserMessages(userId, (message) => {
      // Add message (will handle notification if needed)
      get().addMessage(message, userId);
    });
  },

  decrementUnreadCount: (count: number) => {
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - count),
    }));
  },

  setMessageStatus: (messageId: string, status: 'sending' | 'sent' | 'failed') => {
    set((state) => ({
      messageStatus: {
        ...state.messageStatus,
        [messageId]: status,
      },
    }));
  },

  retryMessage: async (conversationId: string, senderId: string, content: string, tempId: string) => {
    // Remove failed status and retry sending
    set((state) => ({
      messageStatus: {
        ...state.messageStatus,
        [tempId]: 'sending',
      },
    }));

    const result = await DMChatService.sendMessage(conversationId, senderId, content);
    
    if (result.success && result.data) {
      // Remove temp message and add real one
      set((state) => {
        const messages = state.messages[conversationId] || [];
        const filtered = messages.filter((m) => m.id !== tempId);
        
        return {
          messages: {
            ...state.messages,
            [conversationId]: [...filtered, result.data!],
          },
          messageStatus: {
            ...state.messageStatus,
            [result.data!.id]: 'sent',
            [tempId]: undefined as any,
          },
        };
      });
    } else {
      // Mark as failed again
      set((state) => ({
        messageStatus: {
          ...state.messageStatus,
          [tempId]: 'failed',
        },
      }));
    }
  },
}));

// Legacy export for backwards compatibility
export const useChatStore = useDMChatStore;
