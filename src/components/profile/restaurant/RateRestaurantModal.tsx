'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Star, X } from 'lucide-react';
import { RestaurantService, type RestaurantReview } from '@/lib/services/restaurantService';
import { refreshRestaurant } from '@/lib/hooks/useRestaurant';

const LABELS = ['', 'Poor', 'Below average', 'Good', 'Very good', 'Excellent'];
const MAX_PHOTOS = 4;

// "Rate this Restaurant": 1-5 stars, optional text, up to 4 optional photos.
// One review per customer - opening it again edits the existing review. On
// save the shared restaurant store refreshes, so the header's average rating
// and review count update immediately (they're computed from the reviews).
export default function RateRestaurantModal({
  restaurantId,
  restaurantName,
  userId,
  existing,
  onClose,
  onSaved,
}: {
  restaurantId: string;
  restaurantName: string;
  userId: string;
  existing?: RestaurantReview | null;
  onClose: () => void;
  onSaved?: (review: RestaurantReview) => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(existing?.body ?? '');
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !saving && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, MAX_PHOTOS - photos.length)) {
        const res = await RestaurantService.uploadImage(file);
        if (res.success && res.data) setPhotos((p) => [...p, res.data!].slice(0, MAX_PHOTOS));
        else setError(res.error ?? 'Photo upload failed.');
      }
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (rating < 1) {
      setError('Pick a star rating first.');
      return;
    }
    setSaving(true);
    setError(null);
    const res = await RestaurantService.submitReview(restaurantId, userId, { rating, body, photos });
    setSaving(false);
    if (!res.success || !res.data) {
      setError(res.error ?? 'Could not save your rating.');
      return;
    }
    await refreshRestaurant(restaurantId, 'summary');
    onSaved?.(res.data);
    onClose();
  };

  const shown = hover || rating;

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role="dialog" aria-modal="true" aria-label={`Rate ${restaurantName}`}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-body p-4">
            <div className="d-flex justify-content-between align-items-start mb-1">
              <h5 className="fw-bold mb-0">{existing ? 'Update your rating' : 'Rate this restaurant'}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} disabled={saving} />
            </div>
            <p className="text-muted small mb-3">{restaurantName}</p>

            {/* Star picker */}
            <div className="d-flex align-items-center gap-2 mb-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  className="fz-star-btn"
                  onMouseEnter={() => setHover(i)}
                  onClick={() => setRating(i)}
                  aria-label={`${i} star${i === 1 ? '' : 's'}`}
                  aria-pressed={rating === i}
                >
                  <Star size={32} fill={i <= shown ? 'currentColor' : 'none'} className={i <= shown ? 'is-on' : ''} />
                </button>
              ))}
            </div>
            <div className="small fw-semibold mb-3" style={{ minHeight: '1.2em', color: '#837a68' }}>
              {LABELS[shown]}
            </div>

            <label className="fw-bold text-dark mb-2 d-block" htmlFor="fz-review-body">
              Your review <span className="text-muted fw-normal">(optional)</span>
            </label>
            <textarea
              id="fz-review-body"
              className="form-control form-control-sm mb-1"
              rows={4}
              maxLength={2000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What did you eat? How was the food, service and vibe?"
            />
            <div className="text-end small text-muted mb-3">{body.length}/2000</div>

            {/* Photos */}
            <div className="fw-bold text-dark mb-2">
              Photos <span className="text-muted fw-normal">(optional, up to {MAX_PHOTOS})</span>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {photos.map((src) => (
                <div key={src} className="position-relative rounded-3 overflow-hidden border" style={{ width: 72, height: 72 }}>
                  <img src={src} alt="" className="w-100 h-100 object-fit-cover" />
                  <button
                    type="button"
                    className="btn btn-sm btn-dark position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center rounded-circle m-1"
                    style={{ width: 20, height: 20 }}
                    onClick={() => setPhotos((p) => p.filter((x) => x !== src))}
                    aria-label="Remove photo"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-3 d-flex flex-column align-items-center justify-content-center gap-1"
                  style={{ width: 72, height: 72, fontSize: '0.7rem' }}
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 size={18} className="scout-spin" /> : <Camera size={18} />}
                  Add
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="d-none"
                onChange={(e) => {
                  addPhotos(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>

            {error && <div className="text-danger small mt-3">{error}</div>}
          </div>
          <div className="modal-footer bg-light border-top-0 p-3 d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary flex-fill" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary flex-fill fw-bold" onClick={submit} disabled={saving || uploading || rating < 1}>
              {saving ? 'Saving…' : existing ? 'Update rating' : 'Submit rating'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
