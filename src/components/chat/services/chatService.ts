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
  async connectUserToChat(user: User, profile: Record<string, unknown>) {
    try {
      console.log('🚀 ChatService: Connecting user to Stream Chat:', user.email);
      
      // Generate Stream Chat token
      const streamToken = await this.generateStreamToken(user.id);

      // Connect to Stream Chat using existing user data
      await streamChatClient.connectUser(
        {
          id: user.id,
          name: (profile?.display_name || profile?.first_name || user.email || 'User') as string,
          image: profile?.avatar_url as string | undefined,
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

  // Generate Stream Chat token via backend (secure for production)
  private async generateStreamToken(userId: string): Promise<string> {
    try {
      // Check if we're in production mode (env variable)
      const useProductionAuth = import.meta.env.VITE_USE_PRODUCTION_CHAT_AUTH === 'true';
      
      if (!useProductionAuth) {
        // Development mode - use dev tokens (NOT FOR PRODUCTION)
        console.warn('⚠️ ChatService: Using development mode token generation');
        console.warn('📝 Set VITE_USE_PRODUCTION_CHAT_AUTH=true in .env for production');
        return streamChatClient.devToken(userId);
      }

      // Production mode - generate token via Supabase Edge Function
      console.log('🔐 ChatService: Generating production token via backend');
      
      const { data, error } = await supabase.functions.invoke('generate-stream-token', {
        body: { userId }
      });
      
      if (error) {
        console.error('❌ Token generation failed:', error);
        throw error;
      }
      
      if (!data || !data.token) {
        throw new Error('No token returned from backend');
      }
      
      console.log('✅ ChatService: Production token generated successfully');
      return data.token;
      
    } catch (error) {
      console.error('❌ ChatService: Token generation error:', error);
      
      // Fallback to dev token in development only
      if (import.meta.env.DEV) {
        console.warn('🔄 Falling back to development token');
        return streamChatClient.devToken(userId);
      }
      
      throw new Error('Failed to generate Stream Chat token');
    }
  }

  // Channel management
  async createDirectMessage(targetUserId: string) {
    try {
      const currentUser = streamChatClient.user;
      if (!currentUser) throw new Error('User not authenticated with Stream Chat');

      console.log('💬 ChatService: Creating/getting direct message channel with:', targetUserId);
      
      // Check if a DM channel already exists
      const existingChannels = await streamChatClient.queryChannels({
        type: 'messaging',
        members: { $eq: [currentUser.id, targetUserId] }
      });

      if (existingChannels.length > 0) {
        console.log('✅ ChatService: Found existing DM channel');
        return existingChannels[0];
      }

      // Create new DM channel if none exists
      const channel = streamChatClient.channel('messaging', undefined, {
        members: [currentUser.id, targetUserId],
      });

      await channel.create();
      console.log('✅ ChatService: New direct message channel created');
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