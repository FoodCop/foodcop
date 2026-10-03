'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Check, Copy, Lock, Mail, MessageCircle, Send, Share2, Users, X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import ChatAvatar from '@/components/chat/ChatAvatar';
import { ChatService, type ChatContact, type ChatGroup } from '@/lib/services/chatService';
import { FriendRequestService } from '@/lib/services/friendRequestService';
import { PointsService } from '@/lib/services/pointsService';
import type { AppItem } from '@/types/appItem';
import { fuzoLinkForItem } from '@/lib/share/itemLinks';

// One share sheet for every Share button in the app. It asks WHERE to share:
//   1. On FUZO - tap a friend or group and the item is sent into that chat
//      (end-to-end encrypted, as a card they can open), and
//   2. Other apps - the device's own share menu (every installed app) when the
//      browser has one, plus WhatsApp / Telegram / X / Facebook / Email links
//      and Copy link, which work everywhere.

export interface SharePayload {
  /** Shown in the preview and used as the share title. */
  title: string;
  /** Short line under the title, e.g. "Recipe · 20 min". */
  subtitle?: string;
  image?: string;
  /** Absolute or same-origin path; made absolute before sharing. */
  url: string;
  /** Message text for other apps (defaults to "Check out <title> on FUZO"). */
  text?: string;
  /** Card sent into FUZO chats. Without it, the FUZO row is hidden. */
  item?: AppItem;
}

/** Share details for any app item (saved items, chat cards): picks the link that opens it in FUZO. */
export function sharePayloadFromItem(item: AppItem): SharePayload {
  const title = item.name || item.title || 'this find';
  const url = fuzoLinkForItem(item) ?? '/dashboard';
  return {
    title,
    subtitle: item.address || item.cat || undefined,
    image: item.img || undefined,
    url,
    text: `Check out ${title} on FUZO`,
    item,
  };
}

type Target = { key: string; name: string; avatar: string | null; group: boolean; send: () => ReturnType<typeof ChatService.sendSharedItemMessage> };
type SendState = 'sending' | 'sent' | 'error';

export default function ShareSheet({ payload, onClose }: { payload: SharePayload | null; onClose: () => void }) {
  if (!payload || typeof document === 'undefined') return null;
  return createPortal(<ShareSheetInner payload={payload} onClose={onClose} />, document.body);
}

function ShareSheetInner({ payload, onClose }: { payload: SharePayload; onClose: () => void }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [targets, setTargets] = useState<Target[] | null>(null);
  const [states, setStates] = useState<Record<string, SendState>>({});
  const [lockedNotice, setLockedNotice] = useState(false);
  const [errorNote, setErrorNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const url = payload.url.startsWith('http') ? payload.url : `${window.location.origin}${payload.url}`;
  const text = payload.text ?? `Check out ${payload.title} on FUZO`;
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const showFuzo = Boolean(payload.item && userId);

  // Close on Escape; lock page scroll behind the sheet.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // Friends (accepted) + groups you're in = who you can send to on FUZO.
  useEffect(() => {
    if (!showFuzo || !userId || !payload.item) return;
    const item = payload.item;
    let cancelled = false;
    Promise.all([
      FriendRequestService.listAcceptedFriendIds(userId),
      ChatService.listContacts(userId),
      ChatService.listGroups(userId),
    ]).then(([ids, contacts, groups]) => {
      if (cancelled) return;
      const friendIds = new Set(ids.success ? ids.data ?? [] : []);
      const friends = (contacts.success ? contacts.data ?? [] : []).filter((c: ChatContact) => friendIds.has(c.id));
      const groupList = groups.success ? groups.data ?? [] : [];
      setTargets([
        ...friends.map((f) => ({
          key: `dm:${f.id}`,
          name: f.name,
          avatar: f.avatar,
          group: false,
          send: async () => {
            const convo = await ChatService.getOrCreateConversation(userId, f.id);
            if (!convo.success || !convo.data) return { success: false as const, error: 'Could not open that chat' };
            return ChatService.sendSharedItemMessage({ conversationId: convo.data.id, senderId: userId, item });
          },
        })),
        ...groupList.map((g: ChatGroup) => ({
          key: `group:${g.id}`,
          name: g.name,
          avatar: g.avatarUrl ?? null,
          group: true,
          send: () => ChatService.sendGroupSharedItemMessage({ groupId: g.id, senderId: userId, item }),
        })),
      ]);
    });
    return () => {
      cancelled = true;
    };
  }, [showFuzo, userId, payload.item]);

  const sendTo = async (t: Target) => {
    if (states[t.key] === 'sending' || states[t.key] === 'sent') return;
    setErrorNote(null);
    setStates((s) => ({ ...s, [t.key]: 'sending' }));
    const res = await t.send();
    if (res.success && res.data) {
      setStates((s) => ({ ...s, [t.key]: 'sent' }));
      PointsService.awardPoints({ actionType: 'share_card', sourceType: 'share', sourceId: res.data.id });
      return;
    }
    setStates((s) => ({ ...s, [t.key]: 'error' }));
    const code = 'code' in res ? res.code : undefined;
    if (code === 'not-ready') setLockedNotice(true);
    else setErrorNote(('error' in res && res.error) || 'Could not send. Please try again.');
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: payload.title, text, url });
    } catch {
      // share menu dismissed
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setErrorNote('Could not copy the link.');
    }
  };

  const enc = encodeURIComponent;
  const apps = [
    { key: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${enc(`${text} ${url}`)}`, icon: <MessageCircle size={20} /> },
    { key: 'telegram', label: 'Telegram', href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`, icon: <Send size={19} /> },
    { key: 'x', label: 'X', href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`, icon: <span className="fz-share__glyph">𝕏</span> },
    { key: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, icon: <span className="fz-share__glyph">f</span> },
    { key: 'email', label: 'Email', href: `mailto:?subject=${enc(payload.title)}&body=${enc(`${text}\n${url}`)}`, icon: <Mail size={19} /> },
  ];

  return (
    <div className="fz-share" role="presentation" onClick={onClose}>
      <div className="fz-share__sheet" role="dialog" aria-modal="true" aria-labelledby="fz-share-title" onClick={(e) => e.stopPropagation()}>
        <span className="fz-share__handle" aria-hidden="true" />
        <div className="fz-share__head">
          <h2 id="fz-share-title" className="fz-share__title">Share</h2>
          <button type="button" className="fz-share__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="fz-share__preview">
          {payload.image ? <img src={payload.image} alt="" /> : <span className="fz-share__preview-ph" aria-hidden="true">🍽️</span>}
          <div className="fz-share__preview-text">
            <strong>{payload.title}</strong>
            <span>{payload.subtitle ?? url.replace(/^https?:\/\//, '')}</span>
          </div>
        </div>

        {showFuzo && (
          <section className="fz-share__section">
            <h3 className="fz-share__label">Send on FUZO</h3>
            {lockedNotice && (
              <div className="fz-share__notice">
                <Lock size={14} /> Secure messaging is locked on this device.{' '}
                <Link href="/messages" onClick={onClose}>Unlock in Messages</Link>
              </div>
            )}
            {targets === null ? (
              <div className="fz-share__people" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="fz-share__person fz-share__person--ghost"><span /></span>
                ))}
              </div>
            ) : targets.length === 0 ? (
              <p className="fz-share__empty">
                <Users size={14} /> No friends yet. <Link href="/messages" onClick={onClose}>Find friends in Messages</Link>
              </p>
            ) : (
              <div className="fz-share__people">
                {targets.map((t) => {
                  const st = states[t.key];
                  return (
                    <button
                      key={t.key}
                      type="button"
                      className={`fz-share__person${st ? ` is-${st}` : ''}`}
                      onClick={() => sendTo(t)}
                      aria-label={st === 'sent' ? `Sent to ${t.name}` : `Send to ${t.name}`}
                    >
                      <span className="fz-share__avatar">
                        <ChatAvatar id={t.key} name={t.name} src={t.avatar} size={52} group={t.group} />
                        {st === 'sending' && <span className="fz-share__badge"><span className="spinner-border spinner-border-sm" /></span>}
                        {st === 'sent' && <span className="fz-share__badge fz-share__badge--sent"><Check size={14} strokeWidth={3} /></span>}
                      </span>
                      <span className="fz-share__name">{st === 'sent' ? 'Sent' : t.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <section className="fz-share__section">
          <h3 className="fz-share__label">Share to apps</h3>
          <div className="fz-share__apps">
            {canNativeShare && (
              <button type="button" className="fz-share__app" onClick={nativeShare}>
                <span className="fz-share__app-icon fz-share__app-icon--more"><Share2 size={20} /></span>
                <span>More apps</span>
              </button>
            )}
            {apps.map((a) => (
              <a key={a.key} className="fz-share__app" href={a.href} target="_blank" rel="noopener noreferrer">
                <span className={`fz-share__app-icon fz-share__app-icon--${a.key}`}>{a.icon}</span>
                <span>{a.label}</span>
              </a>
            ))}
            <button type="button" className="fz-share__app" onClick={copyLink}>
              <span className={`fz-share__app-icon fz-share__app-icon--copy${copied ? ' is-done' : ''}`}>
                {copied ? <Check size={20} strokeWidth={3} /> : <Copy size={19} />}
              </span>
              <span>{copied ? 'Copied' : 'Copy link'}</span>
            </button>
          </div>
        </section>

        {errorNote && <p className="fz-share__error" role="alert">{errorNote}</p>}
      </div>
    </div>
  );
}
