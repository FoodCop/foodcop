'use client';

import React from 'react';
import { MessageCircle, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChatContact } from '../utils/ChatTypes';
import { 
  formatChatTimestamp, 
  truncateMessage, 
  getMessageTypeText,
  getAvatarFallback, 
  getAvatarGradient,
  getUnreadCountText,
  getPlaceholderAvatar 
} from '../utils/ChatUtils';

interface ContactsListProps {
  contacts: ChatContact[];
  onContactClick?: (contact: ChatContact) => void;
  onCameraClick?: () => void;
  className?: string;
  searchQuery?: string;
}

export function ContactsList({ 
  contacts, 
  onContactClick, 
  onCameraClick,
  className = '',
  searchQuery = '' 
}: ContactsListProps) {

  const handleContactClick = (contact: ChatContact) => {
    onContactClick?.(contact);
  };

  const handleCameraClick = () => {
    onCameraClick?.();
  };

  const getMessagePreview = (contact: ChatContact) => {
    const messageTypeText = getMessageTypeText(contact.last_message.type);
    if (messageTypeText) {
      return messageTypeText;
    }
    return truncateMessage(contact.last_message.content, 45);
  };

  // Filter contacts based on search query if provided
  const filteredContacts = searchQuery 
    ? contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : contacts;

  return (
    <div className={`bg-white ${className}`}>
      {/* Contacts List */}
      <div className="divide-y divide-gray-100">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150 active:bg-gray-100"
            onClick={() => handleContactClick(contact)}
          >
            {/* Avatar with Online Status */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={contact.avatar_url || getPlaceholderAvatar(contact.name)} 
                  alt={contact.name}
                />
                <AvatarFallback className={`bg-gradient-to-r ${getAvatarGradient(contact.id)} text-white font-semibold`}>
                  {getAvatarFallback(contact.name)}
                </AvatarFallback>
              </Avatar>
              
              {/* Online Status Indicator */}
              <div 
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                  contact.is_online ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
            </div>

            {/* Contact Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {contact.name}
                  {contact.is_group && contact.group_member_count && (
                    <span className="ml-1 text-xs text-gray-500">
                      ({contact.group_member_count})
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Timestamp */}
                  <span className="text-xs text-gray-500">
                    {formatChatTimestamp(contact.last_message.timestamp)}
                  </span>
                  
                  {/* Read Status for sent messages */}
                  {contact.last_message.sender_id === 'current_user' && (
                    <div className="flex">
                      <svg className="h-3 w-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <svg className="h-3 w-3 text-blue-500 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 truncate">
                  {getMessagePreview(contact)}
                </p>
                
                {/* Unread Count */}
                {contact.unread_count > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-2 h-5 min-w-[20px] rounded-full px-2 text-xs bg-[#FF6B35] hover:bg-[#FF6B35]"
                  >
                    {getUnreadCountText(contact.unread_count)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredContacts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          {searchQuery ? (
            <>
              <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
              <p className="text-gray-600 text-center">
                No contacts match &ldquo;{searchQuery}&rdquo;. Try a different search term.
              </p>
            </>
          ) : (
            <>
              <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-600 text-center mb-4">
                Start a conversation with your friends to see them here.
              </p>
              <Button 
                onClick={handleCameraClick}
                className="bg-gradient-to-r from-[#FF6B35] to-[#F7931E] hover:from-[#FF6B35]/90 hover:to-[#F7931E]/90 text-white"
              >
                <Camera className="h-4 w-4 mr-2" />
                Start a conversation
              </Button>
            </>
          )}
        </div>
      )}

      {/* Floating Camera Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#F7931E] hover:from-[#FF6B35]/90 hover:to-[#F7931E]/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 p-0"
          onClick={handleCameraClick}
        >
          <Camera className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}