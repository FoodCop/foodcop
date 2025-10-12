'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TypingStatus } from '../utils/ChatTypes';
import { getAvatarFallback, getAvatarGradient, getPlaceholderAvatar } from '../utils/ChatUtils';

interface TypingIndicatorProps {
  typingUsers: TypingStatus[];
  className?: string;
}

export function TypingIndicator({ typingUsers, className = '' }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].user_name} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].user_name} and ${typingUsers[1].user_name} are typing...`;
    } else {
      return `${typingUsers.length} people are typing...`;
    }
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-2 ${className}`}>
      {/* Show avatar for single user typing */}
      {typingUsers.length === 1 && (
        <Avatar className="h-6 w-6">
          <AvatarImage 
            src={getPlaceholderAvatar(typingUsers[0].user_name)} 
            alt={typingUsers[0].user_name}
          />
          <AvatarFallback className={`bg-gradient-to-r ${getAvatarGradient(typingUsers[0].user_id)} text-white font-semibold text-xs`}>
            {getAvatarFallback(typingUsers[0].user_name)}
          </AvatarFallback>
        </Avatar>
      )}
      
      {/* Multiple users typing - show overlapping avatars */}
      {typingUsers.length > 1 && (
        <div className="flex -space-x-1">
          {typingUsers.slice(0, 3).map((user, index) => (
            <Avatar key={user.user_id} className="h-6 w-6 border-2 border-white">
              <AvatarImage 
                src={getPlaceholderAvatar(user.user_name)} 
                alt={user.user_name}
              />
              <AvatarFallback className={`bg-gradient-to-r ${getAvatarGradient(user.user_id)} text-white font-semibold text-xs`}>
                {getAvatarFallback(user.user_name)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      )}

      {/* Typing Text and Animation */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">{getTypingText()}</span>
        
        {/* Animated Dots */}
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}