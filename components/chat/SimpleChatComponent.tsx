'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseBrowser } from '@/lib/supabase/client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send } from 'lucide-react';
import { FoodShareDialog, SharedContentPreview } from './FoodShareDialog';

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  is_ai_generated: boolean;
  created_at: string;
  shared_content?: any; // For restaurant/recipe shares
  user?: {
    id: string;
    email: string;
    display_name: string;
    avatar_url: string;
    username: string;
  };
}

interface SimpleChatComponentProps {
  friendId?: string;
  roomId?: string;
}

export function SimpleChatComponent({ friendId, roomId }: SimpleChatComponentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    const loadMessages = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (friendId) params.set('friendId', friendId);
        if (roomId) params.set('roomId', roomId);
        params.set('limit', '50');

        const response = await fetch(`/api/chat/messages?${params.toString()}`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'Failed to load messages');
          return;
        }

        setMessages(data.messages || []);
        
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    // Setup realtime subscription
    const supabase = supabaseBrowser();
    
    // Determine the room ID for subscription
    let subscriptionRoomId = roomId;
    if (friendId && !roomId) {
      // Create consistent room ID for private chat (smaller ID first)
      subscriptionRoomId = `private_${[user.id, friendId].sort().join('_')}`;
    }
    if (!subscriptionRoomId) {
      subscriptionRoomId = 'general';
    }

    const subscription = supabase
      .channel(`chat_${subscriptionRoomId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `room_id=eq.${subscriptionRoomId}`
        },
        async (payload: any) => {
          try {
            const rawMessage = payload.new;
            
            // Fetch the user data for the message
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('id, display_name, username, email, avatar_url')
              .eq('id', rawMessage.user_id)
              .single();

            if (userError) {
              console.error('Error fetching user data for realtime message:', userError);
              return;
            }

            const message: ChatMessage = {
              ...rawMessage,
              user: userData
            };
            
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === message.id)) return prev;
              return [...prev, message];
            });
          } catch (error) {
            console.error('Error processing realtime message:', error);
          }
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [friendId, roomId, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || isSending) return;
    
    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    setIsSending(true);
    
    try {
      const payload: any = {
        content: messageContent
      };
      
      if (friendId) payload.friendId = friendId;
      if (roomId) payload.roomId = roomId;

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to send message');
        setNewMessage(messageContent); // Restore message on error
        return;
      }

      setError(null);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const handleFoodShare = async (shareData: any, message?: string) => {
    setIsSharing(true);
    
    try {
      const payload: any = {
        shareData,
        message
      };
      
      if (friendId) payload.friendId = friendId;
      if (roomId) payload.roomId = roomId;

      const response = await fetch('/api/chat/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to share content');
        return;
      }

      setError(null);
      
    } catch (err) {
      console.error('Error sharing content:', err);
      setError('Failed to share content');
    } finally {
      setIsSharing(false);
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 border rounded-lg">
        <p className="text-gray-500">Loading chat messages...</p>
      </div>
    );
  }

  return (
    <Card className="w-full h-[600px] flex flex-col">
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
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
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
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 break-words">{msg.content}</p>
                
                {/* Shared Content */}
                {msg.shared_content && (
                  <div className="mt-2">
                    <SharedContentPreview content={msg.shared_content} />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input Area */}
      <div className="border-t p-4 bg-gray-50">
        <div className="flex gap-2 mb-2">
          <FoodShareDialog 
            onShare={handleFoodShare} 
            isSharing={isSharing}
          />
        </div>
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={!user || isSending}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !user || isSending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {!user && (
          <p className="text-sm text-gray-500 mt-2">Please log in to participate in the chat</p>
        )}
        {isSending && (
          <p className="text-xs text-gray-500 mt-1">Sending message...</p>
        )}
      </div>
    </Card>
  );
}