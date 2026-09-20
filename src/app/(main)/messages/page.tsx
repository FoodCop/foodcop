'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatView } from '@/components/chat/ChatView';
import SecureMessagingGate from '@/components/chat/SecureMessagingGate';
import { useAuth } from '@/components/auth/AuthProvider';
import { E2ee, type E2eeStatus } from '@/lib/chat/e2ee';
import { PlateService, type PlateItemType } from '@/lib/services/plateService';
import { UserSettingsService, DEFAULT_USER_SETTINGS, type UserSettings } from '@/lib/services/userSettingsService';
import type { AuthUser } from '@/types/auth';
import type { AppItem } from '@/types/appItem';

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
    <Suspense fallback={<div className="fz-chat-loading">Loading messages…</div>}>
      <MessagesPageContent />
    </Suspense>
  );
}

function MessagesPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialUserId, setInitialUserId] = useState<string | null>(() => searchParams.get('userId'));
  const [status, setStatus] = useState<E2eeStatus | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const userId = user?.id;

  // Is this device holding the user's chat key? (drives the setup / unlock screen)
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    E2ee.getStatus(userId).then((s) => { if (!cancelled) setStatus(s); });
    UserSettingsService.get().then((r) => { if (!cancelled) setSettings(r.success && r.data ? r.data : DEFAULT_USER_SETTINGS); });
    return () => { cancelled = true; };
  }, [userId]);

  if (!user) return <div className="fz-chat-loading">Loading messages…</div>;
  if (status === null || settings === null) return <div className="fz-chat-loading">Loading messages…</div>;

  if (status !== 'ready') {
    return <SecureMessagingGate userId={user.id} status={status} onReady={() => setStatus('ready')} />;
  }

  const authUser: AuthUser = { id: user.id, email: user.email || '', user_metadata: user.user_metadata };

  return (
    <div className="fz-chat-page">
      <ChatView
        authUser={authUser}
        showOnlineStatus={settings.showOnlineStatus}
        sendReadReceipts={settings.sendReadReceipts}
        notifyMessages={settings.notifyMessages}
        initialUserId={initialUserId}
        onClearInitial={() => setInitialUserId(null)}
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
        onOpenUserProfile={(id: string) => router.push(`/profile/${id}`)}
      />
    </div>
  );
}
