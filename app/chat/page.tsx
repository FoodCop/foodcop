'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { FriendsList, Friend } from '@/components/chat/simple/components/FriendsList';
import { ChatInterface, Message } from '@/components/chat/simple/components/ChatInterface';
import { supabaseBrowser } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function ChatPage() {
  const { user } = useAuth();
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedFriend = friends.find((f) => f.id === selectedFriendId);

  // Load friends and Master Bots
  const loadFriends = useCallback(async () => {
    if (!user) return;

    try {
      const supabase = supabaseBrowser();
      
      // Use the exact same query pattern as the working Friends component
      const { data: friendRequests, error: friendsError } = await supabase
        .from('friend_requests')
        .select(`
          *,
          requester:requester_id(id, display_name, username, avatar_url),
          requested:requested_id(id, display_name, username, avatar_url)
        `)
        .or(`requester_id.eq.${user.id},requested_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (friendsError) {
        console.error('Error loading friends:', friendsError);
        setError('Failed to load friends');
        return;
      }

      // Also load Master Bots
      const { data: masterBots, error: botsError } = await supabase
        .from('users')
        .select('id, display_name, username, avatar_url')
        .eq('is_master_bot', true)
        .eq('is_active', true);

      // Convert friend requests to chat friends list
      const allFriends: Friend[] = [];

      // Add real friends from friend_requests
      if (friendRequests && friendRequests.length > 0) {
        friendRequests.forEach((friendship: any) => {
          // Get the friend (the other user in the relationship)
          const friend = friendship.requester_id === user.id 
            ? friendship.requested 
            : friendship.requester;
          
          if (friend) {
            allFriends.push({
              id: friend.id,
              name: friend.display_name,
              avatar: friend.avatar_url || undefined,
              lastMessage: 'Say hello!',
              timestamp: 'Friend',
              online: true,
              isMasterBot: false
            });
          }
        });
      }

      // Add Master Bots to the list
      if (masterBots && masterBots.length > 0) {
        masterBots.forEach((bot: any) => {
          allFriends.push({
            id: bot.id,
            name: bot.display_name,
            avatar: bot.avatar_url || undefined,
            lastMessage: `Chat with ${bot.display_name}`,
            timestamp: 'AI Bot',
            online: true,
            isMasterBot: true
          });
        });
      }
      setFriends(allFriends);
    } catch (error) {
      console.error('Error loading friends:', error);
      setError('Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load messages for a specific chat room
  const loadMessages = async (friendId: string) => {
    if (!user || messages[friendId]) return; // Don't reload if already cached

    try {
      const supabase = supabaseBrowser();
      
      // Create room ID (consistent format for both users and bots)
      const roomId = createRoomId(user.id, friendId);
      
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
        .limit(50);

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const formattedMessages: Message[] = (chatMessages || []).map((msg: any) => ({
        id: msg.id,
        senderId: msg.user_id,
        text: msg.content,
        timestamp: new Date(msg.created_at)
      }));

      setMessages(prev => ({
        ...prev,
        [friendId]: formattedMessages
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Send a message
  const handleSendMessage = async (text: string, files?: File[]) => {
    if (!selectedFriendId || !user || !text.trim()) return;

    try {
      const supabase = supabaseBrowser();
      const roomId = createRoomId(user.id, selectedFriendId);

      // Create optimistic message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        senderId: user.id,
        text,
        timestamp: new Date()
      };

      // Update UI immediately
      setMessages(prev => ({
        ...prev,
        [selectedFriendId]: [...(prev[selectedFriendId] || []), optimisticMessage]
      }));

      // Send to database
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          room_id: roomId,
          content: text,
          is_ai_generated: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        
        // Remove optimistic message on error
        setMessages(prev => ({
          ...prev,
          [selectedFriendId]: prev[selectedFriendId]?.filter(m => m.id !== optimisticMessage.id) || []
        }));
        return;
      }

      // Replace optimistic message with real one
      const realMessage: Message = {
        id: data.id,
        senderId: data.user_id,
        text: data.content,
        timestamp: new Date(data.created_at)
      };

      setMessages(prev => ({
        ...prev,
        [selectedFriendId]: prev[selectedFriendId]?.map(m => 
          m.id === optimisticMessage.id ? realMessage : m
        ) || []
      }));

      // If messaging a Master Bot, trigger AI response
      const friend = friends.find(f => f.id === selectedFriendId);
      if (friend?.timestamp === 'Master Bot') {
        triggerMasterBotResponse(selectedFriendId, roomId, text);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Trigger Master Bot AI response
  const triggerMasterBotResponse = async (botId: string, roomId: string, userMessage: string) => {
    try {
      // Simple AI response simulation - replace with real AI API call
      setTimeout(async () => {
        const responses = [
          "That's interesting! Tell me more about your food preferences.",
          "I'd recommend trying a Mediterranean diet for better health.",
          "Have you considered exploring Asian cuisine? It's full of amazing flavors!",
          "Food is such a wonderful way to explore different cultures.",
          "What's your favorite type of cuisine? I love helping people discover new dishes!"
        ];
        
        const aiResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const supabase = supabaseBrowser();
        const { data } = await supabase
          .from('chat_messages')
          .insert({
            user_id: botId,
            room_id: roomId,
            content: aiResponse,
            is_ai_generated: true
          })
          .select()
          .single();

        if (data) {
          const aiMessage: Message = {
            id: data.id,
            senderId: data.user_id,
            text: data.content,
            timestamp: new Date(data.created_at)
          };

          setMessages(prev => ({
            ...prev,
            [botId]: [...(prev[botId] || []), aiMessage]
          }));
        }
      }, 1000); // 1 second delay for realistic AI response
    } catch (error) {
      console.error('Error triggering AI response:', error);
    }
  };

  // Create consistent room ID
  const createRoomId = (userId1: string, userId2: string): string => {
    // For Master Bot chats, use ai_ prefix
    const friend = friends.find(f => f.id === userId2);
    if (friend?.timestamp === 'Master Bot') {
      return `ai_${userId1}_${userId2}`;
    }
    
    // For regular chats, sort IDs for consistency
    return userId1 < userId2 ? `private_${userId1}_${userId2}` : `private_${userId2}_${userId1}`;
  };

  // Event handlers
  const handleSelectFriend = (friendId: string) => {
    setSelectedFriendId(friendId);
    setShowChat(true);
    loadMessages(friendId);
  };

  const handleBackToFriends = () => {
    setShowChat(false);
  };

  // Load friends on mount
  useEffect(() => {
    if (user?.id) {
      loadFriends();
    } else {
      setLoading(false);
    }
  }, [user, loadFriends]);

  // Show loading state
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
          <p className="text-gray-500">Please sign in to access chat features</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
          <p className="text-gray-500">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              loadFriends();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Friends List - Hidden on mobile when chat is open, always visible on desktop */}
      <div className={`w-full md:w-80 ${showChat ? 'hidden md:block' : 'block'}`}>
        <FriendsList
          friends={friends}
          selectedFriendId={selectedFriendId || undefined}
          onSelectFriend={handleSelectFriend}
        />
      </div>
      
      {/* Chat Interface - Hidden on mobile when friends list is open, always visible on desktop */}
      <div className={`w-full md:flex-1 ${showChat ? 'block' : 'hidden md:block'}`}>
        {selectedFriend ? (
          <ChatInterface
            friend={selectedFriend}
            messages={messages[selectedFriendId!] || []}
            currentUserId={user.id}
            onSendMessage={handleSendMessage}
            onBack={handleBackToFriends}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-xl font-semibold mb-2">Welcome to FUZO Chat</h2>
              <p>Select a friend or Master Bot to start chatting</p>
              <p className="text-sm mt-2">
                Chat with AI food experts or connect with friends!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}