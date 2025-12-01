'use client';

import { useState } from 'react';
import { X, MessageCircle, UserPlus, Users } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '../ui/drawer';
import { Button } from '../ui/button';
import { useDMChatStore } from '../../stores/chatStore';
import { DMConversation, SharedItem } from '../../services/dmChatService';
import { ConversationList } from './ConversationList';
import { ChatThread } from './ChatThread';
import { FriendFinder } from '../friends/FriendFinder';
import { FriendRequestList } from '../friends/FriendRequestList';
import { UserProfileView } from '../friends/UserProfileView';
import { useAuthStore } from '../../stores/authStore';

interface ChatDrawerProps {
  onSharedItemClick?: (item: SharedItem) => void;
}

type ViewType = 'messages' | 'find-friends' | 'requests' | 'profile';

export function ChatDrawer({ onSharedItemClick }: ChatDrawerProps) {
  const { isOpen, closeChat } = useDMChatStore();
  const { user } = useAuthStore();
  const { startConversation } = useDMChatStore();
  const [selectedConversation, setSelectedConversation] =
    useState<DMConversation | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('messages');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleClose = () => {
    setSelectedConversation(null);
    setCurrentView('messages');
    setSelectedUserId(null);
    closeChat();
  };

  const handleBack = () => {
    if (selectedUserId) {
      setSelectedUserId(null);
      setCurrentView('find-friends');
    } else {
      setSelectedConversation(null);
      setCurrentView('messages');
    }
  };

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentView('profile');
  };

  const handleStartConversation = async (userId: string) => {
    if (!user?.id) return;

    const conversationId = await startConversation(user.id, userId);
    if (conversationId) {
      // Load conversations to refresh the list
      const { loadConversations } = useDMChatStore.getState();
      await loadConversations(user.id);
      // Switch to messages view to show the new conversation
      setCurrentView('messages');
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()} direction="right">
      <DrawerContent className="h-full w-full sm:max-w-md">
        {selectedConversation ? (
          <ChatThread
            conversation={selectedConversation}
            onBack={handleBack}
            onSharedItemClick={onSharedItemClick}
          />
        ) : selectedUserId ? (
          <UserProfileView
            userId={selectedUserId}
            onBack={handleBack}
            onStartConversation={handleStartConversation}
          />
        ) : (
          <>
            <DrawerHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentView === 'messages' && <MessageCircle className="h-5 w-5 text-orange-500" />}
                  {currentView === 'find-friends' && <UserPlus className="h-5 w-5 text-orange-500" />}
                  {currentView === 'requests' && <Users className="h-5 w-5 text-orange-500" />}
                  <DrawerTitle>
                    {currentView === 'messages' && 'Messages'}
                    {currentView === 'find-friends' && 'Find Friends'}
                    {currentView === 'requests' && 'Friend Requests'}
                  </DrawerTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DrawerHeader>

            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setCurrentView('messages')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  currentView === 'messages'
                    ? 'text-orange-500 border-b-2 border-orange-500'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Messages
              </button>
              <button
                onClick={() => setCurrentView('find-friends')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  currentView === 'find-friends'
                    ? 'text-orange-500 border-b-2 border-orange-500'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Find Friends
              </button>
              <button
                onClick={() => setCurrentView('requests')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  currentView === 'requests'
                    ? 'text-orange-500 border-b-2 border-orange-500'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Requests
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {currentView === 'messages' && (
                <ConversationList
                  onSelectConversation={setSelectedConversation}
                />
              )}
              {currentView === 'find-friends' && (
                <FriendFinder
                  onUserClick={handleUserClick}
                  onStartConversation={handleStartConversation}
                />
              )}
              {currentView === 'requests' && (
                <FriendRequestList
                  onUserClick={handleUserClick}
                  onStartConversation={handleStartConversation}
                />
              )}
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

export default ChatDrawer;

