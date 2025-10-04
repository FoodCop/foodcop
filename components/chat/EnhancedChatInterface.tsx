'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePresence } from '@/lib/hooks/usePresence';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Bot, MessageCircle, ArrowLeft, UserPlus } from 'lucide-react';
import { SimpleChatComponent } from './SimpleChatComponent';
import { AIChatComponent } from './AIChatComponent';
import { FriendManagement } from './FriendManagement';
import Image from 'next/image';

interface Friend {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
  email: string;
  is_online?: boolean;
  last_seen?: string;
}

type ChatMode = 'menu' | 'friends' | 'ai' | 'friend-chat' | 'manage-friends';

export function EnhancedChatInterface() {
  const [chatMode, setChatMode] = useState<ChatMode>('menu');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const { user } = useAuth();

  // Initialize presence tracking
  usePresence({
    enabled: true,
    heartbeatInterval: 30000, // 30 seconds
    offlineThreshold: 300000  // 5 minutes
  });

  useEffect(() => {
    if (chatMode === 'friends') {
      loadFriends();
    }
  }, [chatMode]);

  const loadFriends = async () => {
    try {
      setIsLoadingFriends(true);
      const response = await fetch('/api/chat/friends');
      const data = await response.json();

      if (data.success) {
        setFriends(data.friends || []);
      } else {
        console.error('Failed to load friends:', data.error);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const startFriendChat = (friend: Friend) => {
    setSelectedFriend(friend);
    setChatMode('friend-chat');
  };

  const goBack = () => {
    if (chatMode === 'friend-chat') {
      setSelectedFriend(null);
      setChatMode('friends');
    } else if (chatMode === 'manage-friends') {
      setChatMode('menu');
    } else {
      setChatMode('menu');
    }
  };

  const startFriendChatFromManagement = (friendId: string) => {
    // Find the friend data
    const friend = friends.find(f => f.id === friendId);
    if (friend) {
      setSelectedFriend(friend);
      setChatMode('friend-chat');
    }
  };

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="text-center py-8">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Sign In to Chat</h3>
          <p className="text-gray-600">Connect with friends and AI food experts to discover amazing food experiences.</p>
        </CardContent>
      </Card>
    );
  }

  // Friend management view
  if (chatMode === 'manage-friends') {
    return (
      <FriendManagement onStartChat={startFriendChatFromManagement} />
    );
  }

  // Friend chat view
  if (chatMode === 'friend-chat' && selectedFriend) {
    return (
      <div className="w-full">
        <div className="mb-4 flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={goBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Friends
          </Button>
          <div className="flex items-center gap-2">
            {selectedFriend.avatar_url && (
              <Image
                src={selectedFriend.avatar_url}
                alt={selectedFriend.display_name}
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <div>
              <h3 className="font-semibold">{selectedFriend.display_name}</h3>
              <p className="text-sm text-gray-600">@{selectedFriend.username}</p>
            </div>
          </div>
        </div>
        <SimpleChatComponent friendId={selectedFriend.id} />
      </div>
    );
  }

  // AI chat view
  if (chatMode === 'ai') {
    return (
      <AIChatComponent onBack={goBack} />
    );
  }

  // Friends list view
  if (chatMode === 'friends') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Chat with Friends
            </CardTitle>
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Start a private conversation with your accepted friends.
          </p>
        </CardHeader>
        <CardContent>
          {isLoadingFriends && (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading friends...</p>
            </div>
          )}

          {!isLoadingFriends && friends.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Friends Yet</h3>
              <p className="text-gray-600 mb-4">
                Add friends to start chatting about food discoveries and recommendations.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/friends'}
              >
                Manage Friends
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setChatMode('manage-friends')}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Find & Add Friends
              </Button>
            </div>
          )}

          {!isLoadingFriends && friends.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend) => (
                <Card 
                  key={friend.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
                  onClick={() => startFriendChat(friend)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {friend.avatar_url ? (
                          <Image
                            src={friend.avatar_url}
                            alt={friend.display_name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {friend.display_name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                        {/* Online status indicator */}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                          friend.is_online ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{friend.display_name}</h3>
                        <p className="text-sm text-gray-600 truncate">@{friend.username}</p>
                        <p className="text-xs text-gray-500">
                          {friend.is_online ? 'Online' : 'Offline'}
                        </p>
                      </div>
                      <MessageCircle className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Main menu view
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Food Chat Hub
        </CardTitle>
        <p className="text-sm text-gray-600">
          Connect with friends and AI food experts to share discoveries and get personalized recommendations.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Friends Chat Option */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-500 group"
            onClick={() => setChatMode('friends')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition-colors">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Chat with Friends</h3>
              <p className="text-gray-600 mb-4">
                Share food discoveries, restaurant recommendations, and plan dining adventures with your friends.
              </p>
              <div className="flex justify-center gap-2">
                <Badge variant="secondary">Private Messages</Badge>
                <Badge variant="secondary">Real-time</Badge>
              </div>
            </CardContent>
          </Card>

          {/* AI Chat Option */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-purple-500 group"
            onClick={() => setChatMode('ai')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-600 transition-colors">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Food Experts</h3>
              <p className="text-gray-600 mb-4">
                Get personalized recommendations from specialized AI masterbots with expertise in different cuisines and dining styles.
              </p>
              <div className="flex justify-center gap-2">
                <Badge variant="secondary">7 Experts</Badge>
                <Badge variant="secondary">Personalized</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Friend Management Option */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-green-500 group"
            onClick={() => setChatMode('manage-friends')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 transition-colors">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Find Friends</h3>
              <p className="text-gray-600 mb-4">
                Search for food enthusiasts, send friend requests, and manage your food network.
              </p>
              <div className="flex justify-center gap-2">
                <Badge variant="secondary">Search Users</Badge>
                <Badge variant="secondary">Send Requests</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature highlights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <MessageCircle className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <h4 className="font-semibold mb-1">Real-time Chat</h4>
            <p className="text-gray-600">Instant messaging with live updates</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Users className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <h4 className="font-semibold mb-1">Friend Network</h4>
            <p className="text-gray-600">Connect with fellow food enthusiasts</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Bot className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <h4 className="font-semibold mb-1">AI Expertise</h4>
            <p className="text-gray-600">Specialized food knowledge at your fingertips</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}