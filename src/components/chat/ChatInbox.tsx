'use client';

import { useMemo, useState } from 'react';
import { Search, SquarePen, Lock } from 'lucide-react';
import type { IncomingRequest, InboxThread } from '@/lib/services/chatService';
import { formatInboxTime } from '@/lib/chat/format';
import ChatAvatar from './ChatAvatar';

type Tab = 'all' | 'unread' | 'groups' | 'requests';

export const threadKey = (t: { type: string; id: string }) => `${t.type}:${t.id}`;

export default function ChatInbox({
  threads,
  requests,
  activeKey,
  onlineIds,
  isLoading,
  hiddenOnMobile,
  onSelect,
  onNewChat,
  onAcceptRequest,
  onDeclineRequest,
}: {
  threads: InboxThread[];
  requests: IncomingRequest[];
  activeKey: string | null;
  onlineIds: Set<string>;
  isLoading: boolean;
  hiddenOnMobile: boolean;
  onSelect: (thread: InboxThread) => void;
  onNewChat: () => void;
  onAcceptRequest: (request: IncomingRequest) => void;
  onDeclineRequest: (request: IncomingRequest) => void;
}) {
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');

  const unreadTotal = threads.reduce((sum, t) => sum + (t.unread > 0 ? 1 : 0), 0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads.filter((t) => {
      if (tab === 'unread' && t.unread === 0) return false;
      if (tab === 'groups' && t.type !== 'group') return false;
      if (!q) return true;
      return t.title.toLowerCase().includes(q) || (t.username ?? '').toLowerCase().includes(q);
    });
  }, [threads, tab, query]);

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread', badge: unreadTotal },
    { key: 'groups', label: 'Groups' },
    { key: 'requests', label: 'Requests', badge: requests.length },
  ];

  return (
    <aside className={`fz-chat-inbox${hiddenOnMobile ? ' is-hidden-mobile' : ''}`} aria-label="Conversations">
      <header className="fz-chat-inbox__head">
        <div>
          <div className="fz-chat-eyebrow">FUZO</div>
          <h1 className="fz-chat-inbox__title">Messages</h1>
        </div>
        <button type="button" className="fz-chat-icon-btn fz-chat-icon-btn--accent" onClick={onNewChat} aria-label="New chat" title="New chat">
          <SquarePen size={18} />
        </button>
      </header>

      <div className="fz-chat-search">
        <Search size={16} aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations"
          aria-label="Search conversations"
          maxLength={60}
        />
      </div>

      <div className="fz-chat-tabs" role="tablist" aria-label="Filter conversations">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`fz-chat-tab${tab === t.key ? ' is-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.badge ? <span className="fz-chat-tab__badge">{t.badge}</span> : null}
          </button>
        ))}
      </div>

      <div className="fz-chat-inbox__list chat-hide-scrollbar">
        {isLoading ? (
          [0, 1, 2, 3, 4].map((i) => <div key={i} className="fz-chat-skeleton" />)
        ) : tab === 'requests' ? (
          requests.length === 0 ? (
            <EmptyList emoji="👋" title="No requests" sub="When someone follows you, their request shows up here." />
          ) : (
            requests.map((r) => (
              <div key={r.requestId} className="fz-chat-request">
                <ChatAvatar id={r.from.id} name={r.from.name} src={r.from.avatar} size={46} />
                <div className="fz-chat-request__who">
                  <span className="fz-chat-request__name">{r.from.name}</span>
                  <span className="fz-chat-request__sub">@{r.from.username} wants to follow you</span>
                </div>
                <div className="fz-chat-request__actions">
                  <button type="button" className="fz-chat-pill fz-chat-pill--accent" onClick={() => onAcceptRequest(r)}>Accept</button>
                  <button type="button" className="fz-chat-pill" onClick={() => onDeclineRequest(r)}>Decline</button>
                </div>
              </div>
            ))
          )
        ) : visible.length === 0 ? (
          threads.length === 0 ? (
            <EmptyList emoji="💬" title="No conversations yet" sub="Start a chat with a friend or create a group." action={{ label: 'New chat', onClick: onNewChat }} />
          ) : (
            <EmptyList emoji="🔍" title="Nothing found" sub={tab === 'unread' ? 'You’re all caught up.' : 'Try a different search.'} />
          )
        ) : (
          visible.map((t) => (
            <button
              key={threadKey(t)}
              type="button"
              className={`fz-chat-row${activeKey === threadKey(t) ? ' is-active' : ''}${t.unread > 0 ? ' has-unread' : ''}`}
              onClick={() => onSelect(t)}
            >
              <ChatAvatar id={t.peerId ?? t.id} name={t.title} src={t.avatar} size={50} group={t.type === 'group'} online={t.type === 'dm' && !!t.peerId && onlineIds.has(t.peerId)} />
              <span className="fz-chat-row__body">
                <span className="fz-chat-row__top">
                  <span className="fz-chat-row__name">{t.title}</span>
                  <span className="fz-chat-row__time">{formatInboxTime(t.lastAt ?? t.createdAt)}</span>
                </span>
                <span className="fz-chat-row__bottom">
                  <span className="fz-chat-row__preview">
                    {t.lastAt ? (
                      <>
                        {t.lastMine && <span className="fz-chat-row__you">You: </span>}
                        {t.lastText}
                      </>
                    ) : (
                      <span className="fz-chat-row__empty"><Lock size={11} /> Say hello — it’s end-to-end encrypted</span>
                    )}
                  </span>
                  {t.unread > 0 && <span className="fz-chat-row__unread" aria-label={`${t.unread} unread`}>{t.unread > 99 ? '99+' : t.unread}</span>}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}

function EmptyList({ emoji, title, sub, action }: { emoji: string; title: string; sub: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="fz-empty-state">
      <div className="fz-empty-state__icon">{emoji}</div>
      <div className="fz-empty-state__title">{title}</div>
      <div className="fz-empty-state__sub">{sub}</div>
      {action && <button type="button" className="fz-chat-pill fz-chat-pill--accent" onClick={action.onClick}>{action.label}</button>}
    </div>
  );
}
