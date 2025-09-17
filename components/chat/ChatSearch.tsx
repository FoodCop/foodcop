import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, MessageCircle, UserPlus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { User } from '../ChatPage';

interface ChatSearchProps {
  currentUser: User;
  onBack: () => void;
  onStartConversation: (user: User) => void;
}

export function ChatSearch({ currentUser, onBack, onStartConversation }: ChatSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [recentChats, setRecentChats] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Mock data for friends/users
  const allUsers: User[] = [
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
      online: false,
      lastSeen: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: 'user-5',
      name: 'David Park',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      online: true
    },
    {
      id: 'user-6',
      name: 'Jessica Wong',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b381b5d4?w=100&h=100&fit=crop&crop=face',
      online: false,
      lastSeen: new Date(Date.now() - 5 * 60 * 60 * 1000)
    },
    {
      id: 'user-7',
      name: 'Michael Brown',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      online: true
    },
    {
      id: 'user-8',
      name: 'Lisa Anderson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      online: false,
      lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  ];

  useEffect(() => {
    // Set recent chats (first 4 users as example)
    setRecentChats(allUsers.slice(0, 4));
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    // Simulate search delay
    const searchTimeout = setTimeout(() => {
      const filtered = allUsers.filter(user => 
        user.id !== currentUser.id &&
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, currentUser.id]);

  const formatLastSeen = (user: User) => {
    if (user.online) return 'online';
    if (!user.lastSeen) return 'offline';
    
    const now = new Date();
    const diff = now.getTime() - user.lastSeen.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 5) return 'active recently';
    if (minutes < 60) return `active ${minutes}m ago`;
    if (hours < 24) return `active ${hours}h ago`;
    if (days < 7) return `active ${days}d ago`;
    
    return `active ${user.lastSeen.toLocaleDateString()}`;
  };

  const UserListItem = ({ user, showBadge = false }: { user: User; showBadge?: boolean }) => (
    <button
      onClick={() => onStartConversation(user)}
      className="w-full p-4 hover:bg-muted transition-colors text-left"
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Avatar className="w-12 h-12">
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </Avatar>
          {user.online && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium truncate">{user.name}</h3>
            {showBadge && (
              <Badge variant="outline" className="text-xs">
                Recent
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatLastSeen(user)}
          </p>
        </div>

        <MessageCircle className="w-5 h-5 text-muted-foreground" />
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center space-x-3 p-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg">New Message</h1>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input-background border-border"
              autoFocus
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-20">
        {searchQuery ? (
          // Search Results
          <div>
            {isSearching ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-8 h-8 border border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Searching...</p>
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                <div className="px-4 py-2">
                  <h3 className="text-sm text-muted-foreground uppercase tracking-wide">
                    Search Results ({searchResults.length})
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {searchResults.map(user => (
                    <UserListItem key={user.id} user={user} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try searching with a different name
                </p>
              </div>
            )}
          </div>
        ) : (
          // Default View
          <div>
            {/* Recent Chats */}
            {recentChats.length > 0 && (
              <div>
                <div className="px-4 py-3">
                  <h3 className="text-sm text-muted-foreground uppercase tracking-wide">
                    Recent Chats
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {recentChats.map(user => (
                    <UserListItem key={user.id} user={user} showBadge />
                  ))}
                </div>
              </div>
            )}

            {/* All Friends */}
            <div className="mt-6">
              <div className="px-4 py-3">
                <h3 className="text-sm text-muted-foreground uppercase tracking-wide">
                  All Friends
                </h3>
              </div>
              <div className="divide-y divide-border">
                {allUsers
                  .filter(user => user.id !== currentUser.id)
                  .map(user => (
                    <UserListItem key={user.id} user={user} />
                  ))}
              </div>
            </div>

            {/* Tako Suggestion */}
            <div className="p-6 text-center border-t border-border mt-6">
              <div className="text-4xl mb-3">🐙</div>
              <h3 className="font-medium mb-2">Invite more friends!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tako thinks you should share FUZO with more food lovers
              </p>
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Friends
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
