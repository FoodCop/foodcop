import { create } from 'zustand';
import {
  DMConversation,
  DMMessage,
  SharedItem,
  DMChatService,
} from '../services/dmChatService';

interface DMChatStore {
  // UI State
  isOpen: boolean;
  activeConversationId: string | null;

  // Data
  conversations: DMConversation[];
  messages: Record<string, DMMessage[]>; // keyed by conversation_id
  unreadCount: number;

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
  addMessage: (message: DMMessage) => void;
  subscribeToConversation: (conversationId: string) => () => void;
}

export const useDMChatStore = create<DMChatStore>((set, get) => ({
  // Initial state
  isOpen: false,
  activeConversationId: null,
  conversations: [],
  messages: {},
  unreadCount: 0,
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
    set({ isSending: true });
    const result = await DMChatService.sendMessage(
      conversationId,
      senderId,
      content
    );
    set({ isSending: false });

    if (result.success && result.data) {
      // Optimistically add message
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
    const result = await DMChatService.getOrCreateConversation(
      userId,
      otherUserId
    );
    if (result.success && result.data) {
      // Refresh conversations list
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
  addMessage: (message: DMMessage) => {
    set((state) => {
      const convId = message.conversation_id;
      const existing = state.messages[convId] || [];
      // Avoid duplicates
      if (existing.some((m) => m.id === message.id)) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [convId]: [...existing, message],
        },
      };
    });
  },

  subscribeToConversation: (conversationId: string) => {
    return DMChatService.subscribeToMessages(conversationId, (message) => {
      get().addMessage(message);
    });
  },
}));

// Legacy export for backwards compatibility
export const useChatStore = useDMChatStore;
