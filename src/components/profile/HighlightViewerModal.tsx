'use client';

import { useState } from 'react';
import { X, Pencil, Info } from 'lucide-react';
import type { ProfileHighlight, HighlightItemRef } from '@/lib/services/profileHighlightsService';

interface HighlightViewerModalProps {
  highlight: ProfileHighlight;
  isOwnProfile: boolean;
  onClose: () => void;
  onEdit: () => void;
  /** Opens the current item's real detail modal (ingredients/nutrition for a
   * recipe, the full saved-item view, etc.) - the viewer only ever shows the
   * lightweight image+title, so this is how "see the rest of it" works. */
  onViewDetails: (item: HighlightItemRef) => void;
}

// A lightweight, tap-to-advance viewer (not auto-advancing like a real
// ephemeral Story) - this is a permanent, user-curated collection, not
// timed content, so a manual "photo album" pace is the honest fit rather
// than faking a Stories-style timer.
export default function HighlightViewerModal({ highlight, isOwnProfile, onClose, onEdit, onViewDetails }: HighlightViewerModalProps) {
  const [index, setIndex] = useState(0);
  const items = highlight.items;
  const current = items[index];

  const goNext = () => {
    if (index < items.length - 1) setIndex((i) => i + 1);
    else onClose();
  };
  const goPrev = () => setIndex((i) => Math.max(0, i - 1));

  if (!current) return null;

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: '#000', zIndex: 1080 }}>
      <div className="d-flex gap-1 position-absolute top-0 start-0 w-100 p-2" style={{ zIndex: 2 }}>
        {items.map((_, i) => (
          <div key={i} className="flex-fill rounded-pill overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.35)' }}>
            <div className="h-100 bg-white" style={{ width: i <= index ? '100%' : '0%' }} />
          </div>
        ))}
      </div>

      <div className="position-absolute top-0 start-0 w-100 d-flex justify-content-between align-items-center px-3" style={{ zIndex: 2, marginTop: 14 }}>
        <div className="text-white fw-bold">{highlight.title}</div>
        <div className="d-flex gap-2">
          {isOwnProfile && (
            <button type="button" className="btn btn-sm bg-dark bg-opacity-50 rounded-circle p-2 border-0 d-flex" onClick={onEdit} aria-label="Edit highlight">
              <Pencil size={16} color="#fff" />
            </button>
          )}
          <button type="button" className="btn btn-sm bg-dark bg-opacity-50 rounded-circle p-2 border-0 d-flex" onClick={onClose} aria-label="Close">
            <X size={16} color="#fff" />
          </button>
        </div>
      </div>

      <img src={current.image} alt={current.title} className="w-100 h-100" style={{ objectFit: 'contain' }} />

      <div
        className="position-absolute bottom-0 start-0 w-100 p-4 pb-5 text-center"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)' }}
      >
        <div className="text-white fw-bold mb-3">{current.title}</div>
        <button
          type="button"
          className="btn btn-light btn-sm rounded-pill fw-bold px-3 d-inline-flex align-items-center gap-1 position-relative"
          style={{ zIndex: 3 }}
          onClick={() => onViewDetails(current)}
        >
          <Info size={14} /> View Details
        </button>
      </div>

      <button type="button" className="position-absolute top-0 start-0 h-100 border-0 bg-transparent" style={{ width: '35%', zIndex: 1 }} onClick={goPrev} aria-label="Previous" />
      <button type="button" className="position-absolute top-0 end-0 h-100 border-0 bg-transparent" style={{ width: '35%', zIndex: 1 }} onClick={goNext} aria-label="Next" />
    </div>
  );
}
