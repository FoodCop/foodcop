import React from 'react';
import { Avatar } from '../ui/avatar';
import { Message, User, Conversation } from '../ChatPage';

interface MessageItemProps {
  message: Message;
  currentUser: User;
  conversation: Conversation;
  showAvatar: boolean;
}

export function MessageItem({ message, currentUser, conversation, showAvatar }: MessageItemProps) {
  const isOwn = message.userId === currentUser.id;
  
  const getSender = () => {
    return conversation.participants.find(p => p.id === message.userId);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
    if (!isOwn) return null;
    
    switch (message.status) {
      case 'sending':
        return (
          <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
        );
      case 'sent':
        return <div className="text-muted-foreground text-xs">✓</div>;
      case 'delivered':
        return <div className="text-muted-foreground text-xs">✓✓</div>;
      case 'read':
        return <div className="text-primary text-xs">✓✓</div>;
      default:
        return null;
    }
  };

  const sender = getSender();

  if (isOwn) {
    return (
      <div className="flex justify-end items-end space-x-2">
        <div className="flex flex-col items-end space-y-1">
          <div className="max-w-xs lg:max-w-md">
            <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2">
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
            {getStatusIcon()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end space-x-2">
      {/* Avatar */}
      <div className="w-8 h-8 flex-shrink-0">
        {showAvatar && sender ? (
          <Avatar className="w-8 h-8">
            <img 
              src={sender.avatar} 
              alt={sender.name}
              className="w-full h-full object-cover"
            />
          </Avatar>
        ) : (
          <div className="w-8 h-8" />
        )}
      </div>

      <div className="flex flex-col space-y-1">
        {/* Sender name for group chats */}
        {showAvatar && conversation.type === 'group' && sender && (
          <span className="text-xs text-muted-foreground ml-3">
            {sender.name}
          </span>
        )}
        
        <div className="max-w-xs lg:max-w-md">
          <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2">
            <p className="text-sm">{message.text}</p>
          </div>
        </div>
        
        <span className="text-xs text-muted-foreground ml-3">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
