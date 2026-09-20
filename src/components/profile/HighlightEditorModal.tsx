'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { foodCardService } from '@/lib/services/foodCardService';
import PlateService from '@/lib/services/plateService';
import { normalizeSavedItemForUI } from '@/lib/services/savedItems';
import ProfileHighlightsService, { type HighlightItemRef, type ProfileHighlight } from '@/lib/services/profileHighlightsService';

interface HighlightEditorModalProps {
  userId: string;
  /** Present when editing an existing highlight; absent when creating a new one. */
  editing?: ProfileHighlight;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

const itemKey = (item: HighlightItemRef) => `${item.kind}-${item.id}`;

// Create/edit a Highlight: name it, pick which of your own published cards
// and saved items go in it. No cover upload - the first picked item's image
// is the cover, same as Instagram deriving a highlight's cover from its
// first story unless you override it (a manual-cover flow is a fine later
// add, not needed for the collection to work).
export default function HighlightEditorModal({ userId, editing, onClose, onSaved, onDeleted }: HighlightEditorModalProps) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [selected, setSelected] = useState<Map<string, HighlightItemRef>>(
    () => new Map((editing?.items ?? []).map((item) => [itemKey(item), item])),
  );
  const [pickable, setPickable] = useState<HighlightItemRef[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [cardsResult, savedResult] = await Promise.all([
        foodCardService.listMyCards(userId),
        PlateService.listSavedItems(),
      ]);
      if (cancelled) return;

      const cardItems: HighlightItemRef[] = (cardsResult.success ? cardsResult.data ?? [] : [])
        .filter((c) => c.status === 'PUBLISHED' && c.image_url)
        .map((c) => ({ kind: 'card' as const, id: c.id, image: c.image_url as string, title: c.title, data: c }));

      const savedItemRefs: HighlightItemRef[] = (savedResult.success ? savedResult.data ?? [] : [])
        .map((s) => normalizeSavedItemForUI(s))
        .filter((n) => !!n.img && !!n.id)
        .map((n) => ({ kind: 'saved' as const, id: n.id as string, image: n.img as string, title: n.name || 'Saved item', data: n }));

      setPickable([...cardItems, ...savedItemRefs]);
      setIsLoadingItems(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggle = (item: HighlightItemRef) => {
    setSelected((prev) => {
      const next = new Map(prev);
      const key = itemKey(item);
      if (next.has(key)) next.delete(key);
      else next.set(key, item);
      return next;
    });
  };

  const selectedItems = useMemo(() => Array.from(selected.values()), [selected]);
  const canSave = title.trim().length > 0 && selectedItems.length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    setError(null);
    try {
      const result = editing
        ? await ProfileHighlightsService.update(editing.id, { title: title.trim(), items: selectedItems })
        : await ProfileHighlightsService.create({ userId, title: title.trim(), items: selectedItems });
      if (!result.success) {
        setError(result.error || 'Could not save highlight');
        return;
      }
      onSaved();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    setIsDeleting(true);
    try {
      const result = await ProfileHighlightsService.remove(editing.id);
      if (!result.success) {
        setError(result.error || 'Could not delete highlight');
        return;
      }
      onDeleted();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-body p-4">
            <h5 className="fw-bold mb-3">{editing ? 'Edit Highlight' : 'New Highlight'}</h5>

            <label className="form-label small fw-bold text-muted">Name</label>
            <input
              type="text"
              className="form-control mb-3"
              placeholder="e.g. Italy Trip, Weeknight Dinners"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={30}
            />

            <label className="form-label small fw-bold text-muted">
              Add from your posts & saves {selectedItems.length > 0 && `(${selectedItems.length} selected)`}
            </label>

            {isLoadingItems ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : pickable.length === 0 ? (
              <div className="text-center text-muted py-4 bg-light rounded-3">
                Publish a card or save something first - a highlight needs at least one item.
              </div>
            ) : (
              <div className="row g-2" style={{ maxHeight: 320, overflowY: 'auto' }}>
                {pickable.map((item) => {
                  const isSelected = selected.has(itemKey(item));
                  return (
                    <div key={itemKey(item)} className="col-4">
                      <button
                        type="button"
                        className="btn p-0 border-0 position-relative w-100"
                        style={{ aspectRatio: '1/1' }}
                        onClick={() => toggle(item)}
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-100 h-100 object-fit-cover rounded-3"
                          style={{ opacity: isSelected ? 1 : 0.6 }}
                        />
                        {isSelected && (
                          <span
                            className="position-absolute top-0 end-0 m-1 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: 22, height: 22 }}
                          >
                            <Check size={14} />
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {error && <div className="text-danger small mt-3">{error}</div>}
          </div>

          <div className="modal-footer bg-light border-top-0 p-3 d-flex gap-2">
            {editing && (
              <button type="button" className="btn btn-outline-danger" onClick={handleDelete} disabled={isDeleting || isSaving}>
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
            <button type="button" className="btn btn-outline-secondary flex-fill" onClick={onClose} disabled={isSaving || isDeleting}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary flex-fill fw-bold" onClick={handleSave} disabled={!canSave || isSaving || isDeleting}>
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
