'use client';

import React from 'react';
import { ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatContact } from '../utils/ChatTypes';
import { getAvatarFallback, getAvatarGradient, formatLastSeen, getPlaceholderAvatar } from '../utils/ChatUtils';

interface ChatConversationHeaderProps {
  contact: ChatContact;
  currentTab: 'CHAT' | 'GALLERY' | 'ABOUT';
  onTabChange: (tab: 'CHAT' | 'GALLERY' | 'ABOUT') => void;
  onBack: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onMore?: () => void;
  className?: string;
}

export function ChatConversationHeader({
  contact,
  currentTab,
  onTabChange,
  onBack,
  onCall,
  onVideoCall,
  onMore,
  className = ''
}: ChatConversationHeaderProps) {
  
  const handleTabClick = (tab: 'CHAT' | 'GALLERY' | 'ABOUT') => {
    onTabChange(tab);
  };

  return (
    <div className={`bg-gradient-to-r from-[#FF6B35] to-[#F7931E] ${className}`}>
      {/* Header Section */}
      <div className="flex items-center justify-between p-4">
        {/* Left side - Back button and contact info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-full hover:bg-white/20 p-0 text-white"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Contact Avatar */}
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={contact.avatar_url || getPlaceholderAvatar(contact.name)} 
                alt={contact.name}
              />
              <AvatarFallback className={`bg-gradient-to-r ${getAvatarGradient(contact.id)} text-white font-semibold text-sm`}>
                {getAvatarFallback(contact.name)}
              </AvatarFallback>
            </Avatar>
            {/* Online Status */}
            <div 
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                contact.is_online ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
          </div>

          {/* Contact Info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-white truncate">
              {contact.name}
              {contact.is_group && contact.group_member_count && (
                <span className="ml-1 text-sm font-normal opacity-90">
                  ({contact.group_member_count} members)
                </span>
              )}
            </h1>
            <p className="text-xs text-white/80 truncate">
              {contact.is_online 
                ? 'Online' 
                : `Last seen ${formatLastSeen(contact.last_seen)}`
              }
            </p>
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-full hover:bg-white/20 p-0 text-white"
            onClick={onCall}
          >
            <Phone className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-full hover:bg-white/20 p-0 text-white"
            onClick={onVideoCall}
          >
            <Video className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-full hover:bg-white/20 p-0 text-white"
            onClick={onMore}
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="px-4 pb-2">
        <div className="flex gap-6">
          {(['CHAT', 'GALLERY', 'ABOUT'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
                currentTab === tab
                  ? 'text-white'
                  : 'text-white/70 hover:text-white/90'
              }`}
            >
              {tab}
              {currentTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
              {tab === 'GALLERY' && (
                <Badge 
                  variant="secondary" 
                  className="ml-1 h-4 min-w-[16px] px-1 text-xs bg-white/20 text-white border-0"
                >
                  12
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}