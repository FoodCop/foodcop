'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronRight, ImageOff, Loader2, Trash2, X } from 'lucide-react';
import { PostService } from '@/lib/services/postService';
import type { FoodCardRecord } from '@/lib/types/foodCard';
import { KIND_OPTIONS, VIDEO_KIND_OPTIONS } from './KindPicker';
import { kindOfCard, videoKindOfCard } from './fromCard';

// Unfinished posts (client, 2026-10-14; plan Phase 8: "Drafts yes"). Opened
// from the camera's "Drafts" button: pick one to finish it, or delete it.

interface DraftsSheetProps {
  open: boolean;
  drafts: FoodCardRecord[];
  onClose: () => void;
  onOpenDraft: (card: FoodCardRecord) => void;
  onDeleted: (id: string) => void;
}

const savedAgo = (iso: string) => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'Saved just now';
  if (mins < 60) return `Saved ${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Saved ${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `Saved ${days} ${days === 1 ? 'day' : 'days'} ago`;
  return `Saved ${new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
};

export function DraftsSheet({ open, drafts, onClose, onOpenDraft, onDeleted }: DraftsSheetProps) {
  const reduceMotion = useReducedMotion();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  const remove = async (id: string) => {
    setDeletingId(id);
    setError(null);
    const res = await PostService.remove(id);
    setDeletingId(null);
    setConfirmId(null);
    if (!res.success) {
      setError(res.error || 'Could not delete the draft.');
      return;
    }
    onDeleted(id);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="cf-confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="cf-confirm__sheet cf-drafts"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cf-drafts-title"
            initial={reduceMotion ? false : { y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 40, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cf-drafts__head">
              <h2 id="cf-drafts-title" className="cf-confirm__title">
                Drafts
              </h2>
              <button ref={closeRef} type="button" className="cf-drafts__close" onClick={onClose} aria-label="Close drafts">
                <X size={18} />
              </button>
            </div>

            {drafts.length === 0 ? (
              <p className="cf-confirm__text">No drafts. Posts you save for later show up here.</p>
            ) : (
              <ul className="cf-drafts__list">
                {drafts.map((d) => {
                  const kind = kindOfCard(d);
                  const vKind = videoKindOfCard(d);
                  const label = vKind
                    ? `${VIDEO_KIND_OPTIONS.find((k) => k.id === vKind)?.label ?? 'Video'} video`
                    : KIND_OPTIONS.find((k) => k.id === kind)?.label ?? 'Post';
                  const cover = d.photos?.[0] ?? d.image_url;
                  const title = d.title && d.title !== 'Untitled' ? d.title : d.place_name || `${label} post`;
                  return (
                    <li key={d.id} className="cf-drafts__item">
                      {confirmId === d.id ? (
                        <div className="cf-drafts__confirm" role="group" aria-label={`Delete ${title}?`}>
                          <span>Delete this draft?</span>
                          <button type="button" className="cf-drafts__btn is-danger" onClick={() => remove(d.id)} disabled={deletingId === d.id}>
                            {deletingId === d.id ? <Loader2 size={15} className="scout-spin" aria-hidden="true" /> : null} Delete
                          </button>
                          <button type="button" className="cf-drafts__btn" onClick={() => setConfirmId(null)} disabled={deletingId === d.id}>
                            Keep
                          </button>
                        </div>
                      ) : (
                        <>
                          <button type="button" className="cf-drafts__open" onClick={() => onOpenDraft(d)} disabled={!kind && !vKind}>
                            <span className="cf-drafts__thumb" aria-hidden="true">
                              {cover ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={cover} alt="" />
                              ) : (
                                <ImageOff size={18} />
                              )}
                            </span>
                            <span className="cf-drafts__text">
                              <strong>{title}</strong>
                              <span>
                                {label} · {savedAgo(d.updated_at || d.created_at)}
                              </span>
                            </span>
                            <ChevronRight size={18} aria-hidden="true" />
                          </button>
                          <button type="button" className="cf-drafts__delete" onClick={() => setConfirmId(d.id)} aria-label={`Delete draft: ${title}`}>
                            <Trash2 size={17} />
                          </button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {error && (
              <p className="cf-drafts__error" role="alert">
                {error}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DraftsSheet;
