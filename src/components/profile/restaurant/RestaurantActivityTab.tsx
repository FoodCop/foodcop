'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Calendar, Camera, ExternalLink, Heart, Loader2, Megaphone, Plus, Star, Trash2, Video, X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRestaurant } from '@/lib/hooks/useRestaurant';
import {
  POST_KINDS,
  POST_KIND_LABEL,
  RestaurantService,
  type Mention,
  type PersonRef,
  type PostKind,
  type RestaurantPost,
} from '@/lib/services/restaurantService';
import type { FoodCardRecord } from '@/lib/types/foodCard';
import FoodCardDetailModal from '../FoodCardDetailModal';
import { Stars } from './RestaurantBits';

type SubTab = 'posts' | 'mentions';

const timeAgo = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

// Restaurant Activity: two sub-tabs.
//  - Restaurant Posts: what the restaurant itself posts (announcements, menu
//    launches, offers, events, photos, videos, updates). Owner gets a composer.
//  - Mentions & Tags: what customers post about it - their published food
//    cards at the restaurant's linked place, plus written reviews.
export default function RestaurantActivityTab({ restaurantId, restaurantName, isOwner }: { restaurantId: string; restaurantName: string; isOwner: boolean }) {
  const [tab, setTab] = useState<SubTab>('posts');
  const { profile, loaded } = useRestaurant(restaurantId);

  return (
    <div className="fz-activity-container">
      <div className="fz-activity-subtabs">
        {(
          [
            ['posts', 'Restaurant Posts'],
            ['mentions', 'Mentions & Tags'],
          ] as const
        ).map(([key, label]) => (
          <button key={key} type="button" className={`fz-activity-subtab${tab === key ? ' fz-activity-subtab--active' : ''}`} onClick={() => setTab(key)}>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {tab === 'posts' ? (
        <PostsFeed restaurantId={restaurantId} restaurantName={restaurantName} isOwner={isOwner} />
      ) : loaded ? (
        <MentionsFeed restaurantId={restaurantId} placeId={profile?.place_id ?? null} isOwner={isOwner} />
      ) : (
        <Spinner />
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="text-center py-5">
      <div className="spinner-border text-warning" role="status">
        <span className="visually-hidden">Loading…</span>
      </div>
    </div>
  );
}

function Avatar({ person, size = 40 }: { person?: PersonRef; size?: number }) {
  const initial = (person?.name ?? '?').charAt(0).toUpperCase();
  return person?.avatarUrl ? (
    <img src={person.avatarUrl} alt="" className="rounded-circle object-fit-cover flex-shrink-0" style={{ width: size, height: size }} />
  ) : (
    <span className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold flex-shrink-0" style={{ width: size, height: size, background: '#fbf3d5', color: '#241f16' }}>
      {initial}
    </span>
  );
}

// ── Restaurant posts ────────────────────────────────────────────────────────
function PostsFeed({ restaurantId, restaurantName, isOwner }: { restaurantId: string; restaurantName: string; isOwner: boolean }) {
  const [posts, setPosts] = useState<RestaurantPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const load = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    RestaurantService.listPosts(restaurantId).then((res) => {
      if (cancelled) return;
      setPosts(res.data ?? []);
      setError(res.success ? null : res.error ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [restaurantId, reloadKey]);

  const remove = async (post: RestaurantPost) => {
    if (!window.confirm('Delete this post?')) return;
    const res = await RestaurantService.deletePost(restaurantId, post.id);
    if (!res.success) setError(res.error ?? 'Could not delete.');
    load();
  };

  if (posts === null) return <Spinner />;

  return (
    <div>
      {isOwner && (
        composing ? (
          <PostComposer restaurantId={restaurantId} onCancel={() => setComposing(false)} onPosted={() => { setComposing(false); load(); }} />
        ) : (
          <div className="text-end mb-3">
            <button type="button" className="btn btn-sm btn-primary rounded-pill fw-bold d-inline-flex align-items-center gap-1" onClick={() => setComposing(true)}>
              <Plus size={14} /> New post
            </button>
          </div>
        )
      )}

      {error && <div className="alert alert-warning small rounded-4">{error}</div>}

      {posts.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <Megaphone size={36} className="mb-2 opacity-50" />
          <div>{isOwner ? 'Share announcements, offers, events and new dishes here.' : `${restaurantName} hasn't posted anything yet.`}</div>
        </div>
      ) : (
        <div className="row g-3">
          {posts.map((post) => (
            <div key={post.id} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 border shadow-sm overflow-hidden rounded-4">
                {post.media_url &&
                  (post.media_type === 'video' ? (
                    <video src={post.media_url} controls playsInline className="w-100" style={{ height: 220, objectFit: 'cover', background: '#241f16' }} />
                  ) : (
                    <img src={post.media_url} alt="" className="w-100 object-fit-cover" style={{ height: 220 }} loading="lazy" />
                  ))}
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                    <span className="badge bg-warning text-dark" style={{ fontSize: '0.68rem' }}>{POST_KIND_LABEL[post.kind]}</span>
                    <span className="small text-muted">{timeAgo(post.created_at)}</span>
                  </div>
                  {post.title && <h6 className="fw-bold mb-1">{post.title}</h6>}
                  {post.body && <p className="small text-muted mb-2" style={{ whiteSpace: 'pre-line' }}>{post.body}</p>}
                  {post.event_at && (
                    <div className="small fw-semibold d-flex align-items-center gap-1">
                      <Calendar size={13} className="text-warning-emphasis" />
                      {new Date(post.event_at).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                    </div>
                  )}
                  {isOwner && (
                    <button type="button" className="btn btn-sm btn-link text-danger p-0 mt-2 d-inline-flex align-items-center gap-1" onClick={() => remove(post)}>
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostComposer({ restaurantId, onCancel, onPosted }: { restaurantId: string; onCancel: () => void; onPosted: () => void }) {
  const [kind, setKind] = useState<PostKind>('announcement');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [eventAt, setEventAt] = useState('');
  const [media, setMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    const isVideo = file.type.startsWith('video/');
    const res = isVideo ? await RestaurantService.uploadVideo(file) : await RestaurantService.uploadImage(file);
    setUploading(false);
    if (res.success && res.data) setMedia({ url: res.data, type: isVideo ? 'video' : 'image' });
    else setError(res.error ?? 'Upload failed.');
  };

  const canPost = (title.trim() || body.trim() || media) && !uploading && !saving && (kind !== 'event' || eventAt);

  const post = async () => {
    if (!canPost) return;
    setSaving(true);
    setError(null);
    const res = await RestaurantService.createPost(restaurantId, {
      kind,
      title,
      body,
      media_url: media?.url ?? null,
      media_type: media?.type ?? null,
      event_at: kind === 'event' && eventAt ? new Date(eventAt).toISOString() : null,
    });
    setSaving(false);
    if (!res.success) {
      setError(res.error ?? 'Could not post.');
      return;
    }
    onPosted();
  };

  return (
    <div className="card border shadow-sm mb-4 rounded-4">
      <div className="card-body p-3">
        <div className="fz-activity-subtabs fz-activity-subtabs--inline mb-2" role="group" aria-label="Post type">
          {POST_KINDS.map((k) => (
            <button key={k} type="button" className={`fz-activity-subtab fz-activity-subtab--sm${kind === k ? ' fz-activity-subtab--active' : ''}`} aria-pressed={kind === k} onClick={() => setKind(k)}>
              {POST_KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <input className="form-control form-control-sm mb-2" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. 20% off this weekend)" />
        <textarea className="form-control form-control-sm mb-2" rows={3} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Tell your customers more…" />
        {kind === 'event' && (
          <div className="mb-2">
            <label className="small fw-semibold mb-1 d-block" htmlFor="post-event-at">Event date &amp; time *</label>
            <input id="post-event-at" type="datetime-local" className="form-control form-control-sm" value={eventAt} onChange={(e) => setEventAt(e.target.value)} />
          </div>
        )}
        {media ? (
          <div className="position-relative rounded-3 overflow-hidden border mb-2" style={{ maxWidth: 240 }}>
            {media.type === 'video' ? <video src={media.url} className="w-100" style={{ maxHeight: 160 }} /> : <img src={media.url} alt="" className="w-100 object-fit-cover" style={{ maxHeight: 160 }} />}
            <button type="button" className="btn btn-sm btn-dark position-absolute top-0 end-0 m-1 rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ width: 22, height: 22 }} onClick={() => setMedia(null)} aria-label="Remove media">
              <X size={12} />
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-sm btn-outline-dark rounded-pill mb-2 d-inline-flex align-items-center gap-1" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={14} className="scout-spin" /> : <><Camera size={14} /><Video size={14} /></>} Add photo or video
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*,video/*" className="d-none" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
        {error && <div className="text-danger small mb-2">{error}</div>}
        <div className="d-flex gap-2 justify-content-end">
          <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={onCancel} disabled={saving}>Cancel</button>
          <button type="button" className="btn btn-sm btn-primary rounded-pill px-3 fw-bold" onClick={post} disabled={!canPost}>{saving ? 'Posting…' : 'Post'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Mentions & Tags ─────────────────────────────────────────────────────────
function MentionsFeed({ restaurantId, placeId, isOwner }: { restaurantId: string; placeId: string | null; isOwner: boolean }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Mention[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openCard, setOpenCard] = useState<FoodCardRecord | null>(null);

  useEffect(() => {
    let cancelled = false;
    RestaurantService.listMentions(restaurantId, placeId).then((res) => {
      if (cancelled) return;
      setItems(res.data ?? []);
      setError(res.success ? null : res.error ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [restaurantId, placeId]);

  if (items === null) return <Spinner />;

  return (
    <div>
      {!placeId && isOwner && (
        <div className="alert alert-light border small rounded-4">
          Link your Google listing in the <strong>Dashboard</strong> tab so customers&apos; posts at your place show up here.
        </div>
      )}
      {error && <div className="alert alert-warning small rounded-4">{error}</div>}

      {items.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <Heart size={36} className="mb-2 opacity-50" />
          <div>No customer posts or reviews yet.</div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {items.map((m) => {
            const media = m.kind === 'card' ? m.card.image_url : m.review.photos[0] ?? null;
            const video = m.kind === 'card' && m.card.card_type === 'BITE_VIDEO' ? m.card.media_url : null;
            const caption = m.kind === 'card' ? [m.card.title, m.card.caption].filter(Boolean).join(' — ') : m.review.body;
            return (
              <article key={m.id} className="card border shadow-sm rounded-4 overflow-hidden">
                <div className="card-body p-3">
                  <header className="d-flex align-items-center gap-2 mb-2">
                    <Avatar person={m.author} />
                    <div className="flex-grow-1 min-w-0">
                      {m.author ? (
                        <Link href={`/profile/${m.author.id}`} className="fw-bold text-dark text-decoration-none d-block text-truncate">{m.author.name}</Link>
                      ) : (
                        <span className="fw-bold d-block">FUZO user</span>
                      )}
                      <span className="small text-muted">
                        {m.kind === 'card' ? 'Posted here' : 'Reviewed'} · {timeAgo(m.created_at)}
                      </span>
                    </div>
                    {m.kind === 'review' && (
                      <span className="d-flex align-items-center gap-1 small fw-bold">
                        <Stars value={m.review.rating} size={13} />
                      </span>
                    )}
                  </header>

                  {caption && <p className="mb-2 small" style={{ whiteSpace: 'pre-line' }}>{caption}</p>}

                  {video ? (
                    <video src={video} controls playsInline className="w-100 rounded-3" style={{ maxHeight: 360, background: '#241f16' }} />
                  ) : media ? (
                    <img src={media} alt="" className="w-100 rounded-3 object-fit-cover" style={{ maxHeight: 360 }} loading="lazy" />
                  ) : null}
                  {m.kind === 'review' && m.review.photos.length > 1 && (
                    <div className="d-flex gap-2 mt-2">
                      {m.review.photos.slice(1).map((p) => (
                        <img key={p} src={p} alt="" className="rounded-3 object-fit-cover" style={{ width: 72, height: 72 }} />
                      ))}
                    </div>
                  )}

                  <footer className="d-flex align-items-center gap-3 mt-2 small text-muted">
                    {m.kind === 'card' ? (
                      <>
                        <span className="d-inline-flex align-items-center gap-1"><Heart size={14} /> {m.card.stats?.likes ?? 0}</span>
                        <button type="button" className="btn btn-sm btn-link p-0 ms-auto d-inline-flex align-items-center gap-1 text-decoration-none" onClick={() => setOpenCard(m.card)}>
                          View original <ExternalLink size={12} />
                        </button>
                      </>
                    ) : (
                      <span className="d-inline-flex align-items-center gap-1"><Star size={14} /> {m.review.rating}/5 rating</span>
                    )}
                  </footer>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {openCard && (
        <FoodCardDetailModal card={openCard} currentUserId={user?.id ?? ''} onClose={() => setOpenCard(null)} onUpdated={() => setOpenCard(null)} />
      )}
    </div>
  );
}
