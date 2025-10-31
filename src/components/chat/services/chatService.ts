import { StreamChat } from 'stream-chat';
import { supabase } from '../../../services/supabase';
import type { User } from '@supabase/supabase-js';

// Environment variables with validation
const STREAM_CHAT_API_KEY = import.meta.env.VITE_STREAM_CHAT_API_KEY;

// Validate environment variables
function validateEnvironment() {
  const missing = [];
  
  if (!STREAM_CHAT_API_KEY || STREAM_CHAT_API_KEY === 'your_stream_chat_api_key_here') {
    missing.push('VITE_STREAM_CHAT_API_KEY');
  }
  
  if (missing.length > 0) {
    console.warn(
      '⚠️ ChatService: Missing environment variables:',
      missing.join(', '),
      '\n📝 Please add your Stream Chat API key to .env'
    );
  }
}

// Validate on load
validateEnvironment();

// Stream Chat configuration - use existing Supabase client
export const streamChatClient = StreamChat.getInstance(
  STREAM_CHAT_API_KEY || 'demo-api-key'
);

export class ChatService {
  private static instance: ChatService;
  
  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // Connect user to Stream Chat using existing auth session
  async connectUserToChat(user: User, profile: any) {
    try {
      console.log('🚀 ChatService: Connecting user to Stream Chat:', user.email);
      
      // Generate Stream Chat token
      const streamToken = await this.generateStreamToken(user.id);

      // Connect to Stream Chat using existing user data
      await streamChatClient.connectUser(
        {
          id: user.id,
          name: profile?.display_name || profile?.first_name || user.email || 'User',
          image: profile?.avatar_url,
        },
        streamToken
      );

      console.log('✅ ChatService: Successfully connected to Stream Chat');
      return true;
    } catch (error) {
      console.error('❌ ChatService: Connection error:', error);
      throw error;
    }
  }

  // Disconnect user from Stream Chat
  async disconnectUser() {
    try {
      console.log('🔌 ChatService: Disconnecting from Stream Chat');
      await streamChatClient.disconnectUser();
      console.log('✅ ChatService: Disconnected from Stream Chat');
    } catch (error) {
      console.error('❌ ChatService: Disconnect error:', error);
      throw error;
    }
  }

  // Generate Stream Chat token (placeholder - needs backend implementation)
  private async generateStreamToken(userId: string): Promise<string> {
    try {
      // TODO: Implement proper token generation via backend
      // For now, return a development token (this won't work in production)
      
      // In production, you would call your backend API:
      // const response = await fetch('/api/stream-token', {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${accessToken}` },
      //   body: JSON.stringify({ userId })
      // });
      // return response.json().token;
      
      console.warn('⚠️ ChatService: Using development mode token generation');
      console.warn('📝 TODO: Implement proper backend token generation for production');
      
      // Development fallback - this is not secure for production
      return streamChatClient.devToken(userId);
    } catch (error) {
      console.error('❌ ChatService: Token generation error:', error);
      throw new Error('Failed to generate Stream Chat token');
    }
  }

  // Channel management
  async createDirectMessage(targetUserId: string) {
    try {
      const currentUser = streamChatClient.user;
      if (!currentUser) throw new Error('User not authenticated with Stream Chat');

      console.log('💬 ChatService: Creating direct message channel');
      const channel = streamChatClient.channel('messaging', undefined, {
        members: [currentUser.id, targetUserId],
      });

      await channel.create();
      console.log('✅ ChatService: Direct message channel created');
      return channel;
    } catch (error) {
      console.error('❌ ChatService: Error creating direct message:', error);
      throw error;
    }
  }

  async createGroupChat(name: string, memberIds: string[]) {
    try {
      const currentUser = streamChatClient.user;
      if (!currentUser) throw new Error('User not authenticated with Stream Chat');

      console.log('👥 ChatService: Creating group chat:', name);
      // Generate unique channel ID for group chat
      const channelId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const channel = streamChatClient.channel('messaging', channelId, {
        members: [currentUser.id, ...memberIds],
      });

      // Create channel - name will be handled at UI level
      await channel.create();
      console.log('✅ ChatService: Group chat created with ID:', channelId);
      return channel;
    } catch (error) {
      console.error('❌ ChatService: Error creating group chat:', error);
      throw error;
    }
  }

  async getChannels() {
    try {
      const currentUser = streamChatClient.user;
      if (!currentUser) throw new Error('User not authenticated with Stream Chat');

      console.log('📋 ChatService: Fetching user channels');
      const filter = { members: { $in: [currentUser.id] } };
      const sort = [{ last_message_at: -1 }];
      const channels = await streamChatClient.queryChannels(filter, sort, { limit: 20 });
      
      console.log('✅ ChatService: Fetched channels:', channels.length);
      return channels;
    } catch (error) {
      console.error('❌ ChatService: Error fetching channels:', error);
      throw error;
    }
  }

  // Get user profile from main app's users table
  async getUserProfile(userId: string) {
    try {
      console.log('👤 ChatService: Fetching user profile:', userId);
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      console.log('✅ ChatService: User profile fetched');
      return profile;
    } catch (error) {
      console.error('❌ ChatService: Error fetching user profile:', error);
      throw error;
    }
  }

  // Check if user is connected to Stream Chat
  isConnected(): boolean {
    return !!streamChatClient.user;
  }

  // Get current Stream Chat user
  getCurrentUser() {
    return streamChatClient.user;
  }
}