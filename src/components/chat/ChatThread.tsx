import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import { useDMChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { DMConversation, SharedItem } from '../../services/dmChatService';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { MessageBubble } from './MessageBubble';

interface ChatThreadProps {
  conversation: DMConversation;
  onBack: () => void;
  onSharedItemClick?: (item: SharedItem) => void;
}

export function ChatThread({
  conversation,
  onBack,
  onSharedItemClick,
}: ChatThreadProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const {
    messages,
    loadMessages,
    sendMessage,
    markAsRead,
    subscribeToConversation,
    isLoadingMessages,
    isSending,
  } = useDMChatStore();

  const conversationMessages = messages[conversation.id] || [];

  // Load messages and subscribe
  useEffect(() => {
    loadMessages(conversation.id);
    const unsubscribe = subscribeToConversation(conversation.id);

    // Mark as read
    if (user?.id) {
      markAsRead(conversation.id, user.id);
    }

    return unsubscribe;
  }, [conversation.id, user?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages.length]);

  const handleSend = async () => {
    if (!inputValue.trim() || !user?.id || isSending) return;

    const content = inputValue.trim();
    setInputValue('');
    await sendMessage(conversation.id, user.id, content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherUser = conversation.other_user;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-white">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUser?.avatar_url} />
          <AvatarFallback>
            {otherUser?.display_name?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {otherUser?.display_name || 'Unknown'}
          </p>
          <p className="text-xs text-gray-500 truncate">
            @{otherUser?.username}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : conversationMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p>No messages yet</p>
            <p className="text-sm">Say hello! 👋</p>
          </div>
        ) : (
          <>
            {conversationMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === user?.id}
                onSharedItemClick={onSharedItemClick}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            size="icon"
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ChatThread;

