import React, { useState } from 'react';
import { Search, MessageCircle, Plus, MoreHorizontal, Bot } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Conversation, User } from '../ChatPage';

interface ChatListProps {
  conversations: Conversation[];
  currentUser: User;
  onSelectConversation: (conversation: Conversation) => void;
  onOpenSearch: () => void;
  onNewChat: () => void;
  onMasterBots?: () => void;
}

export function ChatList({ 
  conversations, 
  currentUser, 
  onSelectConversation, 
  onOpenSearch,
  onNewChat,
  onMasterBots
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Search by participant names
    const participantNames = conversation.participants
      .filter(p => p.id !== currentUser.id)
      .map(p => p.name.toLowerCase());
    
    // Search by group name
    const groupName = conversation.name?.toLowerCase() || '';
    
    // Search by last message
    const lastMessageText = conversation.lastMessage?.text.toLowerCase() || '';
    
    return participantNames.some(name => name.includes(query)) ||
           groupName.includes(query) ||
           lastMessageText.includes(query);
  });

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === 'group' && conversation.name) {
      return conversation.name;
    }
    
    const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
    return otherParticipant?.name || 'Unknown';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'group' && conversation.avatar) {
      return conversation.avatar;
    }
    
    const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
    return otherParticipant?.avatar || '';
  };

  const getOnlineStatus = (conversation: Conversation) => {
    if (conversation.type === 'group') return null;
    
    const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
    return otherParticipant?.online;
  };

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">💬</div>
            <div>
              <h1 className="text-xl">Messages</h1>
              {totalUnreadCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {totalUnreadCount} unread message{totalUnreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {onMasterBots && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onMasterBots}
                className="text-[#F14C35] hover:text-[#E03A28]"
                title="Chat with Master Bots"
              >
                <Bot className="h-5 w-5" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={onOpenSearch}
              className="text-muted-foreground hover:text-foreground"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onNewChat}
              className="text-primary hover:text-primary/90"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input-background border-border"
            />
          </div>
        </div>

        {/* Master Bots Quick Access */}
        {onMasterBots && (
          <div className="px-4 pb-4">
            <Button
              onClick={onMasterBots}
              variant="outline"
              className="w-full justify-start bg-gradient-to-r from-[#F14C35]/5 to-[#A6471E]/5 border-[#F14C35]/20 hover:bg-[#F14C35]/10"
            >
              <Bot className="h-4 w-4 mr-2 text-[#F14C35]" />
              <span className="text-[#0B1F3A]">Chat with Master Food Experts</span>
              <div className="ml-auto text-xs bg-[#F14C35] text-white px-2 py-1 rounded-full">
                AI
              </div>
            </Button>
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="pb-20">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg mb-2">No messages found</h3>
                <p className="text-muted-foreground mb-4">
                  Try searching with different keywords
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🐙</div>
                <h3 className="text-lg mb-2">No conversations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Tako is waiting for you to start chatting with friends!
                </p>
                <Button onClick={onNewChat} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Chat
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conversation) => {
              const conversationName = getConversationName(conversation);
              const conversationAvatar = getConversationAvatar(conversation);
              const isOnline = getOnlineStatus(conversation);
              
              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className="w-full p-4 hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="relative">
                      {conversation.type === 'group' && conversation.avatar ? (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                          {conversation.avatar}
                        </div>
                      ) : (
                        <Avatar className="w-12 h-12">
                          <img 
                            src={conversationAvatar} 
                            alt={conversationName}
                            className="w-full h-full object-cover"
                          />
                        </Avatar>
                      )}
                      
                      {/* Online indicator for direct messages */}
                      {conversation.type === 'direct' && isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium truncate">
                          {conversationName}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {conversation.lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatTime(conversation.lastMessage.timestamp)}
                            </span>
                          )}
                          {conversation.unreadCount > 0 && (
                            <Badge 
                              variant="default" 
                              className="bg-primary text-primary-foreground text-xs min-w-[1.25rem] h-5 flex items-center justify-center px-1"
                            >
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {conversation.lastMessage ? (
                        <div className="flex items-center">
                          <p className="text-sm text-muted-foreground truncate flex-1">
                            {conversation.lastMessage.userId === currentUser.id && (
                              <span className="text-primary">You: </span>
                            )}
                            {conversation.lastMessage.text}
                          </p>
                          
                          {/* Message status for sent messages */}
                          {conversation.lastMessage.userId === currentUser.id && (
                            <div className="ml-2">
                              {conversation.lastMessage.status === 'sending' && (
                                <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
                              )}
                              {conversation.lastMessage.status === 'sent' && (
                                <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                              )}
                              {conversation.lastMessage.status === 'delivered' && (
                                <div className="text-muted-foreground text-xs">✓</div>
                              )}
                              {conversation.lastMessage.status === 'read' && (
                                <div className="text-primary text-xs">✓✓</div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No messages yet</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
