'use client';

import { useState, useEffect } from 'react';
import { X, MessageCircle, UserPlus, Users } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '../ui/drawer';
import { Button } from '../ui/button';
import { useDMChatStore } from '../../stores/chatStore';
import { DMConversation, SharedItem, DMChatService } from '../../services/dmChatService';
import { ConversationList } from './ConversationList';
import { ChatThread } from './ChatThread';
import { FriendFinder } from '../friends/FriendFinder';
import { FriendRequestList } from '../friends/FriendRequestList';
import { MessageRequestList } from './MessageRequestList';
import { UserProfileView } from '../friends/UserProfileView';
import { UserDiscoveryModal } from './UserDiscoveryModal';
import { useAuthStore } from '../../stores/authStore';

interface ChatDrawerProps {
  onSharedItemClick?: (item: SharedItem) => void;
}

type ViewType = 'messages' | 'find-friends' | 'requests' | 'message-requests' | 'profile';

export function ChatDrawer({ onSharedItemClick }: Readonly<ChatDrawerProps>) {
  const { isOpen, closeChat } = useDMChatStore();
  const { user } = useAuthStore();
  const { startConversation } = useDMChatStore();
  const [selectedConversation, setSelectedConversation] =
    useState<DMConversation | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('messages');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  // Load pending request count
  useEffect(() => {
    if (user?.id && isOpen) {
      const loadCount = async () => {
        const result = await DMChatService.fetchPendingRequests(user.id);
        if (result.success && result.data) {
          setPendingRequestCount(result.data.length);
        }
      };
      loadCount();
    }
  }, [user?.id, isOpen]);

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
        {(() => {
          if (selectedConversation) {
            return (
              <ChatThread
                conversation={selectedConversation}
                onBack={handleBack}
                onSharedItemClick={onSharedItemClick}
              />
            );
          }
          
          if (selectedUserId) {
            return (
              <UserProfileView
                userId={selectedUserId}
                onBack={handleBack}
                onStartConversation={handleStartConversation}
              />
            );
          }
          
          return (
            <>
              <DrawerHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentView === 'messages' && <MessageCircle className="h-5 w-5 text-fuzo-orange-500" />}
                  {currentView === 'find-friends' && <UserPlus className="h-5 w-5 text-fuzo-orange-500" />}
                  {currentView === 'requests' && <Users className="h-5 w-5 text-fuzo-orange-500" />}
                  {currentView === 'message-requests' && <MessageCircle className="h-5 w-5 text-fuzo-orange-500" />}
                  <DrawerTitle>
                    {currentView === 'messages' && 'Messages'}
                    {currentView === 'find-friends' && 'Find Friends'}
                    {currentView === 'requests' && 'Friend Requests'}
                    {currentView === 'message-requests' && 'Message Requests'}
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
                className={`flex-1 py-3 text-sm font-medium transition-colors ${currentView === 'messages'
                  ? 'text-fuzo-orange-500 border-b-2 border-fuzo-orange-500'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Messages
              </button>
              <button
                onClick={() => setCurrentView('message-requests')}
                className={`flex-1 py-3 text-sm font-medium transition-colors relative ${currentView === 'message-requests'
                  ? 'text-fuzo-orange-500 border-b-2 border-fuzo-orange-500'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Requests
                {pendingRequestCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-fuzo-orange-500 text-white text-xs font-bold rounded-full">
                    {pendingRequestCount > 9 ? '9+' : pendingRequestCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCurrentView('find-friends')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${currentView === 'find-friends'
                  ? 'text-fuzo-orange-500 border-b-2 border-fuzo-orange-500'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Find Friends
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {currentView === 'messages' && (
                <ConversationList
                  onSelectConversation={setSelectedConversation}
                />
              )}
              {currentView === 'find-friends' && (
                <div className="p-4">
                  <Button
                    onClick={() => setIsDiscoveryModalOpen(true)}
                    className="w-full bg-fuzo-orange-500 hover:bg-fuzo-orange-600 mb-4"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Find People to Message
                  </Button>
                  <FriendFinder
                    onUserClick={handleUserClick}
                    onStartConversation={handleStartConversation}
                  />
                </div>
              )}
              {currentView === 'message-requests' && (
                <MessageRequestList
                  onAccept={(conversation) => {
                    // After accepting, optionally open the conversation
                    // setSelectedConversation(conversation);
                  }}
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
          );
        })()}
      </DrawerContent>

      {/* User Discovery Modal */}
      <UserDiscoveryModal
        isOpen={isDiscoveryModalOpen}
        onClose={() => setIsDiscoveryModalOpen(false)}
      />
    </Drawer>
  );
}

export default ChatDrawer;

