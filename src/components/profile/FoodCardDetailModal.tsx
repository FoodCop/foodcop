'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Loader2, Pencil, PlayCircle, Trash2 } from 'lucide-react';
import type { FoodCardRecord } from '../../lib/types/foodCard';
import { TYPE_META, VIDEO_CARD_TYPES, familyOf } from '../../lib/types/foodCard';
import { foodCardService } from '../../lib/services/foodCardService';
import ShareSheet, { type SharePayload } from '../share/ShareSheet';
import { VideoPlayerModal } from '../ui/VideoPlayerModal';
import { PostService } from '../../lib/services/postService';
import { canEditInCreate } from '../create/flow/fromCard';
import { postSharePayload } from '../../lib/share/postShare';

interface FoodCardDetailModalProps {
  card: FoodCardRecord;
  currentUserId: string;
  onClose: () => void;
  onUpdated: (updated: FoodCardRecord) => void;
  /** Your own post: open it in the Create flow (finish a draft / edit). */
  onEdit?: (card: FoodCardRecord) => void;
  /** Your own post was deleted. */
  onDeleted?: (id: string) => void;
}

export default function FoodCardDetailModal({ card, currentUserId, onClose, onUpdated, onEdit, onDeleted }: FoodCardDetailModalProps) {
  const [current, setCurrent] = useState(card);
  const [isPublishing, setIsPublishing] = useState(false);
  const [sharing, setSharing] = useState<SharePayload | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Edit / delete (client, 2026-10-14; plan Phase 8): only on your own posts.
  const isOwner = !!currentUserId && currentUserId === current.user_id;
  const editable = isOwner && !!onEdit && canEditInCreate(current);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    const res = await PostService.remove(current.id);
    setDeleting(false);
    if (!res.success) {
      setDeleteError(res.error || 'Could not delete. Please try again.');
      return;
    }
    onDeleted?.(current.id);
    onClose();
  };

  const meta = TYPE_META[current.card_type];
  // Every video post (client, 2026-10-16), not just the older Bite videos.
  const isVideo = VIDEO_CARD_TYPES.includes(current.card_type) && !!current.media_url;
  const stops = current.stops ?? [];
  const family = familyOf(current.card_type);
  const ingredients = (current.ingredients ?? []).filter((row) => row[0]);
  const nutrition = Object.entries(current.nutrition ?? {}).filter(([, v]) => typeof v === 'number' && v > 0);
  const hasPlace = family === 'restaurant' && typeof current.lat === 'number' && typeof current.lng === 'number';
  const allTags = Object.values(current.tags).flat().filter((t): t is string => typeof t === 'string' && t.length > 0);

  const handlePublish = async () => {
    setIsPublishing(true);
    const result = await foodCardService.publishCard(current.id);
    setIsPublishing(false);
    if (result.success && result.data) {
      setCurrent(result.data);
      onUpdated(result.data);
    }
  };

  // Share asks where: FUZO friends/groups or other apps (ShareSheet).
  // The link opens the post itself (/post/<id>; sign-up first for new people).
  const openShare = () => setSharing(postSharePayload(current));

  return (
    <>
      <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="position-relative" style={{ height: '250px', background: meta.color }}>
              {/* Every photo of the post, swipe sideways (was only the first). */}
              {(current.photos?.length ? current.photos : current.image_url ? [current.image_url] : []).length > 0 && (
                <div className="d-flex w-100 h-100" style={{ overflowX: 'auto', scrollSnapType: 'x mandatory' }}>
                  {(current.photos?.length ? current.photos : [current.image_url as string]).map((src, i, all) => (
                    <img
                      key={`${i}-${src.slice(0, 60)}`}
                      src={src}
                      alt={all.length > 1 ? `${current.title} - photo ${i + 1} of ${all.length}` : current.title}
                      className="h-100 object-fit-cover"
                      style={{ flex: '0 0 100%', width: '100%', scrollSnapAlign: 'start' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ))}
                </div>
              )}
              {(current.photos?.length ?? 0) > 1 && (
                <span className="badge position-absolute top-0 start-0 m-3 text-white fw-bold" style={{ background: 'rgba(0,0,0,0.6)' }}>
                  {current.photos!.length} photos · swipe
                </span>
              )}
              {isVideo && (
                <button
                  type="button"
                  onClick={() => setIsPlaying(true)}
                  aria-label="Play video"
                  className="position-absolute top-50 start-50 translate-middle"
                  style={{
                    background: 'rgba(0,0,0,0.55)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 64,
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <PlayCircle size={36} />
                </button>
              )}
              <button
                type="button"
                className="btn-close position-absolute top-0 end-0 m-3 bg-white p-2 rounded-circle shadow-sm"
                aria-label="Close"
                onClick={onClose}
              ></button>
              <span
                className="badge position-absolute bottom-0 start-0 m-3 text-white fw-bold"
                style={{ backgroundColor: meta.color }}
              >
                {meta.emoji} {meta.label}
              </span>
            </div>

            <div className="modal-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h3 className="fw-bolder mb-1">{current.title}</h3>
                  <span className={`badge ${current.status === 'PUBLISHED' ? 'bg-success' : 'bg-secondary'}`}>
                    {current.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              {current.caption && <p className="text-muted fw-semibold">{current.caption}</p>}

              {allTags.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mt-3">
                  {allTags.map((tag) => (
                    <span key={tag} className="badge bg-light text-dark border">{tag}</span>
                  ))}
                </div>
              )}

              {(family === 'recipe' || current.card_type === 'RECIPE_VIDEO') && ingredients.length > 0 && (
                <div className="mt-4">
                  <h6 className="fw-bold text-uppercase small text-muted mb-2">Ingredients</h6>
                  <ul className="list-unstyled mb-0">
                    {ingredients.map(([name, qty, unit], i) => (
                      <li key={`${name}-${i}`} className="d-flex justify-content-between border-bottom py-1">
                        <span className="fw-semibold">{name}</span>
                        <span className="text-muted">{[qty, unit].filter(Boolean).join(' ')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {family === 'recipe' && nutrition.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mt-3">
                  {nutrition.map(([key, value]) => (
                    <span key={key} className="badge bg-warning-subtle text-dark border">{key}: {String(value)}</span>
                  ))}
                </div>
              )}

              {stops.length > 0 && (
                <div className="mt-4">
                  <h6 className="fw-bold text-uppercase small text-muted mb-2">Stops</h6>
                  <ol className="mb-0 ps-3">
                    {stops.map((st, i) => (
                      <li key={`${i}-${st.name}`} className="py-1">
                        <span className="fw-semibold">{st.name}</span>
                        {st.dish && <span className="text-muted"> · {st.dish}</span>}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {hasPlace && (
                <Link href="/scout" className="btn btn-outline-dark btn-sm rounded-pill mt-3 fw-bold" onClick={onClose}>
                  📍 View on map
                </Link>
              )}

            </div>

            {confirmDelete ? (
              <div className="modal-footer bg-light border-top-0 p-3 d-flex flex-wrap align-items-center gap-2" role="group" aria-label="Delete this post?">
                <span className="fw-bold flex-grow-1">
                  Delete this {current.status === 'DRAFT' ? 'draft' : 'post'}? This can&apos;t be undone.
                </span>
                <button type="button" className="btn btn-danger fw-bold rounded-pill px-3" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Loader2 size={16} className="scout-spin me-1" aria-hidden="true" /> : null}
                  Delete
                </button>
                <button type="button" className="btn btn-light border fw-bold rounded-pill px-3" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                  Keep
                </button>
                {deleteError && (
                  <p className="w-100 mb-0 small text-danger fw-semibold" role="alert">
                    {deleteError}
                  </p>
                )}
              </div>
            ) : (
            <div className="modal-footer bg-light border-top-0 p-3 d-flex gap-2">
              {editable && (
                <button
                  type="button"
                  className={`btn ${current.status === 'DRAFT' ? 'btn-dark' : 'btn-light border'} flex-grow-1 fw-bold rounded-pill d-inline-flex align-items-center justify-content-center gap-1`}
                  onClick={() => onEdit?.(current)}
                >
                  <Pencil size={16} aria-hidden="true" /> {current.status === 'DRAFT' ? 'Finish draft' : 'Edit'}
                </button>
              )}
              {current.status === 'DRAFT' && !editable && (
                <button
                  type="button"
                  className="btn btn-dark flex-grow-1 fw-bold rounded-pill"
                  onClick={handlePublish}
                  disabled={isPublishing}
                >
                  {isPublishing ? 'Publishing...' : 'Publish to Feed'}
                </button>
              )}
              {current.status === 'PUBLISHED' && (
                <button
                  type="button"
                  className="btn btn-primary flex-grow-1 fw-bold fz-on-accent rounded-pill"
                  onClick={openShare}
                >
                  Share
                </button>
              )}
              {isOwner && onDeleted && (
                <button
                  type="button"
                  className="btn btn-light border rounded-pill d-inline-flex align-items-center justify-content-center"
                  style={{ minWidth: 44, minHeight: 44 }}
                  onClick={() => setConfirmDelete(true)}
                  aria-label={current.status === 'DRAFT' ? 'Delete draft' : 'Delete post'}
                >
                  <Trash2 size={17} />
                </button>
              )}
            </div>
            )}
          </div>
        </div>
      </div>

      <ShareSheet payload={sharing} onClose={() => setSharing(null)} />

      {isPlaying && current.media_url && (
        <VideoPlayerModal
          title={current.title}
          mediaUrl={current.media_url}
          onClose={() => setIsPlaying(false)}
        />
      )}
    </>
  );
}
