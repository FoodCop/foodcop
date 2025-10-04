'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseBrowser } from '@/lib/supabase/client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, Coffee, Leaf, Wine, Utensils, Mountain, Spade, Target } from 'lucide-react';

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  is_ai_generated: boolean;
  created_at: string;
  user?: {
    id: string;
    email: string;
    display_name: string;
    avatar_url: string;
    username: string;
  };
}

interface MasterbotInfo {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
}

interface MasterbotPersonality {
  name: string;
  description: string;
  specialties: string[];
  icon: any;
  color: string;
}

const MASTERBOT_PERSONALITIES = {
  adventure_rafa: {
    name: "Rafael Mendez",
    description: "Adventurous food explorer",
    specialties: ["extreme dining", "food adventures", "exotic cuisines"],
    icon: Mountain,
    color: "bg-orange-500"
  },
  coffee_pilgrim_omar: {
    name: "Omar Darzi",
    description: "Coffee connoisseur", 
    specialties: ["coffee", "brewing techniques", "café culture"],
    icon: Coffee,
    color: "bg-amber-600"
  },
  nomad_aurelia: {
    name: "Aurelia Voss",
    description: "Global cuisine explorer",
    specialties: ["street food", "local cuisines", "travel dining"],
    icon: Target,
    color: "bg-purple-500"
  },
  plant_pioneer_lila: {
    name: "Lila Cheng",
    description: "Plant-based food innovator",
    specialties: ["plant-based dining", "sustainable food"],
    icon: Leaf,
    color: "bg-green-500"
  },
  sommelier_seb: {
    name: "Sebastian LeClair",
    description: "Wine & fine dining expert",
    specialties: ["wine pairing", "fine dining", "gourmet experiences"],
    icon: Wine,
    color: "bg-red-500"
  },
  spice_scholar_anika: {
    name: "Anika Kapoor",
    description: "Spice & cultural cuisine expert",
    specialties: ["spices", "cultural cuisine", "traditional cooking"],
    icon: Spade,
    color: "bg-yellow-500"
  },
  zen_minimalist_jun: {
    name: "Jun Tanaka",
    description: "Minimalist dining advocate",
    specialties: ["minimalist dining", "quality ingredients", "mindful eating"],
    icon: Utensils,
    color: "bg-blue-500"
  }
};

interface AIChatComponentProps {
  masterbotUsername?: string;
  onBack?: () => void;
}

export function AIChatComponent({ masterbotUsername, onBack }: AIChatComponentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMasterbot, setSelectedMasterbot] = useState<string | null>(masterbotUsername || null);
  const [masterbotInfo, setMasterbotInfo] = useState<MasterbotInfo | null>(null);
  const [availableMasterbots, setAvailableMasterbots] = useState<MasterbotInfo[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadMasterbots = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from('users')
          .select('id, username, display_name, avatar_url, bio')
          .eq('is_master_bot', true)
          .order('username');

        if (error) {
          console.error('Error loading masterbots:', error);
        } else {
          setAvailableMasterbots(data || []);
        }
      } catch (err) {
        console.error('Error fetching masterbots:', err);
      }
    };

    loadMasterbots();
  }, []);

  useEffect(() => {
    if (!selectedMasterbot) return;

    const loadAIConversation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/chat/ai?masterbot=${selectedMasterbot}&limit=50`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'Failed to load conversation');
          return;
        }

        setMessages(data.messages || []);
        setMasterbotInfo(data.masterbot);

      } catch (err) {
        console.error('Error loading AI conversation:', err);
        setError('Failed to load conversation');
      } finally {
        setIsLoading(false);
      }
    };

    const setupRealtimeSubscription = () => {
      if (!user) return;

      const supabase = supabaseBrowser();
      const aiRoomId = `ai_${masterbotInfo?.id || 'unknown'}_${user.id}`;

      const subscription = supabase
        .channel(`ai_chat_${aiRoomId}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'chat_messages',
            filter: `room_id=eq.${aiRoomId}`
          },
          (payload: any) => {
            const message = payload.new as ChatMessage;
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === message.id)) return prev;
              return [...prev, message];
            });
          }
        )
        .subscribe();

      return () => subscription.unsubscribe();
    };

    loadAIConversation();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [selectedMasterbot, masterbotInfo?.id, user]);

  const retryLoadConversation = async () => {
    if (!selectedMasterbot) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/chat/ai?masterbot=${selectedMasterbot}&limit=50`);
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to load conversation');
        return;
      }

      setMessages(data.messages || []);
      setMasterbotInfo(data.masterbot);

    } catch (err) {
      console.error('Error loading AI conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedMasterbot || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          masterbotUsername: selectedMasterbot
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to send message');
        setNewMessage(messageContent); // Restore message on error
        return;
      }

      // Messages will be added via realtime subscription
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="text-center py-8">
          <p>Please sign in to chat with AI masterbots.</p>
        </CardContent>
      </Card>
    );
  }

  // Masterbot selection screen
  if (!selectedMasterbot) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Choose Your AI Food Expert
          </CardTitle>
          <p className="text-sm text-gray-600">
            Chat with specialized AI masterbots to get personalized food recommendations and insights.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableMasterbots.map((masterbot) => {
              // Get fallback personality data if exists
              const personality = MASTERBOT_PERSONALITIES[masterbot.username as keyof typeof MASTERBOT_PERSONALITIES];
              const specialties = personality?.specialties || ['food expert'];
              
              return (
                <Card 
                  key={masterbot.username}
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
                  onClick={() => setSelectedMasterbot(masterbot.username)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {masterbot.avatar_url ? (
                        <div className="w-8 h-8 relative">
                          <Image
                            src={masterbot.avatar_url}
                            alt={masterbot.display_name}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`p-2 rounded-full ${personality?.color || 'bg-gray-500'} text-white`}>
                          {personality?.icon && <personality.icon className="h-4 w-4" />}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-sm">{masterbot.display_name}</h3>
                        <p className="text-xs text-gray-600">@{masterbot.username}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {specialties.slice(0, 2).map((specialty) => (
                        <Badge key={specialty} variant="secondary" className="text-xs mr-1">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {onBack && (
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={onBack}>
                Back to Chat Options
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const selectedPersonality = MASTERBOT_PERSONALITIES[selectedMasterbot as keyof typeof MASTERBOT_PERSONALITIES];
  const currentMasterbot = availableMasterbots.find(mb => mb.username === selectedMasterbot);

  return (
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col">
      {/* Header */}
      <CardHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentMasterbot?.avatar_url ? (
              <div className="w-10 h-10 relative">
                <Image
                  src={currentMasterbot.avatar_url}
                  alt={currentMasterbot.display_name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              </div>
            ) : (
              <div className={`p-2 rounded-full ${selectedPersonality?.color || 'bg-gray-500'} text-white`}>
                {selectedPersonality && <selectedPersonality.icon className="h-4 w-4" />}
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{currentMasterbot?.display_name || selectedPersonality?.name}</CardTitle>
              <p className="text-sm text-gray-600">@{selectedMasterbot}</p>
            </div>
            <div className="flex gap-1">
              {selectedPersonality?.specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedMasterbot(null)}
            >
              Switch AI
            </Button>
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack}>
                Back
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading conversation...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <p className="text-red-500 mb-2">{error}</p>
            <Button onClick={retryLoadConversation} size="sm">
              Try Again
            </Button>
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-2">Start a conversation with {selectedPersonality?.name}!</p>
            <p className="text-sm text-gray-400">
              Ask for food recommendations, cooking tips, or anything related to {selectedPersonality?.specialties.join(', ')}.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.is_ai_generated ? 'justify-start' : 'justify-end'}`}
          >
            {message.is_ai_generated && (
              <div className={`p-2 rounded-full ${selectedPersonality?.color} text-white flex-shrink-0`}>
                <Bot className="h-4 w-4" />
              </div>
            )}
            
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.is_ai_generated
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(message.created_at).toLocaleTimeString()}
              </p>
            </div>

            {!message.is_ai_generated && message.user?.avatar_url && (
              <Image
                src={message.user.avatar_url}
                alt={message.user.display_name || 'User'}
                width={32}
                height={32}
                className="rounded-full flex-shrink-0"
              />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask ${selectedPersonality?.name} about food...`}
            disabled={isSending}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || isSending}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {isSending && (
          <p className="text-xs text-gray-500 mt-1">Sending message...</p>
        )}
      </div>
    </Card>
  );
}