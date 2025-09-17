import React from 'react';
import { Avatar } from '../ui/avatar';
import { Conversation, User } from '../ChatPage';

interface TypingIndicatorProps {
  conversation: Conversation;
  currentUser: User;
}

export function TypingIndicator({ conversation, currentUser }: TypingIndicatorProps) {
  const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
  
  if (!otherParticipant) return null;

  return (
    <div className="flex items-end space-x-2">
      {/* Avatar */}
      <Avatar className="w-8 h-8">
        <img 
          src={otherParticipant.avatar} 
          alt={otherParticipant.name}
          className="w-full h-full object-cover"
        />
      </Avatar>

      <div className="flex flex-col space-y-1">
        <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
        
        <span className="text-xs text-muted-foreground ml-3">
          {otherParticipant.name} is typing...
        </span>
      </div>
    </div>
  );
}
