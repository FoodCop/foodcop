'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { ChatContact, Message, UserStory } from '../utils/ChatTypes';

/**
 * Chat service that uses the global auth provider
 * Replaces the redundant ChatAuthProvider
 */
export function useChatService() {
  const { user: authUser, loading: authLoading } = useAuth();
  const supabase = supabaseBrowser();

  // Convert AuthUser to ChatContact format when needed
  const currentUserAsContact = authUser ? {
    id: authUser.id,
    display_name: authUser.name || authUser.email || 'User',
    username: authUser.email?.split('@')[0] || 'user',
    avatar_url: authUser.avatar_url || '',
    email: authUser.email || '',
    is_online: true,
    last_seen: new Date().toISOString(),
    is_master_bot: false,
    friends_count: 0,
  } : null;

  // Load contacts/friends
  const loadContacts = async (): Promise<ChatContact[]> => {
    if (!authUser) return [];

    try {
      const response = await fetch('/api/chat/friends');
      if (!response.ok) throw new Error('Failed to load contacts');
      return await response.json();
    } catch (error) {
      console.error('Error loading contacts:', error);
      return [];
    }
  };

  // Load messages for a room
  const loadMessages = async (roomId: string): Promise<Message[]> => {
    if (!authUser) return [];

    try {
      const response = await fetch(`/api/chat/messages?roomId=${roomId}&limit=50`);
      if (!response.ok) throw new Error('Failed to load messages');
      return await response.json();
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  };

  // Send a message
  const sendMessage = async (
    content: string, 
    roomId: string, 
    type: 'text' | 'image' | 'voice' | 'video' | 'file' | 'restaurant' | 'recipe' = 'text'
  ): Promise<Message | null> => {
    if (!authUser || !content.trim()) return null;

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          room_id: roomId,
          message_type: type,
          sender_id: authUser.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  };

  // Load user stories
  const loadStories = async (): Promise<UserStory[]> => {
    // TODO: Implement when stories are ready
    return [];
  };

  // Share restaurant
  const shareRestaurant = async (roomId: string, restaurantData: any, message?: string): Promise<Message | null> => {
    if (!authUser) return null;

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message || `Check out this restaurant!`,
          room_id: roomId,
          message_type: 'restaurant',
          sender_id: authUser.id,
          metadata: { restaurant: restaurantData },
        }),
      });

      if (!response.ok) throw new Error('Failed to share restaurant');
      return await response.json();
    } catch (error) {
      console.error('Error sharing restaurant:', error);
      return null;
    }
  };

  // Share recipe
  const shareRecipe = async (roomId: string, recipeData: any, message?: string): Promise<Message | null> => {
    if (!authUser) return null;

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message || `Check out this recipe!`,
          room_id: roomId,
          message_type: 'recipe',
          sender_id: authUser.id,
          metadata: { recipe: recipeData },
        }),
      });

      if (!response.ok) throw new Error('Failed to share recipe');
      return await response.json();
    } catch (error) {
      console.error('Error sharing recipe:', error);
      return null;
    }
  };

  // Real-time subscriptions
  const subscribeToMessages = (roomId: string, onMessage: (message: Message) => void) => {
    const channel = supabase.channel(`messages-${roomId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload: any) => onMessage(payload.new as Message)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToUserStatus = (userId: string, onStatusChange: (isOnline: boolean) => void) => {
    // TODO: Implement user status tracking
    return () => {};
  };

  return {
    user: currentUserAsContact,
    isLoading: authLoading,
    error: null,
    loadContacts,
    loadMessages,
    sendMessage,
    loadStories,
    shareRestaurant,
    shareRecipe,
    subscribeToMessages,
    subscribeToUserStatus,
  };
}