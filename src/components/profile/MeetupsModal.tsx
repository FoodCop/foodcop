'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarCheck, Clock, Lock, MapPin, X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { ChatService, type Meetup } from '@/lib/services/chatService';

// Tapping Meetups on your own profile (client list #7, 2026-11-04): the
// meetups you said you're going to. Invites live in encrypted chat messages,
// so they are read on this device; ones it can't open yet point to Messages.
// Reuses the .fz-remind sheet (bottom sheet on phones, centred card above).

type Load = { status: 'loading' } | { status: 'error' } | { status: 'done'; meetups: Meetup[] };

export default function MeetupsModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const reduce = useReducedMotion();
  const trapRef = useFocusTrap(true);
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    ChatService.listMeetups(userId).then((res) => {
      if (cancelled) return;
      setLoad(res.success ? { status: 'done', meetups: res.data ?? [] } : { status: 'error' });
    });
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return createPortal(
    <motion.div className="fz-remind" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}>
      <motion.div
        ref={trapRef}
        className="fz-remind__card fz-meetups"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fz-meetups-title"
        initial={reduce ? false : { y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="fz-remind__close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <h2 id="fz-meetups-title" className="fz-onb__title">Your meetups</h2>

        {load.status === 'loading' && (
          <div className="fz-meetups__state" role="status">
            <span className="spinner-border text-warning" aria-hidden="true" />
            <span className="visually-hidden">Loading meetups</span>
          </div>
        )}

        {load.status === 'error' && (
          <div className="fz-meetups__state" role="alert">
            <p>Couldn&apos;t load your meetups.</p>
            <button
              type="button"
              className="fz-meetups__cta"
              onClick={() => {
                setLoad({ status: 'loading' });
                setAttempt((n) => n + 1);
              }}
            >
              Try again
            </button>
          </div>
        )}

        {load.status === 'done' && load.meetups.length === 0 && (
          <div className="fz-meetups__state">
            <CalendarCheck size={32} aria-hidden="true" />
            <p>No meetups yet. Say you&apos;re going to an invite in a chat and it shows up here.</p>
            <Link href="/messages" className="fz-meetups__cta">Open Messages</Link>
          </div>
        )}

        {load.status === 'done' && load.meetups.length > 0 && (
          <ul className="fz-meetups__list">
            {load.meetups.map((m) => (
              <li key={m.id} className="fz-meetup">
                <span className="fz-meetup__art" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {m.image ? <img src={m.image} alt="" referrerPolicy="no-referrer" /> : m.locked ? <Lock size={20} /> : <CalendarCheck size={20} />}
                </span>
                <div className="fz-meetup__text">
                  <strong>{m.name}</strong>
                  {m.locked ? (
                    <Link href="/messages" className="fz-meetup__line">Unlock Messages to see this one</Link>
                  ) : (
                    <>
                      <span className="fz-meetup__line"><Clock size={13} aria-hidden="true" /> {[m.date, m.time].filter(Boolean).join(' · ') || 'Time to be confirmed'}</span>
                      <span className="fz-meetup__line"><MapPin size={13} aria-hidden="true" /> {m.location || 'Place to be confirmed'}</span>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
