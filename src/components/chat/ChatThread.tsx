import { useState, useEffect, useRef } from 'react';
import { Send, ArrowBack, Loop } from '@mui/icons-material';
import { useDMChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { DMConversation, SharedItem } from '../../services/dmChatService';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { MessageBubble } from './MessageBubble';
import { MessageRetentionNotice } from './MessageRetentionNotice';
import { MessageSkeleton } from './ConversationSkeleton';
import { NoMessagesEmptyState } from './EmptyState';
import { OnlineStatusDot, LastSeenText } from './OnlineStatusIndicator';

interface ChatThreadProps {
  conversation: DMConversation;
  onBack: () => void;
  onSharedItemClick?: (item: SharedItem) => void;
  onAvatarClick?: (userId: string) => void;
}

export function ChatThread({
  conversation,
  onBack,
  onSharedItemClick,
  onAvatarClick,
}: Readonly<ChatThreadProps>) {
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
    messageStatus,
    retryMessage,
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
          <ArrowBack className="h-5 w-5" />
        </Button>
        <button
          onClick={() => onAvatarClick?.(otherUser?.id || '')}
          className="relative shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
          title="View profile"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser?.avatar_url} />
            <AvatarFallback>
              {otherUser?.display_name?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          {/* Online status dot on avatar */}
          {otherUser?.id && (
            <OnlineStatusDot
              userId={otherUser.id}
              className="bottom-0 right-0"
              size="sm"
            />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {otherUser?.display_name || 'Unknown'}
          </p>
          {/* Show "Active now" or "Last seen X ago" */}
          {otherUser?.id && (
            <LastSeenText userId={otherUser.id} className="text-xs" />
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {(() => {
          if (isLoadingMessages) {
            return <MessageSkeleton />;
          }
          
          if (conversationMessages.length === 0) {
            return <NoMessagesEmptyState />;
          }
          
          return (
            <>
              {/* Show retention notice only once when there are messages */}
              {conversationMessages.length > 0 && (
                <MessageRetentionNotice />
              )}
              {conversationMessages.map((msg) => {
              const status = messageStatus[msg.id] || 'delivered';
              const handleRetry =
                msg.sender_id === user?.id && status === 'failed'
                  ? () => {
                      retryMessage(conversation.id, user.id, msg.content || '', msg.id);
                    }
                  : undefined;

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === user?.id}
                  onSharedItemClick={onSharedItemClick}
                  status={status}
                  onRetry={handleRetry}
                />
              );
              })}
              <div ref={messagesEndRef} />
            </>
          );
        })()}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 transition-all"
            disabled={isSending}
            aria-label="Message input"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            size="icon"
            className="bg-fuzo-orange-500 hover:bg-fuzo-orange-600 transition-colors"
            aria-label="Send message"
          >
            {isSending ? (
              <Loop className="h-4 w-4 animate-spin" />
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

