'use client';

import { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
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

interface ChatDrawerProps {
  onSharedItemClick?: (item: SharedItem) => void;
}

export function ChatDrawer({ onSharedItemClick }: ChatDrawerProps) {
  const { isOpen, closeChat } = useDMChatStore();
  const [selectedConversation, setSelectedConversation] =
    useState<DMConversation | null>(null);

  const handleClose = () => {
    setSelectedConversation(null);
    closeChat();
  };

  const handleBack = () => {
    setSelectedConversation(null);
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
        ) : (
          <>
            <DrawerHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-orange-500" />
                  <DrawerTitle>Messages</DrawerTitle>
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
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                onSelectConversation={setSelectedConversation}
              />
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

export default ChatDrawer;

