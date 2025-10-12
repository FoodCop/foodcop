'use client';

import React from 'react';
import { ChatAuthProvider } from './integration/ChatAuthProvider';
import { RealDataChatInterface } from './integration/RealDataChatInterface';
import { ChatContact, UserStory } from './utils/ChatTypes';

interface ModernChatInterfaceProps {
  onContactClick?: (contact: ChatContact) => void;
  onStoryClick?: (story: UserStory) => void;
  onNewContact?: () => void;
  onNewGroup?: () => void;
  onCamera?: () => void;
  className?: string;
}

export function ModernChatInterface(props: ModernChatInterfaceProps) {
  return (
    <ChatAuthProvider>
      <RealDataChatInterface {...props} />
    </ChatAuthProvider>
  );
}