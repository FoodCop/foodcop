'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import SharedContentRenderer from './sharing/SharedContentRenderer';
import {
  MoreHorizontal,
  Crown,
  Shield,
  UserMinus,
  UserPlus,
  Volume2,
  VolumeX,
  Info,
  Users,
  MessageSquare,
  Phone,
  Video,
  Search,
  Settings,
  Send,
  Paperclip,
  Smile,
} from 'lucide-react';

// Local interfaces for group chat
interface ChatUser {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
  email: string;
  is_online: boolean;
  last_seen: string;
  status_message?: string;
  privacy_settings: {
    show_online_status: boolean;
    show_last_seen: boolean;
    show_read_receipts: boolean;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  type: 'text' | 'image' | 'voice' | 'video' | 'file' | 'restaurant' | 'recipe';
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  reply_to?: string;
  media_url?: string;
  // Shared content data
  restaurant_data?: {
    id: string;
    name: string;
    address: string;
    rating: number;
    priceLevel: number;
    cuisine: string;
    photoUrl?: string;
    phone?: string;
    website?: string;
  };
  recipe_data?: {
    id: string;
    title: string;
    description: string;
    totalTime: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    servings: number;
    imageUrl?: string;
    ingredients: string[];
    tags: string[];
  };
}

interface GroupChatInterfaceProps {
  groupId: string;
  groupName: string;
  groupAvatar?: string;
  groupDescription?: string;
  members: GroupMember[];
  messages: Message[];
  currentUserId: string;
  onSendMessage?: (content: string, type: Message['type']) => void;
  onAddMember?: () => void;
  onRemoveMember?: (memberId: string) => void;
  onPromoteToAdmin?: (memberId: string) => void;
  onDemoteFromAdmin?: (memberId: string) => void;
  onMuteGroup?: () => void;
  onLeaveGroup?: () => void;
  onOpenGroupSettings?: () => void;
  onStartGroupCall?: (type: 'voice' | 'video') => void;
}

interface GroupMember extends ChatUser {
  role: 'admin' | 'member';
  joined_at: string;
  added_by?: string;
}

interface TypingUser {
  id: string;
  name: string;
}

export function GroupChatInterface({
  groupId,
  groupName,
  groupAvatar,
  groupDescription,
  members,
  messages,
  currentUserId,
  onSendMessage,
  onAddMember,
  onRemoveMember,
  onPromoteToAdmin,
  onDemoteFromAdmin,
  onMuteGroup,
  onLeaveGroup,
  onOpenGroupSettings,
  onStartGroupCall,
}: GroupChatInterfaceProps) {
  const [showMemberList, setShowMemberList] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  const currentUser = members.find(m => m.id === currentUserId);
  const isCurrentUserAdmin = currentUser?.role === 'admin';
  const onlineMembers = members.filter(m => m.is_online);
  const adminMembers = members.filter(m => m.role === 'admin');

  // Mock typing users for demo
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random typing activity
      if (Math.random() > 0.8) {
        const randomMember = members[Math.floor(Math.random() * members.length)];
        if (randomMember.id !== currentUserId) {
          setTypingUsers([{ id: randomMember.id, name: randomMember.display_name }]);
          setTimeout(() => setTypingUsers([]), 3000);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [members, currentUserId]);

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    onMuteGroup?.();
  };

  const formatMemberCount = () => {
    const total = members.length;
    const online = onlineMembers.length;
    return `${total} members, ${online} online`;
  };

  const MemberListItem = ({ member }: { member: GroupMember }) => {
    const canManageMember = isCurrentUserAdmin && member.id !== currentUserId;
    
    return (
      <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.avatar_url} alt={member.display_name} />
              <AvatarFallback>
                {member.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {member.is_online && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-900">{member.display_name}</h4>
              {member.role === 'admin' && (
                <Crown className="h-4 w-4 text-yellow-600" />
              )}
              {member.id === currentUserId && (
                <Badge variant="secondary" className="text-xs">You</Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">@{member.username}</p>
          </div>
        </div>

        {canManageMember && (
          <div className="flex items-center space-x-1">
            {member.role === 'admin' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDemoteFromAdmin?.(member.id)}
                className="text-orange-600 hover:text-orange-700"
              >
                <Crown className="h-4 w-4 mr-1" />
                Remove Admin
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPromoteToAdmin?.(member.id)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Crown className="h-4 w-4 mr-1" />
                Make Admin
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveMember?.(member.id)}
              className="text-red-600 hover:text-red-700"
            >
              <UserMinus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Group Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {groupAvatar ? (
              <Image
                src={groupAvatar}
                alt={groupName}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="font-semibold text-gray-900 truncate">{groupName}</h1>
              {isMuted && <VolumeX className="h-4 w-4 text-gray-400" />}
            </div>
            <button
              onClick={() => setShowMemberList(!showMemberList)}
              className="text-sm text-gray-500 hover:text-gray-700 truncate text-left"
            >
              {formatMemberCount()}
            </button>
            {groupDescription && (
              <p className="text-xs text-gray-400 truncate">{groupDescription}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStartGroupCall?.('voice')}
            className="p-2"
          >
            <Phone className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStartGroupCall?.('video')}
            className="p-2"
          >
            <Video className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMemberList(!showMemberList)}
            className="p-2"
          >
            <Info className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenGroupSettings}
            className="p-2"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
              const sender = members.find(m => m.id === message.sender_id);
              const isOwn = message.sender_id === currentUserId;
              
              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} space-x-2`}>
                  {!isOwn && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={sender?.avatar_url} alt={sender?.display_name} />
                      <AvatarFallback className="text-xs">
                        {sender?.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {!isOwn && (
                      <p className="text-xs text-gray-500 mb-1">{sender?.display_name}</p>
                    )}
                    
                    {/* Render shared content if it's a restaurant or recipe message */}
                    {(message.type === 'restaurant' || message.type === 'recipe') ? (
                      <div className="bg-white rounded-lg p-2 mb-2">
                        <SharedContentRenderer 
                          message={message}
                          onSaveToPlate={(content) => console.log('Save to plate:', content)}
                          onViewDetails={(content) => console.log('View details:', content)}
                          onGetDirections={(restaurant) => console.log('Get directions:', restaurant)}
                        />
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    
                    <p className={`text-xs mt-1 ${isOwn ? 'text-orange-100' : 'text-gray-500'}`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start space-x-2">
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">
                      {typingUsers.map(u => u.name).join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t bg-white p-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="p-2">
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <Input
                placeholder={`Message ${groupName}...`}
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    onSendMessage?.(e.currentTarget.value.trim(), 'text');
                    e.currentTarget.value = '';
                  }
                }}
              />
              
              <Button variant="ghost" size="sm" className="p-2">
                <Smile className="h-4 w-4" />
              </Button>
              
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 p-2"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Member List Sidebar */}
        {showMemberList && (
          <div className="w-80 border-l bg-gray-50 flex flex-col">
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Group Members</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMemberList(false)}
                  className="p-1"
                >
                  ×
                </Button>
              </div>
              
              {isCurrentUserAdmin && (
                <Button
                  onClick={onAddMember}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  size="sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Members
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Admins Section */}
              {adminMembers.length > 0 && (
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                    <Crown className="h-4 w-4 mr-1 text-yellow-600" />
                    Admins ({adminMembers.length})
                  </h4>
                  <div className="space-y-1">
                    {adminMembers.map((member) => (
                      <MemberListItem key={`admin-${member.id}`} member={member} />
                    ))}
                  </div>
                </div>
              )}

              {/* All Members Section */}
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  All Members ({members.length})
                </h4>
                <div className="space-y-1">
                  {members.map((member) => (
                    <MemberListItem key={member.id} member={member} />
                  ))}
                </div>
              </div>

              {/* Group Actions */}
              <div className="p-4 border-t bg-white space-y-2">
                <Button
                  variant="outline"
                  onClick={handleMuteToggle}
                  className="w-full justify-start"
                  size="sm"
                >
                  {isMuted ? (
                    <>
                      <Volume2 className="h-4 w-4 mr-2" />
                      Unmute Group
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-4 w-4 mr-2" />
                      Mute Group
                    </>
                  )}
                </Button>
                
                {isCurrentUserAdmin && (
                  <Button
                    variant="outline"
                    onClick={onOpenGroupSettings}
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Group Settings
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={onLeaveGroup}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  size="sm"
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Leave Group
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Online Members Quick View */}
      {!showMemberList && onlineMembers.length > 0 && (
        <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg border p-3 max-w-xs">
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            Online Now ({onlineMembers.length})
          </h4>
          <div className="flex -space-x-2">
            {onlineMembers.slice(0, 8).map((member) => (
              <div key={member.id} className="relative">
                <Avatar className="h-8 w-8 border-2 border-white">
                  <AvatarImage src={member.avatar_url} alt={member.display_name} />
                  <AvatarFallback className="text-xs">
                    {member.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              </div>
            ))}
            {onlineMembers.length > 8 && (
              <div className="h-8 w-8 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  +{onlineMembers.length - 8}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}