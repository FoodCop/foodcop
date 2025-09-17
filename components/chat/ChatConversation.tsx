import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Smile, Paperclip, MoreVertical, Phone, Video } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar } from '../ui/avatar';
import { Conversation, User, Message } from '../ChatPage';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';

interface ChatConversationProps {
  conversation: Conversation;
  currentUser: User;
  onBack: () => void;
}

export function ChatConversation({ conversation, currentUser, onBack }: ChatConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Mock messages for demonstration
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: 'msg-1',
        text: 'Hey! How was that restaurant you went to yesterday?',
        userId: conversation.participants.find(p => p.id !== currentUser.id)?.id || '',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-2',
        text: 'It was amazing! The pasta was incredible 🍝',
        userId: currentUser.id,
        timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000),
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-3',
        text: 'I took some photos, let me share them with you',
        userId: currentUser.id,
        timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000 + 30000),
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-4',
        text: 'Wow, that looks delicious! What\'s the name of the place?',
        userId: conversation.participants.find(p => p.id !== currentUser.id)?.id || '',
        timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000),
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-5',
        text: 'It\'s called "Pasta Dreams" on 5th Street. You should definitely try it!',
        userId: currentUser.id,
        timestamp: new Date(Date.now() - 21 * 60 * 60 * 1000),
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-6',
        text: 'Perfect! I\'ll check it out this weekend. Thanks for the recommendation! 😊',
        userId: conversation.participants.find(p => p.id !== currentUser.id)?.id || '',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        type: 'text',
        status: 'read'
      }
    ];

    setMessages(mockMessages);
  }, [conversation.id, currentUser.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when conversation opens
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversation.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      text: messageInput.trim(),
      userId: currentUser.id,
      timestamp: new Date(),
      type: 'text',
      status: 'sending'
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');

    // Simulate message delivery
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'sent' as const }
            : msg
        )
      );
    }, 500);

    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'delivered' as const }
            : msg
        )
      );
    }, 1000);

    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'read' as const }
            : msg
        )
      );
    }, 2000);

    // Simulate other user typing and response
    if (Math.random() > 0.7) {
      setTimeout(() => {
        setOtherUserTyping(true);
        setTimeout(() => {
          setOtherUserTyping(false);
          const responses = [
            'That sounds great!',
            'Thanks for sharing! 😊',
            'I\'ll have to try that place',
            'Tako approves! 🐙',
            'Amazing recommendation!'
          ];
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];
          
          const responseMessage: Message = {
            id: `msg-${Date.now()}-response`,
            text: randomResponse,
            userId: conversation.participants.find(p => p.id !== currentUser.id)?.id || '',
            timestamp: new Date(),
            type: 'text',
            status: 'read'
          };
          
          setMessages(prev => [...prev, responseMessage]);
        }, 2000);
      }, 1000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getConversationName = () => {
    if (conversation.type === 'group' && conversation.name) {
      return conversation.name;
    }
    
    const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
    return otherParticipant?.name || 'Unknown';
  };

  const getConversationAvatar = () => {
    if (conversation.type === 'group' && conversation.avatar) {
      return conversation.avatar;
    }
    
    const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
    return otherParticipant?.avatar || '';
  };

  const getOnlineStatus = () => {
    if (conversation.type === 'group') return null;
    
    const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
    return otherParticipant?.online;
  };

  const formatLastSeen = () => {
    if (conversation.type === 'group') return null;
    
    const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
    if (!otherParticipant || otherParticipant.online || !otherParticipant.lastSeen) return null;
    
    const now = new Date();
    const lastSeen = otherParticipant.lastSeen;
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 5) return 'active recently';
    if (minutes < 60) return `active ${minutes}m ago`;
    if (hours < 24) return `active ${hours}h ago`;
    if (days < 7) return `active ${days}d ago`;
    
    return `active ${lastSeen.toLocaleDateString()}`;
  };

  const conversationName = getConversationName();
  const conversationAvatar = getConversationAvatar();
  const isOnline = getOnlineStatus();
  const lastSeenText = formatLastSeen();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="relative">
              {conversation.type === 'group' && conversation.avatar ? (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                  {conversation.avatar}
                </div>
              ) : (
                <Avatar className="w-10 h-10">
                  <img 
                    src={conversationAvatar} 
                    alt={conversationName}
                    className="w-full h-full object-cover"
                  />
                </Avatar>
              )}
              
              {conversation.type === 'direct' && isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>

            <div>
              <h2 className="font-medium">{conversationName}</h2>
              {conversation.type === 'direct' && (
                <p className="text-xs text-muted-foreground">
                  {isOnline ? 'online' : lastSeenText}
                </p>
              )}
              {conversation.type === 'group' && (
                <p className="text-xs text-muted-foreground">
                  {conversation.participants.length} members
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              <Video className="h-5 w-5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">🐙</div>
            <h3 className="text-lg mb-2">Start the conversation</h3>
            <p className="text-muted-foreground">
              Tako is excited to help you connect with {conversationName}!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showAvatar = !prevMessage || 
                                prevMessage.userId !== message.userId ||
                                message.timestamp.getTime() - prevMessage.timestamp.getTime() > 5 * 60 * 1000;
              
              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  currentUser={currentUser}
                  conversation={conversation}
                  showAvatar={showAvatar}
                />
              );
            })}
            
            {otherUserTyping && (
              <TypingIndicator 
                conversation={conversation}
                currentUser={currentUser}
              />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4">
        <div className="flex items-end space-x-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={messageInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="pr-12 bg-input-background border-border"
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
