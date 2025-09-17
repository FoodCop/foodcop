import React, { useState } from 'react';
import { X, Search, MessageCircle, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { User } from '../ChatPage';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartConversation: (user: User) => void;
  currentUser: User;
}

export function NewChatModal({ isOpen, onClose, onStartConversation, currentUser }: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'direct' | 'group'>('direct');

  // Mock friends data
  const friends: User[] = [
    {
      id: 'user-1',
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b381b5d4?w=100&h=100&fit=crop&crop=face',
      online: true
    },
    {
      id: 'user-2',
      name: 'Marcus Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      online: false,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 'user-3',
      name: 'Emma Thompson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      online: true
    },
    {
      id: 'user-4',
      name: 'Alex Kim',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      online: false
    },
    {
      id: 'user-5',
      name: 'David Park',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      online: true
    }
  ];

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    friend.id !== currentUser.id
  );

  const handleUserSelect = (user: User) => {
    if (activeTab === 'direct') {
      onStartConversation(user);
      onClose();
    } else {
      // Group chat logic
      setSelectedUsers(prev => {
        const isSelected = prev.some(u => u.id === user.id);
        if (isSelected) {
          return prev.filter(u => u.id !== user.id);
        } else {
          return [...prev, user];
        }
      });
    }
  };

  const handleCreateGroup = () => {
    if (selectedUsers.length < 2) return;
    
    // In a real app, you would create a group conversation here
    // For now, we'll just start a conversation with the first selected user
    onStartConversation(selectedUsers[0]);
    onClose();
  };

  const resetModal = () => {
    setSearchQuery('');
    setSelectedUsers([]);
    setActiveTab('direct');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>New Message</span>
          </DialogTitle>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex space-x-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
              activeTab === 'direct'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            <span>Direct</span>
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
              activeTab === 'group'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Group</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected Users for Group Chat */}
        {activeTab === 'group' && selectedUsers.length > 0 && (
          <div className="border border-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Selected ({selectedUsers.length})
              </span>
              <Button
                size="sm"
                onClick={handleCreateGroup}
                disabled={selectedUsers.length < 2}
                className="bg-primary hover:bg-primary/90"
              >
                Create Group
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <Badge
                  key={user.id}
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <Avatar className="w-4 h-4">
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  </Avatar>
                  <span className="text-xs">{user.name}</span>
                  <button
                    onClick={() => handleUserSelect(user)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto">
          {filteredFriends.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="text-4xl mb-3">🐙</div>
              <h3 className="font-medium mb-2">No friends found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'Start by adding some friends!'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredFriends.map(friend => {
                const isSelected = selectedUsers.some(u => u.id === friend.id);
                
                return (
                  <button
                    key={friend.id}
                    onClick={() => handleUserSelect(friend)}
                    className={`w-full p-3 rounded-lg hover:bg-muted transition-colors text-left ${
                      isSelected && activeTab === 'group' ? 'bg-primary/10 border border-primary' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <img 
                            src={friend.avatar} 
                            alt={friend.name}
                            className="w-full h-full object-cover"
                          />
                        </Avatar>
                        {friend.online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{friend.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {friend.online ? 'online' : 'offline'}
                        </p>
                      </div>

                      {activeTab === 'group' && isSelected && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}

                      {activeTab === 'direct' && (
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
