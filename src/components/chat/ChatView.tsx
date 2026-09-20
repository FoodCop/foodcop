'use client';

/**
 * CHAT - orchestrator for /messages.
 *
 * Owns the data: inbox (real last message + unread from get_chat_inbox), friends,
 * follow requests, blocks, the open thread's messages, realtime updates, typing,
 * presence and read receipts. ChatInbox / ChatThread / NewChatModal are purely
 * presentational. Every message is end-to-end encrypted by ChatService before it
 * leaves the browser and decrypted here after it arrives.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquareLock, SquarePen } from 'lucide-react';
import {
  ChatService,
  previewOfMessage,
  type ChatContact,
  type ChatGroup,
  type GroupMember,
  type IncomingRequest,
  type InboxThread,
  type ReportReason,
} from '@/lib/services/chatService';
import { FriendRequestService } from '@/lib/services/friendRequestService';
import { foodCardService } from '@/lib/services/foodCardService';
import type { FoodCardRecord } from '@/lib/types/foodCard';
import FoodCardDetailModal from '@/components/profile/FoodCardDetailModal';
import { createClient } from '@/lib/supabase/client';
import type { AuthUser } from '@/types/auth';
import type { AppItem } from '@/types/appItem';
import ChatInbox, { threadKey } from './ChatInbox';
import ChatThread, { DialogShell, type UiMessage } from './ChatThread';
import NewChatModal from './NewChatModal';

const TYPING_EXPIRY_MS = 4000;
const PEER_READ_POLL_MS = 10_000;

const errorNotice = (code: string | undefined, message: string | undefined) => {
  if (code === 'not-ready') return 'Secure messaging is locked on this device. Reload the page to unlock it.';
  if (code === 'peer-not-ready') return 'They haven’t turned on secure messaging yet.';
  return message || 'Couldn’t send that message. Please try again.';
};

export const ChatView = ({
  authUser,
  showOnlineStatus,
  sendReadReceipts,
  notifyMessages,
  initialUserId,
  onClearInitial,
  onSave,
  onShareRequest,
  setTab,
  onOpenUserProfile,
}: {
  authUser: AuthUser;
  showOnlineStatus: boolean;
  sendReadReceipts: boolean;
  notifyMessages: boolean;
  initialUserId?: string | null;
  onClearInitial?: () => void;
  onSave: (item: AppItem) => void;
  onShareRequest: (item: AppItem) => void;
  setTab: (tab: string) => void;
  onOpenUserProfile: (userId: string) => void;
}) => {
  const userId = authUser.id;

  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [friends, setFriends] = useState<ChatContact[]>([]);
  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [isLoadingInbox, setIsLoadingInbox] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [peerReady, setPeerReady] = useState<boolean | null>(null);
  const [peerReadAt, setPeerReadAt] = useState<string | null>(null);
  const [typingIds, setTypingIds] = useState<Set<string>>(new Set());
  const [sendNotice, setSendNotice] = useState<string | null>(null);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [viewingCard, setViewingCard] = useState<FoodCardRecord | null>(null);
  const [notice, setNotice] = useState<{ title: string; body: string; action?: { label: string; onClick: () => void } } | null>(null);

  const activeKeyRef = useRef<string | null>(null);
  const typingHandle = useRef<ReturnType<typeof ChatService.openTypingChannel> | null>(null);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handledInitial = useRef<string | null>(null);
  const threadsRef = useRef<InboxThread[]>([]);
  const settingsRef = useRef({ notifyMessages });

  useEffect(() => { activeKeyRef.current = activeKey; }, [activeKey]);
  useEffect(() => { threadsRef.current = threads; }, [threads]);
  useEffect(() => { settingsRef.current = { notifyMessages }; }, [notifyMessages]);

  const activeThread = useMemo(() => threads.find((t) => threadKey(t) === activeKey) ?? null, [threads, activeKey]);
  const isBlocked = !!activeThread?.peerId && blockedIds.includes(activeThread.peerId);

  // ── Loading real data ────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    const [inbox, friendList, incoming, blocked] = await Promise.all([
      ChatService.getInbox(userId),
      ChatService.listFriends(userId),
      ChatService.listIncomingRequests(userId),
      ChatService.listBlockedIds(userId),
    ]);
    if (!inbox.success) {
      setLoadError(inbox.error ?? 'Couldn’t load your conversations.');
    } else {
      setLoadError(null);
      setThreads(inbox.data ?? []);
    }
    if (friendList.success) setFriends(friendList.data ?? []);
    if (incoming.success) setRequests(incoming.data ?? []);
    setBlockedIds(blocked);
    setIsLoadingInbox(false);
  }, [userId]);

  useEffect(() => {
    const t = setTimeout(loadAll, 0);
    return () => clearTimeout(t);
  }, [loadAll]);

  // Debounced refresh for events that change many things at once (new thread, unsend).
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(loadAll, 600);
  }, [loadAll]);

  useEffect(() => () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); }, []);

  // ── Presence (mutual: hide yours = can't see anyone else's) ──────────────
  useEffect(() => ChatService.joinPresence(userId, showOnlineStatus, setOnlineIds), [userId, showOnlineStatus]);

  // ── Opening a conversation ───────────────────────────────────────────────
  const openThread = useCallback(async (thread: InboxThread) => {
    const key = threadKey(thread);
    activeKeyRef.current = key;
    setActiveKey(key);
    setMessages([]);
    setMembers([]);
    setTypingIds(new Set());
    setSendNotice(null);
    setPeerReady(thread.type === 'dm' ? null : true);
    setPeerReadAt(null);
    setIsLoadingMessages(true);

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }

    const [result, groupMembers, ready] = await Promise.all([
      ChatService.listMessages({ threadType: thread.type, threadId: thread.id, userId }),
      thread.type === 'group' ? ChatService.listGroupMembers(thread.id) : Promise.resolve(null),
      thread.type === 'dm' && thread.peerId ? ChatService.hasSecureMessaging(thread.peerId) : Promise.resolve(true),
    ]);
    if (activeKeyRef.current !== key) return; // user moved on while this loaded

    setMessages(result.success ? result.data ?? [] : []);
    if (groupMembers?.success) setMembers(groupMembers.data ?? []);
    setPeerReady(ready);
    setIsLoadingMessages(false);

    ChatService.markRead(thread.type, thread.id, userId);
    setThreads((prev) => prev.map((t) => (threadKey(t) === key ? { ...t, unread: 0 } : t)));
  }, [userId]);

  const openDmWithFriend = useCallback(async (friend: ChatContact) => {
    setNewChatOpen(false);
    const existing = threadsRef.current.find((t) => t.type === 'dm' && t.peerId === friend.id);
    if (existing) return openThread(existing);

    const conversation = await ChatService.getOrCreateConversation(userId, friend.id);
    if (!conversation.success || !conversation.data) {
      setNotice({ title: 'Can’t start this chat', body: conversation.error ?? 'You can only message people you follow each other.' });
      return;
    }
    const fresh: InboxThread = {
      type: 'dm', id: conversation.data.id, peerId: friend.id, title: friend.name, avatar: friend.avatar, username: friend.username,
      createdAt: new Date().toISOString(), lastAt: null, lastText: '', lastMine: false, unread: 0,
    };
    setThreads((prev) => (prev.some((t) => threadKey(t) === threadKey(fresh)) ? prev : [fresh, ...prev]));
    return openThread(fresh);
  }, [openThread, userId]);

  // Deep link (/messages?userId=…, from a profile's Message button).
  useEffect(() => {
    if (isLoadingInbox || !initialUserId || handledInitial.current === initialUserId) return;
    handledInitial.current = initialUserId;

    (async () => {
      const existing = threadsRef.current.find((t) => t.type === 'dm' && t.peerId === initialUserId);
      const friend = friends.find((f) => f.id === initialUserId);
      if (existing) await openThread(existing);
      else if (friend) await openDmWithFriend(friend);
      else {
        const supabase = createClient();
        const { data } = supabase ? await supabase.from('users').select('display_name, username').eq('id', initialUserId).maybeSingle() : { data: null };
        const name = data?.display_name || data?.username || 'this person';
        setNotice({
          title: `Follow ${name} first`,
          body: 'You can message people once you follow each other. Send a follow request from their profile.',
          action: { label: 'View profile', onClick: () => onOpenUserProfile(initialUserId) },
        });
      }
      onClearInitial?.();
    })();
  }, [isLoadingInbox, initialUserId, friends, openThread, openDmWithFriend, onClearInitial, onOpenUserProfile]);

  // ── Realtime: incoming + unsent messages ─────────────────────────────────
  useEffect(() => {
    return ChatService.subscribeToAllMessages(userId, {
      onMessage: ({ threadType, threadId, message }) => {
        const key = `${threadType}:${threadId}`;
        const mine = message.senderId === userId;
        const isOpen = activeKeyRef.current === key;
        const known = threadsRef.current.some((t) => threadKey(t) === key);

        if (!known) {
          scheduleRefresh(); // a brand-new conversation - pull it in with its real title/avatar
          return;
        }

        setThreads((prev) =>
          prev
            .map((t) =>
              threadKey(t) === key
                ? { ...t, lastAt: message.createdAt, lastText: previewOfMessage(message), lastMine: mine, unread: mine || isOpen ? 0 : t.unread + 1 }
                : t,
            )
            .sort((a, b) => (b.lastAt ?? b.createdAt).localeCompare(a.lastAt ?? a.createdAt)),
        );

        if (isOpen) {
          setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
          if (!mine) ChatService.markRead(threadType, threadId, userId);
        }

        // Generic on purpose: an OS notification shouldn't put message text on a lock screen.
        if (!mine && (!isOpen || document.visibilityState === 'hidden') && settingsRef.current.notifyMessages
          && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          const t = threadsRef.current.find((x) => threadKey(x) === key);
          const n = new Notification(t?.title ?? 'New message', { body: 'Sent you a message', tag: key });
          n.onclick = () => { window.focus(); if (t) openThread(t); n.close(); };
        }
      },
      onDelete: ({ messageId }) => {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        scheduleRefresh();
      },
    });
  }, [userId, scheduleRefresh, openThread]);

  // ── Typing indicator for the open thread ─────────────────────────────────
  useEffect(() => {
    typingHandle.current?.close();
    typingHandle.current = null;
    if (!activeThread) return;

    const timers = typingTimers.current;
    const handle = ChatService.openTypingChannel(activeThread.type, activeThread.id, userId, (typerId, isTyping) => {
      const prevTimer = timers.get(typerId);
      if (prevTimer) clearTimeout(prevTimer);
      setTypingIds((prev) => {
        const next = new Set(prev);
        if (isTyping) next.add(typerId); else next.delete(typerId);
        return next;
      });
      if (isTyping) {
        timers.set(typerId, setTimeout(() => setTypingIds((p) => { const n = new Set(p); n.delete(typerId); return n; }), TYPING_EXPIRY_MS));
      }
    });
    typingHandle.current = handle;
    return () => {
      handle.close();
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, [activeThread?.type, activeThread?.id, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Read receipts (DMs): re-check when the chat changes and every few seconds ──
  useEffect(() => {
    if (!activeThread || activeThread.type !== 'dm') return;
    // Reciprocal: if you don't send read receipts, you don't see anyone else's either.
    if (!sendReadReceipts) return;
    let cancelled = false;
    const check = () => ChatService.getPeerReadAt(activeThread.id).then((at) => { if (!cancelled) setPeerReadAt(at); });
    check();
    const interval = setInterval(check, PEER_READ_POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [activeThread?.type, activeThread?.id, messages.length, sendReadReceipts]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sending ──────────────────────────────────────────────────────────────
  const deliver = useCallback(async (thread: InboxThread, text: string, existingLocalId?: string) => {
    const localId = existingLocalId ?? `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const optimistic: UiMessage = {
      id: localId, senderId: userId, content: text, sharedItem: null, createdAt: now,
      encrypted: true, undecryptable: false, status: 'sending',
      conversationId: thread.type === 'dm' ? thread.id : undefined, groupId: thread.type === 'group' ? thread.id : undefined,
    };
    setSendNotice(null);
    setMessages((prev) => (existingLocalId ? prev.map((m) => (m.id === existingLocalId ? optimistic : m)) : [...prev, optimistic]));

    const res = thread.type === 'dm'
      ? await ChatService.sendTextMessage({ conversationId: thread.id, senderId: userId, content: text })
      : await ChatService.sendGroupTextMessage({ groupId: thread.id, senderId: userId, content: text });

    if (!res.success || !res.data) {
      if (res.code === 'peer-not-ready') setPeerReady(false);
      setSendNotice(errorNotice(res.code, res.error));
      setMessages((prev) => prev.map((m) => (m.id === localId ? { ...m, status: 'error' } : m)));
      return;
    }
    const sent = res.data;
    setMessages((prev) => {
      const withoutLocal = prev.filter((m) => m.id !== localId);
      // The realtime echo of our own message may have landed first.
      return withoutLocal.some((m) => m.id === sent.id) ? withoutLocal : [...withoutLocal, { ...sent, status: 'sent' }];
    });
    setThreads((prev) => prev.map((t) => (threadKey(t) === threadKey(thread) ? { ...t, lastAt: sent.createdAt, lastText: text, lastMine: true } : t)));
  }, [userId]);

  const sendText = (text: string) => { if (activeThread) deliver(activeThread, text); };

  const retry = (message: UiMessage) => { if (activeThread && message.content) deliver(activeThread, message.content, message.id); };

  const sendEvent = async (e: { name: string; date: string; time: string; location: string; description: string }) => {
    if (!activeThread) return;
    const item: AppItem = {
      itemType: 'event', name: e.name, caption: e.description, eventDate: e.date, eventTime: e.time, eventLocation: e.location, rsvpCount: 0, cat: 'Meetup',
    };
    setSendNotice(null);
    const res = activeThread.type === 'dm'
      ? await ChatService.sendSharedItemMessage({ conversationId: activeThread.id, senderId: userId, item })
      : await ChatService.sendGroupSharedItemMessage({ groupId: activeThread.id, senderId: userId, item });
    if (!res.success || !res.data) {
      if (res.code === 'peer-not-ready') setPeerReady(false);
      setSendNotice(errorNotice(res.code, res.error));
      return;
    }
    const sent = res.data;
    setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, { ...sent, status: 'sent' }]));
    setThreads((prev) => prev.map((t) => (threadKey(t) === threadKey(activeThread) ? { ...t, lastAt: sent.createdAt, lastText: previewOfMessage(sent), lastMine: true } : t)));
  };

  const unsend = async (message: UiMessage) => {
    if (!activeThread) return;
    const res = await ChatService.deleteMessage(activeThread.type, message.id);
    if (!res.success) { setSendNotice(res.error ?? 'Couldn’t unsend that message.'); return; }
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
    scheduleRefresh();
  };

  // ── Safety ───────────────────────────────────────────────────────────────
  const block = async () => {
    if (!activeThread?.peerId) return;
    const res = await ChatService.blockUser(activeThread.peerId);
    if (!res.success) { setSendNotice(res.error ?? 'Couldn’t block this user.'); return; }
    setBlockedIds((prev) => [...new Set([...prev, activeThread.peerId as string])]);
    scheduleRefresh();
  };

  const unblock = async () => {
    if (!activeThread?.peerId) return;
    const res = await ChatService.unblockUser(userId, activeThread.peerId);
    if (res.success) setBlockedIds((prev) => prev.filter((id) => id !== activeThread.peerId));
  };

  const report = async (reason: ReportReason, details: string) => {
    if (!activeThread) return false;
    const res = await ChatService.reportUser({
      reporterId: userId, reportedUserId: activeThread.peerId, threadType: activeThread.type, threadId: activeThread.id, reason, details,
    });
    return res.success;
  };

  const leaveGroup = async () => {
    if (!activeThread || activeThread.type !== 'group') return;
    const res = await ChatService.leaveGroup(activeThread.id, userId);
    if (!res.success) { setSendNotice(res.error ?? 'Couldn’t leave the group.'); return; }
    setThreads((prev) => prev.filter((t) => threadKey(t) !== threadKey(activeThread)));
    setActiveKey(null);
  };

  // ── Requests + groups ────────────────────────────────────────────────────
  const acceptRequest = async (r: IncomingRequest) => {
    const res = await FriendRequestService.acceptRequest(r.requestId);
    if (res.success) { await loadAll(); openDmWithFriend(r.from); }
  };

  const declineRequest = async (r: IncomingRequest) => {
    const res = await FriendRequestService.declineRequest(r.requestId);
    if (res.success) setRequests((prev) => prev.filter((x) => x.requestId !== r.requestId));
  };

  const createGroup = async (name: string, memberIds: string[]): Promise<string | null> => {
    const res = await ChatService.createGroup({ name, memberIds, createdBy: userId });
    if (!res.success || !res.data) return res.error ?? 'Couldn’t create the group.';
    const group: ChatGroup = res.data;
    const fresh: InboxThread = {
      type: 'group', id: group.id, title: group.name, avatar: group.avatarUrl ?? null,
      createdAt: group.createdAt, lastAt: null, lastText: '', lastMine: false, unread: 0,
    };
    setNewChatOpen(false);
    setThreads((prev) => [fresh, ...prev]);
    openThread(fresh);
    return null;
  };

  // Tapping a shared card opens the REAL thing it points at - the card itself (recipe, review, visit ...) -
  // rather than sending everyone to the map. Older-style items fall back to their own section.
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const openSharedItem = async (item: AppItem) => {
    const id = item.id || item.itemId || '';
    if (item.itemType === 'food_card' && UUID.test(id)) {
      const res = await foodCardService.getCardById(id);
      if (res.success && res.data) { setViewingCard(res.data); return; }
      setNotice({ title: 'Card unavailable', body: 'This card was deleted, or its owner has made their profile private.' });
      return;
    }
    if (id.startsWith('recipe')) return setTab('bites');
    if (id.startsWith('video')) return setTab('trims');
    if (item.placeId || typeof item.lat === 'number') return setTab('scout');
    setNotice({ title: 'Nothing to open', body: 'This item doesn’t have a page to open.' });
  };

  const peerOnline = !!activeThread?.peerId && showOnlineStatus && onlineIds.has(activeThread.peerId);
  const someoneTyping = [...typingIds].some((id) => id !== userId);

  return (
    <div className="fz-chat">
      <ChatInbox
        threads={threads}
        requests={requests}
        activeKey={activeKey}
        onlineIds={showOnlineStatus ? onlineIds : new Set()}
        isLoading={isLoadingInbox}
        hiddenOnMobile={!!activeThread}
        onSelect={openThread}
        onNewChat={() => setNewChatOpen(true)}
        onAcceptRequest={acceptRequest}
        onDeclineRequest={declineRequest}
      />

      <div className={`fz-chat-pane${activeThread ? ' is-active' : ''}`}>
        {activeThread ? (
          <ChatThread
            key={activeKey}
            thread={activeThread}
            userId={userId}
            messages={messages}
            isLoading={isLoadingMessages}
            online={peerOnline}
            typing={someoneTyping}
            members={members}
            peerReady={peerReady}
            blocked={isBlocked}
            peerReadAt={sendReadReceipts ? peerReadAt : null}
            sendNotice={sendNotice}
            onBack={() => { activeKeyRef.current = null; setActiveKey(null); }}
            onSend={sendText}
            onRetry={retry}
            onSendEvent={sendEvent}
            onUnsend={unsend}
            onTypingChange={(t) => typingHandle.current?.setTyping(t)}
            onOpenProfile={onOpenUserProfile}
            onBlock={block}
            onUnblock={unblock}
            onReport={report}
            onLeaveGroup={leaveGroup}
            onSave={onSave}
            onShareRequest={onShareRequest}
            onOpenItem={openSharedItem}
          />
        ) : (
          <div className="fz-chat-pane__empty">
            <div className="fz-chat-pane__empty-icon"><MessageSquareLock size={38} /></div>
            <h2>Your messages are private</h2>
            <p>Chats are end-to-end encrypted — only you and the people in them can read what’s said.</p>
            {loadError ? (
              <button type="button" className="fz-chat-pill fz-chat-pill--accent" onClick={() => { setIsLoadingInbox(true); loadAll(); }}>Try again</button>
            ) : (
              <button type="button" className="fz-chat-pill fz-chat-pill--accent" onClick={() => setNewChatOpen(true)}><SquarePen size={15} /> New chat</button>
            )}
            {loadError && <p className="fz-chat-pane__error" role="alert">{loadError}</p>}
          </div>
        )}
      </div>

      {newChatOpen && (
        <NewChatModal
          userId={userId}
          friends={friends}
          blockedIds={blockedIds}
          onClose={() => setNewChatOpen(false)}
          onOpenDm={openDmWithFriend}
          onCreateGroup={createGroup}
        />
      )}

      {viewingCard && (
        <FoodCardDetailModal
          card={viewingCard}
          currentUserId={userId}
          onClose={() => setViewingCard(null)}
          onUpdated={(updated) => setViewingCard(updated)}
        />
      )}

      {notice && (
        <DialogShell title={notice.title} onClose={() => setNotice(null)}>
          <p className="fz-chat-dialog__text">{notice.body}</p>
          <div className="fz-chat-dialog__actions">
            <button type="button" className="fz-chat-pill" onClick={() => setNotice(null)}>Close</button>
            {notice.action && <button type="button" className="fz-chat-pill fz-chat-pill--accent" onClick={() => { const a = notice.action; setNotice(null); a?.onClick(); }}>{notice.action.label}</button>}
          </div>
        </DialogShell>
      )}
    </div>
  );
};

export default ChatView;
