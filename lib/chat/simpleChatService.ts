import { supabaseBrowser } from '@/lib/supabase/client';
import type { Friend } from '@/components/chat/simple/components/FriendsList';
import type { Message } from '@/components/chat/simple/components/ChatInterface';

export interface ChatUser {
  id: string;
  display_name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  is_master_bot: boolean;
  last_seen_at?: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  room_id: string;
  content: string;
  is_ai_generated: boolean;
  created_at: string;
  users?: {
    display_name: string;
    avatar_url?: string;
  };
}

export class SimpleChatService {
  /**
   * Load all available chat contacts for a user
   * This includes Master Bots and friends
   */
  static async loadContacts(userId: string): Promise<Friend[]> {
    const supabase = supabaseBrowser();
    const allFriends: Friend[] = [];

    try {
      // Load Master Bots (always available to chat with)
      const { data: masterBots, error: botsError } = await supabase
        .from('users')
        .select('id, display_name, username, avatar_url, bio, is_master_bot')
        .eq('is_master_bot', true)
        .eq('is_active', true);

      if (botsError) {
        console.error('Error loading Master Bots:', botsError);
      } else if (masterBots) {
        masterBots.forEach((bot: ChatUser) => {
          allFriends.push({
            id: bot.id,
            name: bot.display_name,
            avatar: bot.avatar_url,
            lastMessage: `Chat with ${bot.display_name}`,
            isMasterBot: true,
            timestamp: 'Master Bot',
            online: true
          });
        });
      }

      // Load friends from friend requests table
      const { data: friendships, error: friendsError } = await supabase
        .from('friend_requests')
        .select(`
          id,
          requester_id,
          requested_id,
          status,
          requester:requester_id(
            id,
            display_name,
            username,
            avatar_url,
            last_seen_at
          ),
          requested:requested_id(
            id,
            display_name,
            username,
            avatar_url,
            last_seen_at
          )
        `)
        .or(`requester_id.eq.${userId},requested_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (friendsError) {
        console.error('Error loading friends:', friendsError);
      } else if (friendships) {
        friendships.forEach((friendship: any) => {
          // Get the friend (the other user in the relationship)
          const friend = friendship.requester_id === userId 
            ? friendship.requested 
            : friendship.requester;
          
          if (friend) {
            const lastSeen = friend.last_seen_at ? new Date(friend.last_seen_at) : new Date();
            const isOnline = new Date().getTime() - lastSeen.getTime() < 5 * 60 * 1000; // 5 minutes

            allFriends.push({
              id: friend.id,
              name: friend.display_name,
              avatar: friend.avatar_url,
              lastMessage: 'Say hello!',
              isMasterBot: false,
              timestamp: isOnline ? 'Online' : 'Offline',
              online: isOnline
            });
          }
        });
      }

      return allFriends;
    } catch (error) {
      console.error('Error loading contacts:', error);
      throw new Error('Failed to load contacts');
    }
  }

  /**
   * Load messages for a specific chat room
   */
  static async loadMessages(roomId: string, limit: number = 50): Promise<Message[]> {
    const supabase = supabaseBrowser();

    try {
      const { data: chatMessages, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          user_id,
          content,
          created_at,
          is_ai_generated,
          users!chat_messages_user_id_fkey(display_name, avatar_url)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error loading messages:', error);
        throw new Error('Failed to load messages');
      }

      return (chatMessages || []).map((msg: any) => ({
        id: msg.id,
        senderId: msg.user_id,
        text: msg.content,
        timestamp: new Date(msg.created_at)
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
      throw new Error('Failed to load messages');
    }
  }

  /**
   * Send a message to a chat room
   */
  static async sendMessage(
    userId: string,
    roomId: string,
    content: string,
    isAiGenerated: boolean = false
  ): Promise<ChatMessage> {
    const supabase = supabaseBrowser();

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          room_id: roomId,
          content,
          is_ai_generated: isAiGenerated
        })
        .select(`
          id,
          user_id,
          room_id,
          content,
          is_ai_generated,
          created_at,
          users!chat_messages_user_id_fkey(display_name, avatar_url)
        `)
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw new Error('Failed to send message');
      }

      return data as ChatMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Create a consistent room ID for two users
   */
  static createRoomId(userId1: string, userId2: string, isMasterBot: boolean = false): string {
    if (isMasterBot) {
      return `ai_${userId1}_${userId2}`;
    }
    
    // For regular chats, sort IDs for consistency
    return userId1 < userId2 ? `private_${userId1}_${userId2}` : `private_${userId2}_${userId1}`;
  }

  /**
   * Get Master Bot response using OpenAI API
   * This is a simplified version - can be expanded with actual bot personalities
   */
  static async getMasterBotResponse(userMessage: string, botId: string): Promise<string> {
    // For now, return a simple response
    // In the future, this can integrate with OpenAI API and bot personalities
    const responses = [
      "That's interesting! Tell me more about your food preferences.",
      "I'd recommend trying a Mediterranean diet for better health.",
      "Have you considered exploring Asian cuisine? It's full of amazing flavors!",
      "Food is such a wonderful way to explore different cultures.",
      "What's your favorite type of cuisine? I love helping people discover new dishes!",
      "Cooking is an art form! What type of recipes are you interested in?",
      "Nutrition is so important. Are you looking for healthy meal ideas?",
      "I love sharing food knowledge! What would you like to learn about?"
    ];
    
    // Simple random response - replace with actual AI API call
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Trigger an AI response from a Master Bot
   */
  static async triggerMasterBotResponse(
    botId: string,
    roomId: string,
    userMessage: string,
    delay: number = 1000
  ): Promise<ChatMessage | null> {
    try {
      // Add a realistic delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const aiResponse = await this.getMasterBotResponse(userMessage, botId);
      
      return await this.sendMessage(botId, roomId, aiResponse, true);
    } catch (error) {
      console.error('Error triggering Master Bot response:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time message updates for a room
   */
  static subscribeToMessages(
    roomId: string,
    callback: (message: ChatMessage) => void
  ) {
    const supabase = supabaseBrowser();
    
    const subscription = supabase
      .channel(`chat_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload: any) => {
          callback(payload.new as ChatMessage);
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Check if a user is a Master Bot
   */
  static async isMasterBot(userId: string): Promise<boolean> {
    const supabase = supabaseBrowser();
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_master_bot')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return false;
      }

      return data.is_master_bot === true;
    } catch (error) {
      console.error('Error checking if user is Master Bot:', error);
      return false;
    }
  }
}