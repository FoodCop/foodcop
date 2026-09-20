'use client';

import { useEffect, useState } from 'react';
import { Search, Check, Loader2, AlertCircle } from 'lucide-react';
import { ChatService, type ChatContact } from '@/lib/services/chatService';
import { FriendRequestService, type FriendRelationshipState } from '@/lib/services/friendRequestService';
import ChatAvatar from './ChatAvatar';
import { DialogShell } from './ChatThread';

type Tab = 'friends' | 'find' | 'group';

export default function NewChatModal({
  userId,
  friends,
  blockedIds,
  onClose,
  onOpenDm,
  onCreateGroup,
}: {
  userId: string;
  friends: ChatContact[];
  blockedIds: string[];
  onClose: () => void;
  onOpenDm: (friend: ChatContact) => void;
  /** Resolves to an error message, or null on success. */
  onCreateGroup: (name: string, memberIds: string[]) => Promise<string | null>;
}) {
  const [tab, setTab] = useState<Tab>('friends');

  return (
    <DialogShell title="New chat" onClose={onClose}>
      <div className="fz-chat-tabs fz-chat-tabs--modal" role="tablist">
        {([['friends', 'Friends'], ['find', 'Find people'], ['group', 'New group']] as const).map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={`fz-chat-tab${tab === key ? ' is-active' : ''}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'friends' && <FriendsTab friends={friends} onPick={onOpenDm} onFind={() => setTab('find')} />}
      {tab === 'find' && <FindTab userId={userId} friends={friends} blockedIds={blockedIds} onOpenDm={onOpenDm} />}
      {tab === 'group' && <GroupTab friends={friends} onCreate={onCreateGroup} />}
    </DialogShell>
  );
}

function FriendsTab({ friends, onPick, onFind }: { friends: ChatContact[]; onPick: (f: ChatContact) => void; onFind: () => void }) {
  const [q, setQ] = useState('');
  const list = friends.filter((f) => `${f.name} ${f.username}`.toLowerCase().includes(q.trim().toLowerCase()));

  if (friends.length === 0) {
    return (
      <div className="fz-empty-state">
        <div className="fz-empty-state__icon">🤝</div>
        <div className="fz-empty-state__title">No friends to message yet</div>
        <div className="fz-empty-state__sub">You can message people once you follow each other.</div>
        <button type="button" className="fz-chat-pill fz-chat-pill--accent" onClick={onFind}>Find people</button>
      </div>
    );
  }
  return (
    <>
      <div className="fz-chat-search fz-chat-search--modal">
        <Search size={16} aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search friends" aria-label="Search friends" maxLength={60} autoFocus />
      </div>
      <ul className="fz-chat-people">
        {list.map((f) => (
          <li key={f.id}>
            <button type="button" onClick={() => onPick(f)}>
              <ChatAvatar id={f.id} name={f.name} src={f.avatar} size={42} />
              <span className="fz-chat-people__who"><span className="fz-chat-people__name">{f.name}</span><span className="fz-chat-people__sub">@{f.username}</span></span>
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="fz-chat-people__none">No friends match “{q}”.</li>}
      </ul>
    </>
  );
}

function FindTab({ userId, friends, blockedIds, onOpenDm }: { userId: string; friends: ChatContact[]; blockedIds: string[]; onOpenDm: (f: ChatContact) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<ChatContact[]>([]);
  const [rels, setRels] = useState<Record<string, FriendRelationshipState>>({});
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return; // results are ignored below this length
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      const found = await ChatService.searchPeople(term, userId);
      const people = (found.success ? found.data ?? [] : []).filter((p) => !blockedIds.includes(p.id));
      const relResult = people.length ? await FriendRequestService.getRelationshipsForUsers(userId, people.map((p) => p.id)) : null;
      if (cancelled) return;
      const map: Record<string, FriendRelationshipState> = {};
      for (const p of people) map[p.id] = relResult?.success ? relResult.data?.[p.id]?.state ?? 'none' : 'none';
      setResults(people);
      setRels(map);
      setSearching(false);
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q, userId, blockedIds]);

  const follow = async (p: ChatContact) => {
    setBusyId(p.id);
    const r = await FriendRequestService.sendRequest(userId, p.id);
    if (r.success) setRels((prev) => ({ ...prev, [p.id]: 'outgoing-pending' }));
    setBusyId(null);
  };

  return (
    <>
      <div className="fz-chat-search fz-chat-search--modal">
        <Search size={16} aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or username" aria-label="Search people" maxLength={40} autoFocus />
        {searching && <Loader2 size={15} className="chat-spin" />}
      </div>
      {q.trim().length < 2 ? (
        <p className="fz-chat-dialog__text">Type at least 2 letters. You can message someone once you follow each other.</p>
      ) : (
        <ul className="fz-chat-people">
          {results.map((p) => {
            const state = rels[p.id] ?? 'none';
            const isFriend = state === 'accepted' || friends.some((f) => f.id === p.id);
            return (
              <li key={p.id}>
                <div className="fz-chat-people__row">
                  <ChatAvatar id={p.id} name={p.name} src={p.avatar} size={42} />
                  <span className="fz-chat-people__who"><span className="fz-chat-people__name">{p.name}</span><span className="fz-chat-people__sub">@{p.username}</span></span>
                  {isFriend ? (
                    <button type="button" className="fz-chat-pill fz-chat-pill--accent" onClick={() => onOpenDm(p)}>Message</button>
                  ) : state === 'outgoing-pending' ? (
                    <span className="fz-chat-pill fz-chat-pill--muted"><Check size={13} /> Requested</span>
                  ) : state === 'incoming-pending' ? (
                    <span className="fz-chat-pill fz-chat-pill--muted">Sent you a request</span>
                  ) : (
                    <button type="button" className="fz-chat-pill fz-chat-pill--accent" onClick={() => follow(p)} disabled={busyId === p.id}>{busyId === p.id ? '…' : 'Follow'}</button>
                  )}
                </div>
              </li>
            );
          })}
          {!searching && results.length === 0 && <li className="fz-chat-people__none">No one found for “{q.trim()}”.</li>}
        </ul>
      )}
    </>
  );
}

function GroupTab({ friends, onCreate }: { friends: ChatContact[]; onCreate: (name: string, memberIds: string[]) => Promise<string | null> }) {
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const ready = name.trim().length > 0 && picked.length > 0 && !busy;

  if (friends.length === 0) {
    return (
      <div className="fz-empty-state">
        <div className="fz-empty-state__icon">👥</div>
        <div className="fz-empty-state__title">Follow people first</div>
        <div className="fz-empty-state__sub">Groups can only include friends you follow each other.</div>
      </div>
    );
  }

  return (
    <>
      <input className="fz-chat-dialog__input" value={name} onChange={(e) => { setName(e.target.value); setError(null); }} placeholder="Group name" maxLength={60} aria-label="Group name" disabled={busy} />
      <p className="fz-chat-dialog__label">Add friends {picked.length > 0 && <span>· {picked.length} selected</span>}</p>
      <ul className="fz-chat-people fz-chat-people--picker">
        {friends.map((f) => (
          <li key={f.id}>
            <button type="button" onClick={() => toggle(f.id)} className={picked.includes(f.id) ? 'is-selected' : ''} disabled={busy} aria-pressed={picked.includes(f.id)}>
              <ChatAvatar id={f.id} name={f.name} src={f.avatar} size={38} />
              <span className="fz-chat-people__who"><span className="fz-chat-people__name">{f.name}</span><span className="fz-chat-people__sub">@{f.username}</span></span>
              <span className="fz-chat-people__check">{picked.includes(f.id) && <Check size={14} />}</span>
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="fz-chat-dialog__error" role="alert"><AlertCircle size={14} /> {error}</p>}
      <div className="fz-chat-dialog__actions">
        <button
          type="button"
          className="fz-chat-pill fz-chat-pill--accent"
          disabled={!ready}
          onClick={async () => {
            setBusy(true);
            const err = await onCreate(name, picked);
            if (err) { setError(err); setBusy(false); }
          }}
        >
          {busy ? 'Creating…' : 'Create group'}
        </button>
      </div>
    </>
  );
}
