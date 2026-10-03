'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import SocialLinksEditor from './settings/SocialLinksEditor';
import type { SocialLinks } from '@/lib/services/socialLinksService';

// "Add socials" sheet opened straight from the Profile hero (no trip to
// Settings): the same editor, in a bottom sheet on phones / centred card on
// desktop. Saving updates the hero immediately and closes the sheet.
export default function SocialLinksSheet({
  userId,
  onClose,
  onSaved,
}: {
  userId: string;
  onClose: () => void;
  onSaved: (links: SocialLinks) => void;
}) {
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

  return createPortal(
    <div className="fz-share" role="presentation" onClick={onClose}>
      <div className="fz-share__sheet fz-social-sheet" role="dialog" aria-modal="true" aria-labelledby="fz-social-sheet-title" onClick={(e) => e.stopPropagation()}>
        <span className="fz-share__handle" aria-hidden="true" />
        <div className="fz-share__head">
          <h2 id="fz-social-sheet-title" className="fz-share__title">Your socials</h2>
          <button type="button" className="fz-share__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <SocialLinksEditor
          userId={userId}
          embedded
          onSaved={(links) => {
            onSaved(links);
            onClose();
          }}
        />
      </div>
    </div>,
    document.body,
  );
}
