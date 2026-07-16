'use client';

import { useState } from 'react';
import { ChatView } from '../../../components/chat/ChatView';
import { useAuth } from '../../../components/auth/AuthProvider';
import type { ChatInboxItem } from '../../../types/chatUi';
import type { AuthUser } from '../../../types/auth';
import type { AppItem } from '../../../types/appItem';

const MOCK_FRIENDS: ChatInboxItem[] = [
  {
    id: 'friend-1',
    type: 'dm',
    name: 'Chef Mario',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80',
    online: true,
    time: '2m ago',
    unreadCount: 2
  },
  {
    id: 'friend-2',
    type: 'dm',
    name: 'Sarah Culinary',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
    online: false,
    lastSeen: '1h ago',
    unreadCount: 0
  },
  {
    id: 'group-1',
    type: 'group',
    name: 'Weekend Foodies',
    avatar: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=150&q=80',
    lastMessageAt: '5m ago',
    unreadCount: 5
  }
];

export default function MessagesPage() {
  const { user } = useAuth();
  
  if (!user) {
    return <div className="p-4 text-center">Loading or not authenticated...</div>;
  }

  // Cast Supabase user to our AuthUser type shape for ChatView
  const authUser: AuthUser = {
    id: user.id,
    email: user.email || '',
    user_metadata: user.user_metadata
  };

  return (
    <div style={{ height: 'calc(100vh - 70px)' }} className="w-full">
      <ChatView
        friends={MOCK_FRIENDS}
        authUser={authUser}
        onSave={(item: AppItem) => console.log('Save', item)}
        onShareRequest={(item: AppItem) => console.log('Share', item)}
        setTab={(tab: string) => console.log('Set tab', tab)}
        onConversationOpened={(id: string) => console.log('Opened', id)}
        onOpenUserProfile={(id: string) => console.log('Profile', id)}
      />
    </div>
  );
}
