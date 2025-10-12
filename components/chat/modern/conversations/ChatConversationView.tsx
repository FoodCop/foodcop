'use client';

import React, { useState, useCallback } from 'react';
import { ChatConversationHeader } from '../headers/ChatConversationHeader';
import { MessagesList } from '../messages/MessagesList';
import { MessageInput } from '../messages/MessageInput';
import { Message, ChatContact, Conversation, ConversationTab } from '../utils/ChatTypes';

interface ChatConversationViewProps {
  conversation: Conversation;
  currentUser: ChatContact;
  otherUser: ChatContact;
  messages: Message[];
  isTyping?: boolean;
  typingUser?: string;
  onBack: () => void;
  onSendMessage: (content: string, type: 'text' | 'image' | 'voice' | 'video' | 'file') => void;
  onReaction?: (messageId: string, reaction: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onViewProfile?: () => void;
  onBlockUser?: () => void;
  onDeleteConversation?: () => void;
  onMuteConversation?: () => void;
  className?: string;
}

export function ChatConversationView({
  conversation,
  currentUser,
  otherUser,
  messages,
  isTyping = false,
  typingUser,
  onBack,
  onSendMessage,
  onReaction,
  onTypingStart,
  onTypingStop,
  onVoiceCall,
  onVideoCall,
  onViewProfile,
  onBlockUser,
  onDeleteConversation,
  onMuteConversation,
  className = ''
}: ChatConversationViewProps) {
  const [activeTab, setActiveTab] = useState<ConversationTab>('CHAT');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSendMessage = useCallback((content: string, type: 'text' | 'image' | 'voice' | 'video' | 'file') => {
    onSendMessage(content, type);
  }, [onSendMessage]);

  const handleReaction = useCallback((messageId: string, reaction: string) => {
    onReaction?.(messageId, reaction);
  }, [onReaction]);

  const handleAttachment = useCallback(() => {
    // TODO: Implement attachment picker
    console.log('Opening attachment picker...');
  }, []);

  const handleVoiceRecord = useCallback(() => {
    // TODO: Implement voice recording
    console.log('Starting voice recording...');
  }, []);

  const handleEmojiPicker = useCallback(() => {
    // TODO: Implement emoji picker
    console.log('Opening emoji picker...');
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'CHAT':
        return (
          <div className="flex flex-col h-full">
            {/* Messages Area */}
            <MessagesList
              messages={messages}
              currentUser={currentUser}
              otherUser={otherUser}
              isTyping={isTyping}
              typingUser={typingUser}
              onReaction={handleReaction}
              className="flex-1"
            />
            
            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              onTypingStart={onTypingStart}
              onTypingStop={onTypingStop}
              onAttachment={handleAttachment}
              onVoiceRecord={handleVoiceRecord}
              onEmojiPicker={handleEmojiPicker}
              placeholder={`Message ${otherUser.name}`}
            />
          </div>
        );
      
      case 'GALLERY':
        return (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">🖼️</div>
              <p className="text-lg font-medium mb-2">Media Gallery</p>
              <p className="text-sm">Photos and videos shared in this chat</p>
              <p className="text-xs mt-4 text-gray-400">Coming soon...</p>
            </div>
          </div>
        );
      
      case 'ABOUT':
        return (
          <div className="flex-1 p-6 bg-gray-50">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#F7931E] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {otherUser.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{otherUser.name}</h2>
                <p className="text-gray-500">Active user</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Status</span>
                  <span className="text-gray-900">{otherUser.is_online ? 'Online' : 'Offline'}</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Last seen</span>
                  <span className="text-gray-900">{otherUser.last_seen || 'Recently'}</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Close friend</span>
                  <span className="text-gray-900">No</span>
                </div>
              </div>
              
              <div className="mt-8 space-y-3">
                <button 
                  onClick={onViewProfile}
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
                >
                  View Profile
                </button>
                
                <button 
                  onClick={onMuteConversation}
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
                >
                  Mute Conversation
                </button>
                
                <button 
                  onClick={onBlockUser}
                  className="w-full py-3 px-4 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 font-medium transition-colors"
                >
                  Block User
                </button>
                
                <button 
                  onClick={onDeleteConversation}
                  className="w-full py-3 px-4 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 font-medium transition-colors"
                >
                  Delete Conversation
                </button>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <ChatConversationHeader
        contact={otherUser}
        currentTab={activeTab}
        onTabChange={setActiveTab}
        onBack={onBack}
        onCall={onVoiceCall}
        onVideoCall={onVideoCall}
        onMore={() => setIsMenuOpen(!isMenuOpen)}
      />
      
      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}