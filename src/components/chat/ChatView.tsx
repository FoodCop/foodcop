/**
 * ============================================================================
 * CHAT MODULE — Real-time Studio Orchestration
 * ============================================================================
 *
 * Component Architecture:
 * 1. ChatService Integration: Real-time Supabase synchronization.
 * 2. Inbox Orchestrator: Dynamic filtering and status management.
 * 3. Messaging Engine: Supports text and rich Studio item shares.
 * 4. Group Logic: Dynamic group creation and member synchronization (Realtime).
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Share2, Send, Check, CheckCheck, AlertCircle, Clock, MessageSquare, Calendar as CalendarIcon,
  LayoutGrid, X, Search, ChevronLeft, Eye, Bookmark
} from 'lucide-react';
import { ChatService, type ChatMessage } from '../../lib/services/chatService';
import { FriendRequestService, type FriendRelationshipState } from '../../lib/services/friendRequestService';
import { filterFriendsByQuery } from '../../lib/chatHelpers';
import type { ChatInboxItem, ChatUiMessage } from '../../types/chatUi';
import type { AuthUser } from '../../types/auth';
import type { AppItem } from '../../types/appItem';
import { isSupabaseConfigured as hasSupabaseConfig } from '../../lib/supabase/client';
import { EventInviteCard } from './EventInviteCard';
import { EventCreateModal } from './EventCreateModal';

/**
 * requestNotificationPermission helper (moved from index.tsx or kept here if specific to chat)
 */
const requestNotificationPermission = async () => {
  if (globalThis.Notification === undefined) return;
  if (globalThis.Notification.permission !== 'default') return;
  try {
    await globalThis.Notification.requestPermission();
  } catch (error) {
    console.warn('Notification permission request failed:', error);
  }
};

/**
 * COMPONENT: ChatView
 * Master orchestrator for the 'Chat' feature.
 * Coordinates:
 * - Direct Messaging (Supabase Realtime)
 * - Group Clusters
 * - Shared Studio Artifacts (Bites/Trims/Scout)
 */
export const ChatView = ({
  friends,
  authUser,
  onSave,
  onShareRequest,
  setTab,
  onConversationOpened,
  onOpenUserProfile,
  initialActiveId,
  initialActiveType,
  onClearInitial,
}: {
  friends: ChatInboxItem[];
  authUser: AuthUser | null;
  onSave: (item: AppItem) => void;
  onShareRequest: (item: AppItem) => void;
  setTab: (tab: string) => void;
  onConversationOpened: (friendId: string) => void;
  onOpenUserProfile: (userId: string) => void;
  initialActiveId?: string | null;
  initialActiveType?: 'dm' | 'group' | null;
  onClearInitial?: () => void;
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'dm' | 'group' | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [friendSearch, setFriendSearch] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [showEventCreate, setShowEventCreate] = useState(false);
  const [relationshipOverrides, setRelationshipOverrides] = useState<Record<string, { requestStatus: FriendRelationshipState; requestId?: string }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialActiveId) {
      openConversation(initialActiveId, initialActiveType || 'dm');
      onClearInitial?.();
    }
  }, [initialActiveId, initialActiveType, onClearInitial]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (activeId) {
      scrollToBottom();
    }
  }, [messages.length, isTyping, activeId, scrollToBottom]);

  const mergedFriends = useMemo(() => friends.map((f) => {
    if (f.type !== 'dm') return f;
    const override = relationshipOverrides[String(f.id)];
    return override ? { ...f, ...override } : f;
  }), [friends, relationshipOverrides]);

  const active = mergedFriends.find(f => String(f.id) === activeId);
  const isGated = !!active && active.type === 'dm' && 'requestStatus' in active
    && active.requestStatus !== undefined && active.requestStatus !== 'accepted';
  const filteredFriends = useMemo(() => filterFriendsByQuery(mergedFriends, friendSearch), [mergedFriends, friendSearch]);

  const mapMessageToUi = useCallback((message: ChatMessage): ChatUiMessage => {
    let type: 'text' | 'share' | 'event' = 'text';
    if (message.sharedItem) {
      type = message.sharedItem.itemType === 'event' ? 'event' : 'share';
    }

    return {
      id: message.id,
      role: message.senderId === authUser?.id ? 'user' : 'ai',
      type,
      text: message.content,
      item: message.sharedItem,
    };
  }, [authUser?.id]);

  useEffect(() => {
    if (!draft.trim() || !activeId || !authUser?.id) return;
    if (activeType === 'dm' && !conversationId) return;


    const targetId = activeType === 'group' ? activeId : conversationId;
    const isGroup = activeType === 'group';

    if (!targetId) return;

    ChatService.sendTypingStatus(targetId, authUser.id, true, isGroup);

    const timeout = setTimeout(() => {
      ChatService.sendTypingStatus(targetId, authUser.id, false, isGroup);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [draft, activeId, authUser?.id, conversationId, activeType]);

  useEffect(() => {
    if (!activeId || (!conversationId && activeType === 'dm')) return;

    const targetId = activeType === 'group' ? activeId : (conversationId as string);
    const isGroup = activeType === 'group';

    const unsubscribe = ChatService.subscribeToTypingStatus(targetId, (typingUserId, typingStatus) => {
      if (typingUserId !== authUser?.id) {
        setIsTyping(typingStatus);
      }
    }, isGroup);

    return () => unsubscribe();
  }, [activeId, activeType, conversationId, authUser?.id]);

  const appendIncomingMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => {
      if (prev.some((entry) => entry.id === message.id)) return prev;
      return [...prev, mapMessageToUi(message)];
    });
    if (message.senderId !== authUser?.id && activeId) {
      onConversationOpened(activeId);
    }
  }, [activeId, authUser?.id, mapMessageToUi, onConversationOpened]);

  useEffect(() => {
    setActiveId(null);
    setConversationId(null);
    setMessages([]);
  }, [authUser?.id]);

  useEffect(() => {
    if (!activeId || !activeType) return;

    if (activeType === 'dm' && conversationId) {
      const unsubscribe = ChatService.subscribeToConversationMessages(conversationId, (message) => {
        appendIncomingMessage(message);
      });
      return () => unsubscribe();
    } else if (activeType === 'group' && activeId) {
      const unsubscribe = ChatService.subscribeToGroupMessages(activeId, (message) => {
        appendIncomingMessage(message);
      });
      return () => unsubscribe();
    }
  }, [activeId, activeType, conversationId, appendIncomingMessage]);

  const formatFriendTime = (item: ChatInboxItem) => {
    if ('time' in item && item.time) return item.time;
    if ('online' in item && item.online) return 'now';
    if ('lastSeen' in item && item.lastSeen) return 'recent';
    return '—';
  };

  const getMessageStatusIcon = (status?: string) => {
    if (!status || status === 'sent') return <Check size={10} />;
    if (status === 'sending') return <Clock size={10} style={{ animation: 'chat-pulse 2s ease-in-out infinite' }} />;
    if (status === 'read') return <CheckCheck size={10} color="#f2a93b" />;
    if (status === 'error') return <AlertCircle size={10} color="#dc2626" />;
    return <Check size={10} />;
  };

  const openConversation = async (participantId: string, type: 'dm' | 'group' = 'dm', relationshipOverride?: FriendRelationshipState) => {
    activeIdRef.current = participantId;

    if (!authUser?.id || !hasSupabaseConfig) {
      setActiveId(participantId);
      setActiveType(type);
      setMessages([]);
      return;
    }

    const friend = type === 'dm' ? mergedFriends.find((f) => String(f.id) === participantId) : undefined;
    const relationship: FriendRelationshipState | undefined = relationshipOverride
      ?? (friend && 'requestStatus' in friend ? friend.requestStatus : undefined);

    // 'none': no thread to open yet - send the friend request instead.
    if (type === 'dm' && relationship === 'none') {
      setActiveId(participantId);
      setActiveType(type);
      setConversationId(null);
      setMessages([]);
      onConversationOpened(participantId);

      const sent = await FriendRequestService.sendRequest(authUser.id, participantId);
      if (activeIdRef.current !== participantId) return;
      if (sent.success && sent.data) {
        setRelationshipOverrides((prev) => ({ ...prev, [participantId]: { requestStatus: 'outgoing-pending', requestId: sent.data!.id } }));
      }
      return;
    }

    // 'outgoing-pending': waiting on the other side, nothing to fetch yet.
    if (type === 'dm' && relationship === 'outgoing-pending') {
      setActiveId(participantId);
      setActiveType(type);
      setConversationId(null);
      setMessages([]);
      onConversationOpened(participantId);
      return;
    }

    setActiveId(participantId);
    setActiveType(type);
    onConversationOpened(participantId);

    // 'incoming-pending': show the Accept/Decline banner, no conversation
    // exists yet (the DB gate only allows creating one once accepted).
    if (type === 'dm' && relationship === 'incoming-pending') {
      setConversationId(null);
      setMessages([]);
      return;
    }

    if (type === 'dm') {
      const conversation = await ChatService.getOrCreateConversation(authUser.id, participantId);
      if (activeIdRef.current !== participantId) return;
      if (!conversation.success || !conversation.data) return;

      setConversationId(conversation.data.id);
      const result = await ChatService.listMessages(conversation.data.id);
      if (activeIdRef.current !== participantId) return;
      if (!result.success || !result.data) {
        setMessages([]);
        return;
      }

      setMessages(result.data.map((message) => ({
        id: message.id,
        role: message.senderId === authUser?.id ? 'user' : 'ai',
        type: message.sharedItem ? 'share' : 'text',
        text: message.content,
        item: message.sharedItem,
        status: message.senderId === authUser?.id ? 'sent' : undefined,
      })));
    } else {
      setConversationId(null);
      const result = await ChatService.listGroupMessages(participantId);
      if (activeIdRef.current !== participantId) return;
      if (!result.success || !result.data) {
        setMessages([]);
        return;
      }

      setMessages(result.data.map((message) => ({
        id: message.id,
        role: message.senderId === authUser?.id ? 'user' : 'ai',
        type: message.sharedItem ? 'share' : 'text',
        text: message.content,
        item: message.sharedItem,
        status: message.senderId === authUser?.id ? 'sent' : undefined,
      })));
    }
  };

  const acceptIncomingRequest = async () => {
    if (!active || !('requestId' in active) || !active.requestId) return;
    const result = await FriendRequestService.acceptRequest(active.requestId);
    if (!result.success) return;
    setRelationshipOverrides((prev) => ({ ...prev, [String(active.id)]: { requestStatus: 'accepted' } }));
    openConversation(String(active.id), 'dm', 'accepted');
  };

  const declineIncomingRequest = async () => {
    if (!active || !('requestId' in active) || !active.requestId) return;
    await FriendRequestService.declineRequest(active.requestId);
    setRelationshipOverrides((prev) => ({ ...prev, [String(active.id)]: { requestStatus: 'none' } }));
    setActiveId(null);
  };

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || !activeId || !authUser?.id) return;

    setDraft('');
    const optimisticId = `local-${Date.now()}`;
    setMessages(prev => ([...prev, {
      id: optimisticId,
      role: 'user',
      type: 'text',
      text: content,
      status: 'sending',
    }]));

    let sent;
    if (activeType === 'dm' && conversationId) {
      sent = await ChatService.sendTextMessage({
        conversationId,
        senderId: authUser.id,
        content,
      });
    } else if (activeType === 'group') {
      sent = await ChatService.sendGroupTextMessage({
        groupId: activeId,
        senderId: authUser.id,
        content,
      });
    }

    if (!sent || !sent.success || !sent.data) {
      setMessages(prev => prev.map((message) => message.id === optimisticId ? { ...message, status: 'error' } : message));
      setDraft(content);
      return;
    }

    setMessages(prev => {
      const filtered = prev.filter((m) => m.id !== optimisticId);
      const mapped = mapMessageToUi(sent.data!);
      return [...filtered, {
        ...mapped,
        status: 'sent',
        senderName: (authUser.user_metadata?.full_name as string) || (authUser.user_metadata?.name as string) || 'You'
      }];
    });
  };

  const sendEventInvite = async (eventData: {
    name: string;
    date: string;
    time: string;
    location: string;
    description: string;
  }) => {
    if (!activeId || !authUser?.id) return;

    const eventItem: AppItem = {
      itemType: 'event',
      name: eventData.name,
      caption: eventData.description,
      eventDate: eventData.date,
      eventTime: eventData.time,
      eventLocation: eventData.location,
      rsvpCount: 0,
      cat: 'Meetup',
      img: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
    };

    setShowEventCreate(false);

    let sent;
    if (activeType === 'dm' && conversationId) {
      sent = await ChatService.sendSharedItemMessage({
        conversationId,
        senderId: authUser.id,
        item: eventItem,
      });
    } else if (activeType === 'group') {
      sent = await ChatService.sendGroupSharedItemMessage({
        groupId: activeId,
        senderId: authUser.id,
        item: eventItem,
      });
    }

    if (sent?.success && sent.data) {
      const sentMessage = sent.data;
      setMessages(prev => ([...prev, {
        ...mapMessageToUi(sentMessage),
        status: 'sent',
        senderName: (authUser.user_metadata?.full_name as string) || (authUser.user_metadata?.name as string) || 'You'
      }]));
    }
  };

  // --- SECTION: Group Logic ---

  const createGroup = async () => {
    if (!newGroupName.trim() || selectedMemberIds.length === 0 || !authUser?.id) return;

    setIsSubmittingGroup(true);
    setGroupError(null);

    try {
      const result = await ChatService.createGroup({
        name: newGroupName,
        memberIds: [authUser.id, ...selectedMemberIds],
        createdBy: authUser.id,
      });

      if (result.success && result.data) {
        setIsCreatingGroup(false);
        setNewGroupName('');
        setSelectedMemberIds([]);
        openConversation(result.data.id, 'group');
      } else {
        setGroupError(result.error || 'Failed to create group');
      }
    } catch (err) {
      console.error('[ChatView] createGroup exception:', err);
      setGroupError('An unexpected error occurred');
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  return (
    <div className="chat-view">

      {/* Left Pane (Inbox List) */}
      <div className={`chat-view__inbox${activeId ? ' is-hidden-mobile' : ''}`}>
        <header className="chat-view__inbox-header">
          <div>
            <h2 className="chat-view__inbox-title">Studio Inbox</h2>
            <div className="chat-view__inbox-subrow">
              <p className="chat-view__find-friends">Find Friends</p>
              <button
                onClick={() => setIsCreatingGroup(true)}
                className="chat-view__create-group-btn"
              >
                <LayoutGrid size={12} />
                Create Group
              </button>
            </div>
          </div>
          <div className="chat-view__live-badge">
            <div className="chat-view__live-dot" />
            <span className="chat-view__live-label">Live</span>
          </div>
        </header>

        {isCreatingGroup && (
          <div className="chat-view__group-panel">
            <div className="chat-view__group-panel-head">
              <h3 className="chat-view__group-panel-heading">New Chat Group</h3>
              <button onClick={() => setIsCreatingGroup(false)} className="chat-view__group-panel-close"><X size={20} /></button>
            </div>
            <div>
              <input
                value={newGroupName}
                onChange={(e) => {
                  setNewGroupName(e.target.value);
                  setGroupError(null);
                }}
                disabled={isSubmittingGroup}
                placeholder="Group Name..."
                className="chat-view__group-name-input"
              />
              <div className="chat-view__member-picker" style={{ marginTop: '1rem' }}>
                <div className="chat-view__member-picker-head">
                  <p className="chat-view__member-picker-label">Select Members</p>
                  {selectedMemberIds.length === 0 && (
                    <p className="chat-view__member-picker-hint">Add at least 1 friend</p>
                  )}
                </div>
                <div className="chat-view__member-chips">
                  {friends.filter(f => f.type !== 'group').map(f => (
                    <button
                      key={f.id}
                      onClick={() => {
                        if (isSubmittingGroup) return;
                        setSelectedMemberIds(prev => prev.includes(String(f.id)) ? prev.filter(mid => mid !== String(f.id)) : [...prev, String(f.id)]);
                        setGroupError(null);
                      }}
                      disabled={isSubmittingGroup}
                      className={`chat-view__member-chip${selectedMemberIds.includes(String(f.id)) ? ' is-selected' : ''}`}
                    >
                      <img src={f.avatar} alt={`${f.name || 'Member'} avatar`} />
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {groupError && (
              <div className="chat-view__group-error">
                <AlertCircle size={14} />
                {groupError}
              </div>
            )}
            <button
              onClick={createGroup}
              disabled={!newGroupName.trim() || selectedMemberIds.length === 0 || isSubmittingGroup}
              className="chat-view__group-submit"
            >
              {isSubmittingGroup ? (
                <>
                  <Clock size={16} className="chat-spin" />
                  Creating...
                </>
              ) : 'Create Studio Group'}
            </button>
          </div>
        )}

        <div className="chat-view__search">
          <div className="chat-view__search-inner">
            <Search size={18} className="chat-view__search-icon" />
            <input
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
              placeholder="Search contacts..."
              className="chat-view__search-input"
            />
          </div>
        </div>

        <div className="chat-view__list chat-hide-scrollbar">
          {filteredFriends.map(c => (
            <div key={c.id}>
              <button
                type="button"
                onClick={() => {
                  openConversation(String(c.id), c.type || 'dm').catch((error) => {
                    console.warn('Failed to open conversation:', error);
                  });
                }}
                className={`chat-view__row${activeId === String(c.id) ? ' is-active' : ''}`}
              >
                <div className="chat-view__row-avatar">
                  <img src={c.avatar} alt={c.name || 'Chat'} className="chat-view__row-avatar-img" />
                  {c.type === 'dm' && 'online' in c && c.online && (
                    <div className="chat-view__online-dot" />
                  )}
                  {c.type === 'group' && (
                    <div className="chat-view__group-dot">
                      <LayoutGrid size={10} />
                    </div>
                  )}
                </div>
                <div className="chat-view__row-content">
                  <div className="chat-view__row-top">
                    <div className="chat-view__row-name-wrap">
                      <h4 className="chat-view__row-name">{c.name}</h4>
                      {c.type === 'group' && (
                        <span className="chat-view__row-group-tag">Group</span>
                      )}
                    </div>
                    <span className="chat-view__row-time">{formatFriendTime(c)}</span>
                  </div>
                  <div className="chat-view__row-bottom">
                    <p className={`chat-view__row-preview${(c.unreadCount ?? 0) > 0 ? ' has-unread' : ''}`}>
                      {c.type === 'dm' && 'requestStatus' in c && c.requestStatus === 'incoming-pending' ? 'Message Request'
                        : c.type === 'dm' && 'requestStatus' in c && c.requestStatus === 'outgoing-pending' ? 'Request Sent'
                        : c.type === 'dm' && 'requestStatus' in c && c.requestStatus === 'none' ? 'Say hello...'
                        : 'Tap to chat...'}
                    </p>
                    {(c.unreadCount ?? 0) > 0 && (
                      <div className="chat-view__row-unread">{c.unreadCount}</div>
                    )}
                  </div>
                </div>
              </button>
            </div>
          ))}
          {filteredFriends.length === 0 && (
            <div className="chat-view__empty">No contacts found.</div>
          )}
        </div>
      </div>

      {/* Right Pane (Active Conversation) */}
      <div className={`chat-view__conversation${activeId ? ' is-active' : ''}`}>
        {!activeId || !active ? (
          <div className="chat-view__conversation-empty">
            <div className="chat-view__conversation-empty-icon">
              <MessageSquare size={40} />
            </div>
            <h3 className="chat-view__conversation-empty-title">Your Messages</h3>
            <p className="chat-view__conversation-empty-sub">Select a conversation from the left to start chatting with your studio friends.</p>
          </div>
        ) : (
          <div className="chat-view__thread">
            {/* Conversation Header */}
            <header className="chat-view__thread-header">
              <div className="chat-view__thread-left">
                <button
                  onClick={() => setActiveId(null)}
                  className="chat-view__thread-back"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="chat-view__thread-identity" onClick={() => active.type === 'dm' && onOpenUserProfile(String(active.id))}>
                  <div className="chat-view__thread-avatar">
                    <img src={active.avatar} alt={active.name || 'Chat'} className="chat-view__thread-avatar-img" />
                    {active.type === 'dm' && 'online' in active && active.online && (
                      <div className="chat-view__thread-online-dot" />
                    )}
                    {active.type === 'group' && (
                      <div className="chat-view__thread-group-dot">
                        <LayoutGrid size={8} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="chat-view__thread-name">{active.name}</h4>
                    <div className="chat-view__thread-status">
                      <div className={`chat-view__thread-status-dot${active.type === 'group' ? ' is-group' : (('online' in active && active.online) ? ' is-online' : '')}`} />
                      <p className="chat-view__thread-status-text">
                        {active.type === 'group' ? 'Studio Group' : (('online' in active && active.online) ? 'Online' : 'Offline')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="chat-view__thread-actions">
                {active.type === 'dm' && (
                  <button
                    type="button"
                    onClick={() => onOpenUserProfile(String(active.id))}
                    className="chat-view__thread-profile-btn"
                  >
                    Profile
                  </button>
                )}
              </div>
            </header>

            {active.type === 'dm' && 'requestStatus' in active && active.requestStatus === 'incoming-pending' && (
              <div className="chat-view__request-banner chat-view__request-banner--incoming">
                <p className="chat-view__request-label">Message Request</p>
                <p className="chat-view__request-text">{active.name} wants to connect with you.</p>
                <div className="chat-view__request-actions">
                  <button onClick={acceptIncomingRequest} className="chat-view__request-accept">Accept</button>
                  <button onClick={declineIncomingRequest} className="chat-view__request-decline">Decline</button>
                </div>
              </div>
            )}

            {active.type === 'dm' && 'requestStatus' in active && active.requestStatus === 'outgoing-pending' && (
              <div className="chat-view__request-banner chat-view__request-banner--waiting">
                <p className="chat-view__request-label">Request Sent</p>
                <p className="chat-view__request-text">Waiting for {active.name} to accept before you can chat.</p>
              </div>
            )}

            {active.type === 'dm' && 'requestStatus' in active && active.requestStatus === 'none' && (
              <div className="chat-view__request-banner chat-view__request-banner--waiting">
                <p className="chat-view__request-label">Sending Request</p>
                <p className="chat-view__request-text">Asking {active.name} to connect...</p>
              </div>
            )}

            {/* Messages Area */}
            <div className="chat-view__messages chat-hide-scrollbar">
              {messages.map((m) => (
                <div key={`${m.id || ''}-${m.role}-${m.type || 'text'}-${m.text || ''}-${m.item?.id || ''}`} className={`chat-view__message-group${m.role === 'user' ? ' is-mine' : ''}`}>
                  {activeType === 'group' && m.role !== 'user' && m.senderName && (
                    <span className="chat-view__message-sender">{m.senderName}</span>
                  )}
                  <div className={`chat-view__bubble${m.role === 'user' ? ' is-mine' : ''}`}>
                    {m.type === 'share' ? (
                      <div className="chat-view__share-card">
                        <div className="chat-view__share-head">
                          <p className="chat-view__share-eyebrow">Shared Item</p>
                          <span className="chat-view__share-badge">{m.item?.cat || 'Item'}</span>
                        </div>
                        <div className="chat-view__share-media">
                          <img src={m.item?.img} alt={m.item?.name || 'Shared item'} />
                          <div className="chat-view__share-overlay">
                            <button
                              onClick={() => {
                                if (m.item?.id?.startsWith('recipe')) setTab('bites');
                                else if (m.item?.id?.startsWith('video')) setTab('trims');
                                else setTab('scout');
                              }}
                              className="chat-view__share-view-btn"
                            >
                              <Eye size={18} />
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="chat-view__share-title">{m.item?.name}</p>
                          <p className="chat-view__share-sub">Sent via Fuzo Studio</p>
                        </div>
                        <div className="chat-view__share-actions">
                          <button
                            onClick={() => {
                              if (m.item?.id?.startsWith('recipe')) setTab('bites');
                              else if (m.item?.id?.startsWith('video')) setTab('trims');
                              else setTab('scout');
                            }}
                            className="chat-view__share-action"
                          >
                            <div className="chat-view__share-action-icon"><Eye size={14} /></div>
                            <span className="chat-view__share-action-label">View</span>
                          </button>
                          <button
                            onClick={() => { if (m.item) onSave(m.item); }}
                            className="chat-view__share-action"
                          >
                            <div className="chat-view__share-action-icon"><Bookmark size={14} /></div>
                            <span className="chat-view__share-action-label">Save</span>
                          </button>
                          <button
                            onClick={() => { if (m.item) onShareRequest(m.item); }}
                            className="chat-view__share-action"
                          >
                            <div className="chat-view__share-action-icon"><Share2 size={14} /></div>
                            <span className="chat-view__share-action-label">Share</span>
                          </button>
                        </div>
                      </div>
                    ) : m.type === 'event' && m.item ? (
                      <EventInviteCard
                        messageId={m.id}
                        userId={authUser?.id}
                        event={m.item}
                        role={m.role}
                      />
                    ) : m.text}
                  </div>
                  {m.role === 'user' && (
                    <div className="chat-view__status-row">{getMessageStatusIcon(m.status)}</div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="chat-view__typing">
                  <div className="chat-view__typing-dots">
                    <div className="chat-view__typing-dot" style={{ animationDelay: '0ms' }} />
                    <div className="chat-view__typing-dot" style={{ animationDelay: '150ms' }} />
                    <div className="chat-view__typing-dot" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} style={{ height: '0.5rem' }} />
            </div>

            {showEventCreate && (
              <EventCreateModal
                onClose={() => setShowEventCreate(false)}
                onSubmit={sendEventInvite}
              />
            )}

            {/* Conversation Composer */}
            <footer className="chat-view__composer">
              <button
                onClick={() => setShowEventCreate(true)}
                disabled={isGated}
                className="chat-view__composer-icon-btn"
              >
                <CalendarIcon size={18} />
              </button>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={isGated ? 'Waiting on a friend request...' : 'Type a message...'}
                disabled={isGated}
                className="chat-view__composer-input chat-hide-scrollbar"
                rows={1}
                style={{
                  height: draft ? 'auto' : undefined,
                }}
              />
              <button
                onClick={sendMessage}
                disabled={isGated || !draft.trim()}
                className="chat-view__composer-send"
              >
                <Send size={18} />
              </button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatView;
