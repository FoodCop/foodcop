'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatView } from '../../../components/chat/ChatView';
import { useAuth } from '../../../components/auth/AuthProvider';
import { ChatService, type ChatGroup as ChatGroupRecord } from '../../../lib/services/chatService';
import { FriendRequestService } from '../../../lib/services/friendRequestService';
import { PlateService, type PlateItemType } from '../../../lib/services/plateService';
import type { ChatInboxItem, ChatFriend, ChatGroup as ChatGroupUi } from '../../../types/chatUi';
import type { AuthUser } from '../../../types/auth';
import type { AppItem } from '../../../types/appItem';

const GROUP_FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=150&q=80';

const toChatGroupUi = (group: ChatGroupRecord): ChatGroupUi => ({
  id: group.id,
  name: group.name,
  avatar: group.avatarUrl || GROUP_FALLBACK_AVATAR,
  description: group.description,
  lastMessageAt: group.lastMessageAt,
  unreadCount: 0,
  type: 'group',
});

const mapPlateItemType = (item: AppItem): PlateItemType => {
  const type = (item.itemType || item.type || '').toLowerCase();
  if (type.includes('recipe')) return 'recipe';
  if (type.includes('video')) return 'video';
  if (type.includes('restaurant') || type.includes('cafe') || type.includes('spot')) return 'restaurant';
  return 'other';
};

const TAB_ROUTES: Record<string, string> = {
  bites: '/discover',
  trims: '/trims',
  scout: '/scout',
};

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading conversations...</div>}>
      <MessagesPageContent />
    </Suspense>
  );
}

function MessagesPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [friends, setFriends] = useState<ChatInboxItem[] | null>(null);
  const [pendingOpen, setPendingOpen] = useState<{ id: string; type: 'dm' | 'group' } | null>(null);

  useEffect(() => {
    const targetUserId = searchParams.get('userId');
    if (targetUserId) {
      setPendingOpen({ id: targetUserId, type: 'dm' });
    }
    // Only meant to seed the initial open from a deep link - not to
    // re-trigger every time the URL changes for unrelated reasons.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      const [contactsResult, groupsResult] = await Promise.all([
        ChatService.listContacts(user.id),
        ChatService.listGroups(user.id),
      ]);

      const contacts = contactsResult.success ? contactsResult.data ?? [] : [];
      const groups = groupsResult.success ? groupsResult.data ?? [] : [];

      const relationships = contacts.length
        ? await FriendRequestService.getRelationshipsForUsers(user.id, contacts.map((c) => c.id))
        : null;
      const relMap = relationships?.success ? relationships.data ?? {} : {};

      if (cancelled) return;

      const dmItems: ChatFriend[] = contacts.map((contact) => {
        const relationship = relMap[contact.id];
        return {
          id: contact.id,
          name: contact.name,
          avatar: contact.avatar,
          username: contact.username,
          email: contact.email,
          online: contact.isOnline,
          lastSeen: contact.lastSeen,
          unreadCount: 0,
          requestStatus: relationship?.state ?? 'none',
          requestId: relationship?.request?.id,
          type: 'dm',
        };
      });

      const groupItems: ChatGroupUi[] = groups.map(toChatGroupUi);

      setFriends([...groupItems, ...dmItems]);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !friends) return;

    const unsubscribe = ChatService.subscribeToIncomingMessages(user.id, ({ message, otherUserId }) => {
      if (document.visibilityState === 'visible' && document.hasFocus()) return;
      if (globalThis.Notification === undefined || globalThis.Notification.permission !== 'granted') return;

      const contact = friends.find((f) => f.type === 'dm' && String(f.id) === otherUserId) as ChatFriend | undefined;
      const notification = new Notification(contact?.name || 'New message', {
        body: message.content || 'Sent you something',
        icon: contact?.avatar,
      });
      notification.onclick = () => {
        window.focus();
        setPendingOpen({ id: otherUserId, type: 'dm' });
        notification.close();
      };
    });

    return unsubscribe;
  }, [user?.id, friends]);

  if (!user) {
    return <div className="p-4 text-center">Loading or not authenticated...</div>;
  }

  if (!friends) {
    return <div className="p-4 text-center">Loading conversations...</div>;
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email || '',
    user_metadata: user.user_metadata,
  };

  return (
    <div style={{ height: 'calc(100dvh - 70px)' }} className="w-full">
      <ChatView
        friends={friends}
        authUser={authUser}
        onSave={(item: AppItem) => {
          const itemId = item.id || item.itemId;
          if (!itemId) return;
          PlateService.saveToPlate({
            itemId,
            itemType: mapPlateItemType(item),
            metadata: item as unknown as Record<string, unknown>,
          });
        }}
        // No share-target picker exists outside chat itself yet - deliberately a no-op.
        onShareRequest={() => {}}
        setTab={(tab: string) => router.push(TAB_ROUTES[tab] || '/discover')}
        // No unread-tracking table exists yet - deliberately a no-op.
        onConversationOpened={() => {}}
        onOpenUserProfile={(userId: string) => router.push(`/profile/${userId}`)}
        onGroupCreated={(group) => setFriends((prev) => [toChatGroupUi(group), ...(prev ?? [])])}
        initialActiveId={pendingOpen?.id}
        initialActiveType={pendingOpen?.type}
        onClearInitial={() => setPendingOpen(null)}
      />
    </div>
  );
}
