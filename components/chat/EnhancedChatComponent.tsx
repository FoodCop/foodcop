'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseBrowser } from '@/lib/supabase/client';
import Image from 'next/image';

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  is_ai_generated: boolean;
  created_at: string;
  room_id: string;
  user?: {
    id: string;
    email: string;
    display_name: string;
    avatar_url: string;
    username: string;
  };
}

interface Friend {
  id: string;
  display_name: string;
  username: string;
  email: string;
  avatar_url: string;
  last_seen: string;
  is_online: boolean;
  friendship_id: string;
  friendship_date: string;
}

export function EnhancedChatComponent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string>('general');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFriendsList, setShowFriendsList] = useState(true);
  const { user } = useAuth();

  // Load friends list
  useEffect(() => {
    const loadFriends = async () => {
      if (!user) return;
      
      try {
        setFriendsLoading(true);
        const response = await fetch('/api/chat/friends');
        const data = await response.json();
        
        if (data.success) {
          setFriends(data.friends || []);
        } else {
          console.error('Error loading friends:', data.error);
        }
      } catch (error) {
        console.error('Error loading friends:', error);
      } finally {
        setFriendsLoading(false);
      }
    };

    loadFriends();
  }, [user]);

  // Load messages for current room
  useEffect(() => {
    if (!user) return;
    
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        
        const url = new URL('/api/chat/messages', window.location.origin);
        if (selectedFriend) {
          url.searchParams.set('friendId', selectedFriend.id);
        } else {
          url.searchParams.set('roomId', currentRoomId);
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          setMessages(data.messages || []);
          setCurrentRoomId(data.roomId);
        } else {
          setError(data.error || 'Failed to load messages');
        }
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    const setupRealtimeSubscription = () => {
      const supabase = supabaseBrowser();
      
      // Unsubscribe from previous subscription
      supabase.removeAllChannels();
      
      // Subscribe to new messages in current room
      const subscription = supabase
        .channel(`chat_messages_${currentRoomId}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'chat_messages',
            filter: `room_id=eq.${currentRoomId}`
          },
          async (payload: any) => {
            const newMessage = payload.new as ChatMessage;
            
            // Fetch the complete message with user data
            const { data: messageWithUser } = await supabase
              .from('chat_messages')
              .select(`
                *,
                user:users(id, email, display_name, avatar_url, username)
              `)
              .eq('id', newMessage.id)
              .single();
            
            if (messageWithUser) {
              setMessages(prev => [...prev, messageWithUser]);
            }
          }
        )
        .subscribe();

      return () => subscription.unsubscribe();
    };
    
    loadMessages();
    const cleanup = setupRealtimeSubscription();
    
    return cleanup;
  }, [user, currentRoomId, selectedFriend]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    
    try {
      const body = {
        content: newMessage.trim(),
        roomId: selectedFriend ? undefined : currentRoomId,
        friendId: selectedFriend?.id
      };
      
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNewMessage('');
        setError(null);
        // Message will be added via realtime subscription
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const selectFriend = (friend: Friend) => {
    setSelectedFriend(friend);
    setCurrentRoomId(`private_${[user?.id, friend.id].sort().join('_')}`);
    setShowFriendsList(false);
  };

  const goToGeneralChat = () => {
    setSelectedFriend(null);
    setCurrentRoomId('general');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getDisplayName = (msg: ChatMessage) => {
    return msg.user?.display_name || 
           msg.user?.email || 
           'Unknown User';
  };

  const getAvatarUrl = (msg: ChatMessage) => {
    return msg.user?.avatar_url;
  };

  const getInitial = (msg: ChatMessage) => {
    const name = getDisplayName(msg);
    return name[0]?.toUpperCase() || '?';
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getChatTitle = () => {
    if (selectedFriend) {
      return `💬 ${selectedFriend.display_name}`;
    }
    return '🌍 General Chat';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96 border rounded-lg">
        <p className="text-gray-500">Please log in to access chat</p>
      </div>
    );
  }

  return (
    <div className="flex h-96 border rounded-lg bg-white shadow-sm overflow-hidden">
      {/* Friends Sidebar */}
      <div className={`${showFriendsList ? 'block' : 'hidden'} md:block w-64 border-r bg-gray-50 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b bg-white">
          <h3 className="font-semibold text-gray-900">Chat</h3>
        </div>
        
        {/* General Chat Button */}
        <div className="p-2">
          <button
            onClick={goToGeneralChat}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              !selectedFriend 
                ? 'bg-blue-100 text-blue-900' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                🌍
              </div>
              <div>
                <p className="font-medium">General Chat</p>
                <p className="text-xs text-gray-500">Open to everyone</p>
              </div>
            </div>
          </button>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="mb-2">
            <p className="text-xs font-medium text-gray-500 px-3 py-1">
              FRIENDS ({friends.length})
            </p>
          </div>
          
          {friendsLoading ? (
            <div className="p-3 text-center text-gray-500">
              Loading friends...
            </div>
          ) : friends.length === 0 ? (
            <div className="p-3 text-center text-gray-500 text-sm">
              <p>No friends yet</p>
              <p className="mt-1">Add friends to start chatting!</p>
            </div>
          ) : (
            friends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => selectFriend(friend)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                  selectedFriend?.id === friend.id 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {friend.avatar_url ? (
                      <Image 
                        src={friend.avatar_url} 
                        alt={friend.display_name} 
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {friend.display_name[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    {friend.is_online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{friend.display_name}</p>
                    <p className="text-xs text-gray-500 truncate">@{friend.username}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b bg-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFriendsList(!showFriendsList)}
              className="md:hidden p-1 hover:bg-gray-100 rounded"
            >
              ☰
            </button>
            <h2 className="font-semibold text-gray-900">{getChatTitle()}</h2>
          </div>
          {selectedFriend && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className={`w-2 h-2 rounded-full ${selectedFriend.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span>{selectedFriend.is_online ? 'Online' : 'Offline'}</span>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-900 hover:text-red-600"
            >
              ×
            </button>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-center">
              <div>
                <p>No messages yet</p>
                <p className="text-sm mt-1">
                  {selectedFriend 
                    ? `Start a conversation with ${selectedFriend.display_name}!`
                    : 'Start the conversation in general chat!'
                  }
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex items-start space-x-3">
                {/* Avatar */}
                <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0">
                  {getAvatarUrl(msg) ? (
                    <Image 
                      src={getAvatarUrl(msg) || ''} 
                      alt="Avatar" 
                      width={32}
                      height={32}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      {getInitial(msg)}
                    </div>
                  )}
                </div>
                
                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {getDisplayName(msg)}
                    </span>
                    {msg.is_ai_generated && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                        AI
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 break-words">{msg.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedFriend ? `Message ${selectedFriend.display_name}...` : "Type a message..."}
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!user}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || !user}
              className="px-4 py-2 bg-[#329937] text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#2a7d2e] transition-colors focus:outline-none focus:ring-2 focus:ring-[#329937]"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}