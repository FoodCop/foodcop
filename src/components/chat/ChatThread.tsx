'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Bookmark, Calendar as CalendarIcon, Check, CheckCheck, Clock, EllipsisVertical, Lock,
  Send, Share2, ShieldAlert, Trash2, Undo2, X, AlertCircle,
} from 'lucide-react';
import { MAX_MESSAGE_CHARS, type ChatMessage, type GroupMember, type InboxThread, type ReportReason } from '@/lib/services/chatService';
import type { AppItem } from '@/types/appItem';
import { formatDayLabel, formatMessageTime, isSameDay } from '@/lib/chat/format';
import ChatAvatar from './ChatAvatar';
import { EventInviteCard } from './EventInviteCard';
import { EventCreateModal } from './EventCreateModal';

export interface UiMessage extends ChatMessage {
  status?: 'sending' | 'sent' | 'error';
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'other', label: 'Something else' },
];

interface ThreadProps {
  thread: InboxThread;
  userId: string;
  messages: UiMessage[];
  isLoading: boolean;
  online: boolean;
  typing: boolean;
  members: GroupMember[];
  /** DM only: false = the other person hasn't turned on secure messaging, so nothing can be sent yet. */
  peerReady: boolean | null;
  blocked: boolean;
  /** DM only: when the other person last read the chat (null if unknown / receipts off). */
  peerReadAt: string | null;
  sendNotice: string | null;
  onBack: () => void;
  onSend: (text: string) => void;
  onRetry: (message: UiMessage) => void;
  onSendEvent: (event: { name: string; date: string; time: string; location: string; description: string }) => void;
  onUnsend: (message: UiMessage) => void;
  onTypingChange: (isTyping: boolean) => void;
  onOpenProfile: (userId: string) => void;
  onBlock: () => void;
  onUnblock: () => void;
  onReport: (reason: ReportReason, details: string) => Promise<boolean>;
  onLeaveGroup: () => void;
  onSave: (item: AppItem) => void;
  onShareRequest: (item: AppItem) => void;
  /** Open the real thing a shared card points at (the card itself, a recipe, a place ...). */
  onOpenItem: (item: AppItem) => void;
}

export default function ChatThread(props: ThreadProps) {
  const {
    thread, userId, messages, isLoading, online, typing, members, peerReady, blocked, peerReadAt, sendNotice,
    onBack, onSend, onRetry, onSendEvent, onUnsend, onTypingChange, onOpenProfile, onBlock, onUnblock, onReport,
    onLeaveGroup, onSave, onShareRequest, onOpenItem,
  } = props;

  const isGroup = thread.type === 'group';
  const [draft, setDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEvent, setShowEvent] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [confirm, setConfirm] = useState<'block' | 'leave' | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const composerBlocked = blocked || (!isGroup && peerReady === false);
  const canSend = draft.trim().length > 0 && draft.length <= MAX_MESSAGE_CHARS && !composerBlocked;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, typing]);

  const send = () => {
    if (!canSend) return;
    onSend(draft.trim());
    setDraft('');
    onTypingChange(false);
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleChange = (value: string) => {
    setDraft(value);
    onTypingChange(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => onTypingChange(false), 2000);
    const el = inputRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }
  };

  const lastMineId = [...messages].reverse().find((m) => m.senderId === userId && m.status !== 'error')?.id;
  const seen = !isGroup && !!peerReadAt && lastMineId
    ? new Date(peerReadAt).getTime() >= new Date(messages.find((m) => m.id === lastMineId)?.createdAt ?? 0).getTime()
    : false;

  const subtitle = isGroup
    ? `${members.length || ''} ${members.length === 1 ? 'member' : 'members'}`.trim()
    : online ? 'Active now' : 'End-to-end encrypted';

  return (
    <section className="fz-chat-thread" aria-label={`Conversation with ${thread.title}`}>
      {/* ── Header ── */}
      <header className="fz-chat-thread__head">
        <button type="button" className="fz-chat-icon-btn fz-chat-thread__back" onClick={onBack} aria-label="Back to conversations">
          <ArrowLeft size={20} />
        </button>
        <button
          type="button"
          className="fz-chat-thread__who"
          onClick={() => { if (isGroup) setShowMembers(true); else if (thread.peerId) onOpenProfile(thread.peerId); }}
        >
          <ChatAvatar id={thread.peerId ?? thread.id} name={thread.title} src={thread.avatar} size={42} group={isGroup} online={online} />
          <span className="fz-chat-thread__names">
            <span className="fz-chat-thread__name">{thread.title}</span>
            <span className={`fz-chat-thread__status${online ? ' is-online' : ''}`}>
              {!isGroup && !online && <Lock size={11} />} {subtitle}
            </span>
          </span>
        </button>
        <div className="fz-chat-thread__menu-wrap">
          <button type="button" className="fz-chat-icon-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Conversation options" aria-expanded={menuOpen}>
            <EllipsisVertical size={20} />
          </button>
          {menuOpen && (
            <>
              <div className="fz-chat-menu-scrim" onClick={() => setMenuOpen(false)} />
              <div className="fz-chat-menu" role="menu">
                {isGroup ? (
                  <>
                    <button role="menuitem" onClick={() => { setMenuOpen(false); setShowMembers(true); }}>Group members</button>
                    <button role="menuitem" className="is-danger" onClick={() => { setMenuOpen(false); setConfirm('leave'); }}>Leave group</button>
                  </>
                ) : (
                  <>
                    <button role="menuitem" onClick={() => { setMenuOpen(false); if (thread.peerId) onOpenProfile(thread.peerId); }}>View profile</button>
                    {blocked ? (
                      <button role="menuitem" onClick={() => { setMenuOpen(false); onUnblock(); }}>Unblock</button>
                    ) : (
                      <button role="menuitem" className="is-danger" onClick={() => { setMenuOpen(false); setConfirm('block'); }}>Block</button>
                    )}
                    <button role="menuitem" className="is-danger" onClick={() => { setMenuOpen(false); setShowReport(true); }}>Report</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Messages ── */}
      <div className="fz-chat-thread__messages chat-hide-scrollbar" role="log" aria-live="polite">
        <div className="fz-chat-e2ee-note">
          <Lock size={13} /> Messages are end-to-end encrypted. Only people in this chat can read them — not even FUZO.
        </div>

        {isLoading ? (
          <div className="fz-chat-thread__loading" aria-busy="true"><div className="fz-chat-skeleton" /><div className="fz-chat-skeleton fz-chat-skeleton--right" /><div className="fz-chat-skeleton" /></div>
        ) : messages.length === 0 ? (
          <div className="fz-chat-thread__empty">
            <div className="fz-chat-thread__empty-icon">👋</div>
            <p>No messages yet. Say hello to {thread.title}!</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const mine = m.senderId === userId;
            const newDay = !prev || !isSameDay(prev.createdAt, m.createdAt);
            const startsCluster = newDay || prev.senderId !== m.senderId;
            const endsCluster = !next || next.senderId !== m.senderId || !isSameDay(next.createdAt, m.createdAt);
            const sender = memberById.get(m.senderId);
            return (
              <div key={m.id}>
                {newDay && <div className="fz-chat-day"><span>{formatDayLabel(m.createdAt)}</span></div>}
                <MessageRow
                  message={m}
                  mine={mine}
                  showSender={isGroup && !mine && startsCluster}
                  senderName={sender?.name ?? 'Member'}
                  showAvatar={isGroup && !mine}
                  senderId={m.senderId}
                  senderAvatar={sender?.avatar ?? null}
                  isLastInCluster={endsCluster}
                  userId={userId}
                  seen={seen && m.id === lastMineId}
                  onUnsend={() => onUnsend(m)}
                  onRetry={() => onRetry(m)}
                  onSave={onSave}
                  onShareRequest={onShareRequest}
                  onOpenItem={onOpenItem}
                />
              </div>
            );
          })
        )}

        {typing && (
          <div className="fz-chat-typing" aria-label={`${thread.title} is typing`}>
            <span /><span /><span />
          </div>
        )}
        <div ref={endRef} />
      </div>

      {sendNotice && !composerBlocked && (
        <div className="fz-chat-notice fz-chat-notice--error" role="alert"><AlertCircle size={15} /> {sendNotice}</div>
      )}

      {/* ── Composer ── */}
      {blocked ? (
        <div className="fz-chat-notice">
          <ShieldAlert size={15} /> You blocked {thread.title}.
          <button type="button" className="fz-chat-pill" onClick={onUnblock}>Unblock</button>
        </div>
      ) : !isGroup && peerReady === false ? (
        <div className="fz-chat-notice">
          <Lock size={15} /> {thread.title} hasn’t turned on secure messaging yet. You’ll be able to message them as soon as they open Messages and set it up.
        </div>
      ) : (
        <footer className="fz-chat-composer">
          <button type="button" className="fz-chat-icon-btn" onClick={() => setShowEvent(true)} aria-label="Plan a meetup" title="Plan a meetup">
            <CalendarIcon size={19} />
          </button>
          <div className="fz-chat-composer__field">
            <textarea
              ref={inputRef}
              value={draft}
              rows={1}
              maxLength={MAX_MESSAGE_CHARS + 200}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Write a message"
              aria-label="Message"
              className="chat-hide-scrollbar"
            />
            {draft.length > MAX_MESSAGE_CHARS - 300 && (
              <span className={`fz-chat-composer__count${draft.length > MAX_MESSAGE_CHARS ? ' is-over' : ''}`}>
                {draft.length}/{MAX_MESSAGE_CHARS}
              </span>
            )}
          </div>
          <button type="button" className="fz-chat-send" onClick={send} disabled={!canSend} aria-label="Send message">
            <Send size={18} />
          </button>
        </footer>
      )}

      {showEvent && <EventCreateModal onClose={() => setShowEvent(false)} onSubmit={(e) => { setShowEvent(false); onSendEvent(e); }} />}

      {showReport && (
        <ReportDialog
          name={thread.title}
          onClose={() => setShowReport(false)}
          onSubmit={async (reason, details) => {
            const ok = await onReport(reason, details);
            if (ok) setShowReport(false);
            return ok;
          }}
        />
      )}

      {showMembers && <MembersDialog members={members} userId={userId} onClose={() => setShowMembers(false)} onOpenProfile={onOpenProfile} />}

      {confirm && (
        <ConfirmDialog
          title={confirm === 'block' ? `Block ${thread.title}?` : `Leave “${thread.title}”?`}
          body={confirm === 'block'
            ? 'They won’t be able to message you or send you follow requests, and you’ll stop following each other. You can unblock them any time.'
            : 'You’ll stop receiving messages from this group. You can only rejoin if the group’s creator adds you back.'}
          confirmLabel={confirm === 'block' ? 'Block' : 'Leave'}
          onCancel={() => setConfirm(null)}
          onConfirm={() => { const c = confirm; setConfirm(null); if (c === 'block') onBlock(); else onLeaveGroup(); }}
        />
      )}
    </section>
  );
}

// ─────────────────────────────── message row ───────────────────────────────

function MessageRow({
  message: m, mine, showSender, senderName, showAvatar, senderId, senderAvatar, isLastInCluster, userId, seen,
  onUnsend, onRetry, onSave, onShareRequest, onOpenItem,
}: {
  message: UiMessage;
  mine: boolean;
  showSender: boolean;
  senderName: string;
  showAvatar: boolean;
  senderId: string;
  senderAvatar: string | null;
  isLastInCluster: boolean;
  userId: string;
  seen: boolean;
  onUnsend: () => void;
  onRetry: () => void;
  onSave: (item: AppItem) => void;
  onShareRequest: (item: AppItem) => void;
  onOpenItem: (item: AppItem) => void;
}) {
  const [menu, setMenu] = useState(false);
  const item = m.sharedItem;
  const isEvent = item?.itemType === 'event';
  const isLocal = m.id.startsWith('local-');

  const openItem = () => onOpenItem(item as AppItem);

  return (
    <div className={`fz-chat-msg${mine ? ' is-mine' : ''}${isLastInCluster ? ' is-last' : ''}${item ? ' has-card' : ''}`}>
      {showAvatar && (
        <span className="fz-chat-msg__avatar">
          {isLastInCluster ? <ChatAvatar id={senderId} name={senderName} src={senderAvatar} size={28} /> : null}
        </span>
      )}
      <div className="fz-chat-msg__col">
        {showSender && <span className="fz-chat-msg__sender">{senderName}</span>}

        <div className="fz-chat-msg__line">
          {mine && !isLocal && m.status !== 'error' && (
            <div className="fz-chat-msg__tools">
              <button type="button" className="fz-chat-msg__tool" onClick={() => setMenu((o) => !o)} aria-label="Message options" aria-expanded={menu}>
                <EllipsisVertical size={15} />
              </button>
              {menu && (
                <>
                  <div className="fz-chat-menu-scrim" onClick={() => setMenu(false)} />
                  <div className="fz-chat-menu fz-chat-menu--small" role="menu">
                    <button role="menuitem" className="is-danger" onClick={() => { setMenu(false); onUnsend(); }}><Trash2 size={14} /> Unsend</button>
                  </div>
                </>
              )}
            </div>
          )}

          {m.undecryptable ? (
            <div className="fz-chat-bubble fz-chat-bubble--locked" title="This device doesn’t have the key for this message.">
              <Lock size={13} /> Can’t decrypt this message
            </div>
          ) : isEvent && item ? (
            <EventInviteCard messageId={m.id} userId={userId} event={item} role={mine ? 'user' : 'ai'} />
          ) : item ? (
            <div className="fz-chat-link">
              {/* iMessage-style link preview: tap the card to open it; Save / Share sit beside it. */}
              <button
                type="button"
                className="fz-chat-link__card"
                // The caption band is the cover itself, zoomed and blurred, so it always matches the photo's colours.
                style={item.img ? { ['--cover' as string]: `url("${item.img.replace(/"/g, '%22')}")` } : undefined}
                onClick={openItem}
                aria-label={`Open ${item.name || item.title || 'shared item'}`}
              >
                <span className="fz-chat-link__media">
                  {item.img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.img} alt="" referrerPolicy="no-referrer" />
                  )}
                  <span className="fz-chat-link__scrim" aria-hidden />
                  <span className="fz-chat-link__headline">{item.name || item.title || 'Shared item'}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="fz-chat-link__mark" src="/fuzo_logo.svg" alt="" aria-hidden />
                </span>
                <span className="fz-chat-link__caption">
                  <span className="fz-chat-link__title">{item.cat || 'Food card'}</span>
                  <span className="fz-chat-link__sub">{item.caption || item.address || 'Shared on FUZO'}</span>
                </span>
              </button>
              <div className="fz-chat-link__side">
                <button type="button" className="fz-chat-link__round" onClick={() => onSave(item)} aria-label="Save" title="Save"><Bookmark size={16} /></button>
                <button type="button" className="fz-chat-link__round" onClick={() => onShareRequest(item)} aria-label="Share" title="Share"><Share2 size={16} /></button>
              </div>
            </div>
          ) : (
            <div className={`fz-chat-bubble${mine ? ' is-mine' : ''}${m.status === 'error' ? ' is-error' : ''}`}>{m.content}</div>
          )}
        </div>

        {(isLastInCluster || m.status === 'error') && (
          <div className="fz-chat-msg__meta">
            {m.status === 'error' ? (
              <button type="button" className="fz-chat-msg__retry" onClick={onRetry}><Undo2 size={12} /> Failed to send — tap to retry</button>
            ) : (
              <>
                <span>{formatMessageTime(m.createdAt)}</span>
                {!m.encrypted && !m.undecryptable && <span className="fz-chat-msg__legacy" title="Sent before end-to-end encryption was turned on">not encrypted</span>}
                {mine && (
                  m.status === 'sending' ? <Clock size={12} aria-label="Sending" />
                  : seen ? <span className="fz-chat-msg__seen"><CheckCheck size={13} /> Seen</span>
                  : <Check size={13} aria-label="Sent" />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────── dialogs ───────────────────────────────

export function DialogShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fz-chat-dialog-scrim" onClick={onClose}>
      <div className="fz-chat-dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="fz-chat-dialog__head">
          <h2>{title}</h2>
          <button type="button" className="fz-chat-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConfirmDialog({ title, body, confirmLabel, onCancel, onConfirm }: { title: string; body: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <DialogShell title={title} onClose={onCancel}>
      <p className="fz-chat-dialog__text">{body}</p>
      <div className="fz-chat-dialog__actions">
        <button type="button" className="fz-chat-pill" onClick={onCancel}>Cancel</button>
        <button type="button" className="fz-chat-pill fz-chat-pill--danger" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </DialogShell>
  );
}

function ReportDialog({ name, onClose, onSubmit }: { name: string; onClose: () => void; onSubmit: (reason: ReportReason, details: string) => Promise<boolean> }) {
  const [reason, setReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <DialogShell title={`Report ${name}`} onClose={onClose}>
      <p className="fz-chat-dialog__text">
        Because chats are end-to-end encrypted, we can’t see your messages. Tell us what happened and we’ll review the account.
      </p>
      <div className="fz-chat-dialog__radios" role="radiogroup" aria-label="Reason">
        {REPORT_REASONS.map((r) => (
          <label key={r.value} className={`fz-chat-radio${reason === r.value ? ' is-selected' : ''}`}>
            <input type="radio" name="report-reason" checked={reason === r.value} onChange={() => setReason(r.value)} />
            {r.label}
          </label>
        ))}
      </div>
      <textarea
        className="fz-chat-dialog__textarea"
        placeholder="Add details (optional)"
        maxLength={1000}
        rows={3}
        value={details}
        onChange={(e) => setDetails(e.target.value)}
      />
      {failed && <p className="fz-chat-dialog__error" role="alert">Couldn’t send your report. Please try again.</p>}
      <div className="fz-chat-dialog__actions">
        <button type="button" className="fz-chat-pill" onClick={onClose}>Cancel</button>
        <button
          type="button"
          className="fz-chat-pill fz-chat-pill--accent"
          disabled={busy}
          onClick={async () => { setBusy(true); setFailed(false); const ok = await onSubmit(reason, details); if (!ok) { setFailed(true); setBusy(false); } }}
        >
          {busy ? 'Sending…' : 'Submit report'}
        </button>
      </div>
    </DialogShell>
  );
}

function MembersDialog({ members, userId, onClose, onOpenProfile }: { members: GroupMember[]; userId: string; onClose: () => void; onOpenProfile: (id: string) => void }) {
  return (
    <DialogShell title={`Members (${members.length})`} onClose={onClose}>
      <ul className="fz-chat-members">
        {members.map((m) => (
          <li key={m.id}>
            <button type="button" onClick={() => { if (m.id !== userId) onOpenProfile(m.id); }}>
              <ChatAvatar id={m.id} name={m.name} src={m.avatar} size={40} />
              <span className="fz-chat-members__who">
                <span className="fz-chat-members__name">{m.name}{m.id === userId && ' (you)'}</span>
                <span className="fz-chat-members__sub">@{m.username}</span>
              </span>
              {m.role === 'admin' && <span className="fz-chat-members__role">Admin</span>}
            </button>
          </li>
        ))}
      </ul>
    </DialogShell>
  );
}
