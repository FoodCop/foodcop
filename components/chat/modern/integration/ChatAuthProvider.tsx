'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { ChatContact, ChatUser, Message, UserStory } from '../utils/ChatTypes';

interface ChatUserProfile {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
  email: string;
  is_online: boolean;
  last_seen: string;
  is_master_bot: boolean;
  friends_count: number;
  bio?: string;
}

interface ChatAuthContextType {
  user: ChatUserProfile | null;
  isLoading: boolean;
  error: string | null;
  // Real data services
  loadContacts: () => Promise<ChatContact[]>;
  loadMessages: (roomId: string) => Promise<Message[]>;
  sendMessage: (content: string, roomId: string, type?: 'text' | 'image' | 'voice' | 'video' | 'file') => Promise<Message | null>;
  loadStories: () => Promise<UserStory[]>;
  // Real-time subscriptions
  subscribeToMessages: (roomId: string, onMessage: (message: Message) => void) => () => void;
  subscribeToUserStatus: (userId: string, onStatusChange: (isOnline: boolean) => void) => () => void;
}

const ChatAuthContext = createContext<ChatAuthContextType | undefined>(undefined);

export function ChatAuthProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, loading: authLoading } = useAuth();
  const [chatUser, setChatUser] = useState<ChatUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = supabaseBrowser();

  // Load full user profile when auth user changes
  useEffect(() => {
    async function loadUserProfile() {
      if (!authUser) {
        setChatUser(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch full user profile from database
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('id, display_name, username, avatar_url, email, bio, friends_count')
          .eq('id', authUser.id)
          .single();

        if (profileError) {
          console.error('Error loading user profile:', profileError);
          // Fallback to auth user data if profile doesn't exist
          setChatUser({
            id: authUser.id,
            display_name: authUser.name || authUser.email || 'User',
            username: authUser.email?.split('@')[0] || 'user',
            avatar_url: authUser.avatar_url || '',
            email: authUser.email || '',
            is_online: true,
            last_seen: new Date().toISOString(),
            is_master_bot: false,
            friends_count: 0,
            bio: ''
          });
        } else {
          setChatUser({
            ...userProfile,
            is_online: true,
            last_seen: new Date().toISOString(),
            is_master_bot: false,
            friends_count: userProfile.friends_count || 0
          });
        }

        // Update user online status
        await supabase
          .from('users')
          .update({ 
            last_seen: new Date().toISOString(),
            is_online: true 
          })
          .eq('id', authUser.id);

      } catch (err) {
        console.error('Error in loadUserProfile:', err);
        setError('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    }

    loadUserProfile();
  }, [authUser, supabase]);

  // Load contacts (friends) from database
  const loadContacts = async (): Promise<ChatContact[]> => {
    if (!chatUser) return [];

    try {
      const response = await fetch('/api/chat/friends');
      if (!response.ok) {
        throw new Error('Failed to fetch friends');
      }

      const { friends } = await response.json();
      
      // Transform friends data to ChatContact format
      const contacts: ChatContact[] = friends.map((friend: any) => ({
        id: friend.id,
        name: friend.display_name || friend.username,
        username: friend.username,
        avatar_url: friend.avatar_url || '',
        last_message: {
          content: friend.last_message?.content || 'No messages yet',
          timestamp: friend.last_message?.timestamp || new Date().toISOString(),
          sender_id: friend.last_message?.sender_id || friend.id,
          type: friend.last_message?.type || 'text'
        },
        unread_count: friend.unread_count || 0,
        is_online: friend.is_online || false,
        last_seen: friend.last_seen || new Date().toISOString(),
        story_active: false,
        is_group: false
      }));

      return contacts;
    } catch (error) {
      console.error('Error loading contacts:', error);
      return [];
    }
  };

  // Load messages for a conversation
  const loadMessages = async (roomId: string): Promise<Message[]> => {
    if (!chatUser) return [];

    try {
      const response = await fetch(`/api/chat/messages?roomId=${roomId}&limit=50`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const { messages } = await response.json();
      
      // Transform messages to correct format
      return messages.map((msg: any) => ({
        id: msg.id,
        conversation_id: msg.room_id,
        sender_id: msg.user_id,
        sender_name: msg.user?.display_name || msg.user?.username || 'User',
        sender_avatar: msg.user?.avatar_url || '',
        content: msg.content,
        type: 'text' as const,
        timestamp: msg.created_at,
        status: 'delivered' as const,
        reactions: []
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  };

  // Send a new message
  const sendMessage = async (
    content: string, 
    roomId: string, 
    type: 'text' | 'image' | 'voice' | 'video' | 'file' = 'text'
  ): Promise<Message | null> => {
    if (!chatUser || !content.trim()) return null;

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          roomId,
          type
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const { message } = await response.json();
      
      return {
        id: message.id,
        conversation_id: message.room_id,
        sender_id: message.user_id,
        sender_name: chatUser.display_name,
        sender_avatar: chatUser.avatar_url,
        content: message.content,
        type: type,
        timestamp: message.created_at,
        status: 'sent',
        reactions: []
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  };

  // Load user stories (for now, return empty array as stories aren't implemented yet)
  const loadStories = async (): Promise<UserStory[]> => {
    // TODO: Implement stories when that feature is added
    return [];
  };

  // Subscribe to real-time messages
  const subscribeToMessages = (roomId: string, onMessage: (message: Message) => void) => {
    const channel = supabase
      .channel(`chat_${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`
      }, async (payload: any) => {
        // Fetch user details for the new message
        const { data: userData } = await supabase
          .from('users')
          .select('display_name, username, avatar_url')
          .eq('id', payload.new.user_id)
          .single();

        const message: Message = {
          id: payload.new.id,
          conversation_id: payload.new.room_id,
          sender_id: payload.new.user_id,
          sender_name: userData?.display_name || userData?.username || 'User',
          sender_avatar: userData?.avatar_url || '',
          content: payload.new.content,
          type: 'text',
          timestamp: payload.new.created_at,
          status: 'delivered',
          reactions: []
        };

        onMessage(message);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Subscribe to user online status changes
  const subscribeToUserStatus = (userId: string, onStatusChange: (isOnline: boolean) => void) => {
    const channel = supabase
      .channel(`user_status_${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      }, (payload: any) => {
        onStatusChange(payload.new.is_online || false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const value: ChatAuthContextType = {
    user: chatUser,
    isLoading: authLoading || isLoading,
    error,
    loadContacts,
    loadMessages,
    sendMessage,
    loadStories,
    subscribeToMessages,
    subscribeToUserStatus
  };

  return (
    <ChatAuthContext.Provider value={value}>
      {children}
    </ChatAuthContext.Provider>
  );
}

export function useChatAuth() {
  const context = useContext(ChatAuthContext);
  if (context === undefined) {
    throw new Error('useChatAuth must be used within a ChatAuthProvider');
  }
  return context;
}

export type { ChatUserProfile, ChatAuthContextType };