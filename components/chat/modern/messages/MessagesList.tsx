'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Message, ChatContact } from '../utils/ChatTypes';
import { format, isSameDay, isYesterday } from 'date-fns';

interface MessagesListProps {
  messages: Message[];
  currentUser: ChatContact;
  otherUser: ChatContact;
  isTyping?: boolean;
  typingUser?: string;
  onReaction?: (messageId: string, reaction: string) => void;
  onMessageLongPress?: (message: Message) => void;
  onReply?: (message: Message) => void;
  className?: string;
}

export function MessagesList({
  messages,
  currentUser,
  otherUser,
  isTyping = false,
  typingUser,
  onReaction,
  onMessageLongPress,
  onReply,
  className = ''
}: MessagesListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle scroll to show/hide scroll-to-bottom button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = (smooth: boolean = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto' 
    });
  };

  const formatDateSeparator = (date: Date) => {
    if (isSameDay(date, new Date())) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, message) => {
    const dateKey = format(new Date(message.timestamp), 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {});

  return (
    <div className={`flex-1 overflow-hidden relative ${className}`}>
      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="h-full overflow-y-auto px-4 py-4 space-y-1"
      >
        {Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
          <div key={dateKey}>
            {/* Date Separator */}
            <div className="flex justify-center my-4">
              <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                {formatDateSeparator(new Date(dayMessages[0].timestamp))}
              </div>
            </div>

            {/* Messages for this day */}
            {dayMessages.map((message, index) => {
              const isOwn = message.sender_id === currentUser.id;
              const prevMessage = index > 0 ? dayMessages[index - 1] : null;
              const nextMessage = index < dayMessages.length - 1 ? dayMessages[index + 1] : null;
              
              // Determine if this message should be grouped with previous/next
              const isGroupedWithPrev = prevMessage ? 
                prevMessage.sender_id === message.sender_id &&
                new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() < 60000 : false; // 1 minute
              
              const isGroupedWithNext = nextMessage ? 
                nextMessage.sender_id === message.sender_id &&
                new Date(nextMessage.timestamp).getTime() - new Date(message.timestamp).getTime() < 60000 : false; // 1 minute

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  currentUserId={currentUser.id}
                  showAvatar={!isGroupedWithNext}
                  isGrouped={isGroupedWithPrev}
                  onReply={onReply}
                  onReact={onReaction ? (msg, emoji) => onReaction(msg.id, emoji) : undefined}
                />
              );
            })}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && typingUser && (
          <div className="flex justify-start">
            <TypingIndicator 
              typingUsers={[{
                user_id: otherUser.id,
                user_name: typingUser,
                conversation_id: '', // Will be set by parent component
                timestamp: new Date().toISOString()
              }]}
            />
          </div>
        )}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-4 right-4 bg-white shadow-lg rounded-full p-3 border border-gray-200 hover:bg-gray-50 transition-all duration-200"
        >
          <svg 
            className="w-5 h-5 text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 14l-7 7m0 0l-7-7m7 7V3" 
            />
          </svg>
        </button>
      )}

      {/* Empty State */}
      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-lg font-medium mb-2">No messages yet</p>
            <p className="text-sm">Start a conversation with {otherUser.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}