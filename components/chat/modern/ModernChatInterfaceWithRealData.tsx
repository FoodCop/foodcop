'use client';

import React from 'react';
import { ChatAuthProvider } from './integration/ChatAuthProvider';
import { RealDataChatInterface } from './integration/RealDataChatInterfaceSimple';
import { ChatContact, UserStory } from './utils/ChatTypes';

interface ModernChatInterfaceRealDataProps {
  onContactClick?: (contact: ChatContact) => void;
  onStoryClick?: (story: UserStory) => void;
  onNewContact?: () => void;
  onNewGroup?: () => void;
  onCamera?: () => void;
  className?: string;
}

export function ModernChatInterfaceRealData(props: ModernChatInterfaceRealDataProps) {
  return (
    <ChatAuthProvider>
      <RealDataChatInterface {...props} />
    </ChatAuthProvider>
  );
}