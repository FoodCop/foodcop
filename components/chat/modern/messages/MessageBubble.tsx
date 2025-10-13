'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Message } from '../utils/ChatTypes';
import { 
  formatMessageTimestamp, 
  isMessageFromCurrentUser, 
  getAvatarFallback, 
  getAvatarGradient,
  getPlaceholderAvatar 
} from '../utils/ChatUtils';
import SharedContentRenderer from '../sharing/SharedContentRenderer';

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
  showAvatar?: boolean;
  isGrouped?: boolean; // If grouped with previous message from same sender
  onReply?: (message: Message) => void;
  onReact?: (message: Message, emoji: string) => void;
  className?: string;
}

export function MessageBubble({
  message,
  currentUserId,
  showAvatar = true,
  isGrouped = false,
  onReply,
  onReact,
  className = ''
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const isFromCurrentUser = isMessageFromCurrentUser(message.sender_id, currentUserId);

  const handleLongPress = () => {
    setShowActions(true);
  };

  const handleReply = () => {
    onReply?.(message);
    setShowActions(false);
  };

  const handleReact = (emoji: string) => {
    onReact?.(message, emoji);
    setShowActions(false);
  };

  const getStatusIcon = () => {
    if (!isFromCurrentUser) return null;
    
    switch (message.status) {
      case 'sending':
        return (
          <div className="h-3 w-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
        );
      case 'sent':
        return (
          <svg className="h-3 w-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'delivered':
        return (
          <div className="flex">
            <svg className="h-3 w-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <svg className="h-3 w-3 text-gray-400 -ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'read':
        return (
          <div className="flex">
            <svg className="h-3 w-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <svg className="h-3 w-3 text-blue-500 -ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex gap-2 px-4 py-1 ${isFromCurrentUser ? 'justify-end' : 'justify-start'} ${className}`}>
      {/* Avatar for received messages */}
      {!isFromCurrentUser && showAvatar && !isGrouped && (
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={message.sender_avatar || getPlaceholderAvatar(message.sender_name || 'User')} 
              alt={message.sender_name}
            />
            <AvatarFallback className={`bg-gradient-to-r ${getAvatarGradient(message.sender_id)} text-white font-semibold text-xs`}>
              {getAvatarFallback(message.sender_name || 'User')}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      {/* Spacer for grouped messages */}
      {!isFromCurrentUser && (!showAvatar || isGrouped) && (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Message Content */}
      <div className={`max-w-[75%] ${isFromCurrentUser ? 'order-2' : 'order-1'}`}>
        {/* Sender name for group chats and received messages */}
        {!isFromCurrentUser && !isGrouped && message.sender_name && (
          <p className="text-xs text-gray-600 mb-1 px-3">{message.sender_name}</p>
        )}
        
        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-2 break-words ${
            message.type === 'restaurant' || message.type === 'recipe' 
              ? 'max-w-md' // Wider for shared content
              : 'max-w-full'
          } ${
            isFromCurrentUser
              ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }`}
          onTouchStart={handleLongPress}
          onContextMenu={(e) => {
            e.preventDefault();
            handleLongPress();
          }}
        >
          {/* Message Content */}
          {message.type === 'restaurant' || message.type === 'recipe' ? (
            <SharedContentRenderer 
              message={message}
              className="mb-2"
            />
          ) : (
            <div className="text-sm leading-relaxed">
              {message.content}
            </div>
          )}
          
          {/* Message reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {message.reactions.map((reaction, index) => (
                <div
                  key={index}
                  className="bg-white/20 rounded-full px-2 py-1 text-xs flex items-center gap-1"
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-xs">1</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Timestamp and Status */}
        <div className={`flex items-center gap-1 mt-1 px-3 ${
          isFromCurrentUser ? 'justify-end' : 'justify-start'
        }`}>
          <span className="text-xs text-gray-500">
            {formatMessageTimestamp(message.timestamp)}
          </span>
          {getStatusIcon()}
        </div>
      </div>

      {/* Action Menu Overlay */}
      {showActions && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-4 mx-4 min-w-[200px]">
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleReply}
              >
                Reply
              </Button>
              <div className="flex gap-2 justify-center py-2">
                {['❤️', '😂', '😮', '😢', '😡', '👍'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className="text-2xl hover:scale-110 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowActions(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}