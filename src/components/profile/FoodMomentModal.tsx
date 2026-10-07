'use client';

import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { MediaUploadService } from '@/lib/services/mediaUploadService';
import FoodMomentsService, { type FoodMoment, type FoodMomentType, MOMENT_TYPE_LABEL } from '@/lib/services/foodMomentsService';

const TYPE_OPTIONS: { value: FoodMomentType; emoji: string }[] = [
  { value: 'food', emoji: '🍽️' },
  { value: 'place', emoji: '📍' },
  { value: 'memory', emoji: '✨' },
];

// "Add New" flow (photo + one-line title + Food/Place/Memory type) - own
// small modal rather than reusing HighlightEditorModal, since a moment isn't
// a pointer into an existing food_card/saved_item, it's a freestanding photo.
export default function FoodMomentModal({
  userId,
  onClose,
  onSaved,
  viewing,
  onDeleted,
}: {
  userId: string;
  onClose: () => void;
  onSaved: () => void;
  /** Pass an existing moment to view/delete it instead of creating a new one. */
  viewing?: FoodMoment;
  onDeleted?: () => void;
}) {
  const [title, setTitle] = useState('');
  const [momentType, setMomentType] = useState<FoodMomentType>('food');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePickFile = (f: File | null) => {
    setFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const handleSave = async () => {
    if (!file || !title.trim()) {
      setError('Add a photo and a title.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const upload = await MediaUploadService.uploadFoodMoment(file);
      if (!upload.success || !upload.data) {
        setError(upload.error || 'Upload failed. Please try again.');
        return;
      }
      const result = await FoodMomentsService.create({
        userId,
        title: title.trim(),
        imageUrl: upload.data,
        momentType,
      });
      if (!result.success) {
        setError(result.error || 'Could not save this moment.');
        return;
      }
      onSaved();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!viewing) return;
    setIsDeleting(true);
    try {
      const result = await FoodMomentsService.remove(viewing.id);
      if (result.success) {
        onDeleted?.();
        onClose();
      } else {
        setError(result.error || 'Could not delete this moment.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">{viewing ? viewing.title : 'Add a Food Moment'}</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
          </div>
          <div className="modal-body p-4 pt-2">
            {viewing ? (
              <>
                <div className="rounded-4 overflow-hidden mb-3" style={{ aspectRatio: '4/3' }}>
                  <img src={viewing.image_url} alt={viewing.title} className="w-100 h-100 object-fit-cover" />
                </div>
                <span className="fz-moment-chip">{MOMENT_TYPE_LABEL[viewing.moment_type]}</span>
                {error && <div className="alert alert-danger small mt-3 mb-0">{error}</div>}
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="w-100 border-0 rounded-4 overflow-hidden mb-3 p-0"
                  style={{ aspectRatio: '4/3', background: '#F5F0E3' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="" className="w-100 h-100 object-fit-cover" />
                  ) : (
                    <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                      <span style={{ fontSize: 28 }}>📷</span>
                      <small className="fw-bold mt-1">Tap to choose a photo</small>
                    </div>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)}
                />

                <div className="d-flex gap-2 mb-3">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`fz-moment-type-chip${momentType === opt.value ? ' fz-moment-type-chip--active' : ''}`}
                      onClick={() => setMomentType(opt.value)}
                    >
                      {opt.emoji} {MOMENT_TYPE_LABEL[opt.value]}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Pad Thai, Bangkok…"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={40}
                />

                {error && <div className="alert alert-danger small mt-3 mb-0">{error}</div>}
              </>
            )}
          </div>
          <div className="modal-footer border-0 p-3 pt-0 d-flex gap-2">
            {viewing ? (
              <button type="button" className="btn btn-outline-danger flex-fill fw-bold" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 size={16} className="scout-spin" /> : 'Delete'}
              </button>
            ) : (
              <button type="button" className="btn fz-btn-gold flex-fill fw-bold" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 size={16} className="scout-spin" /> : 'Save Moment'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
