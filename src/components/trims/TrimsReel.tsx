'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { Mousewheel } from 'swiper/modules';
import 'swiper/css';
import { Bookmark, Clapperboard, Heart, Loader2, MapPin, MoreVertical, Play, Route, Share2, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import ShareSheet, { type SharePayload } from '@/components/share/ShareSheet';
import { PlateService } from '@/lib/services/plateService';
import { FoodCardLikesService } from '@/lib/services/foodCardLikesService';
import { FriendRequestService, type FriendRequestRelationship } from '@/lib/services/friendRequestService';
import { TrimsService, TRIMS_PAGE, type Trim } from '@/lib/services/trimsService';
import { postPath, postSharePayload, postTitle } from '@/lib/share/postShare';
import { TYPE_META } from '@/lib/types/foodCard';
import { PLATFORM_LABEL, embedUrlFor, parseSourceUrl } from '@/lib/import/platforms';

// The Home "Trims" reel (client, 2026-10-16: "no demo clips, use real
// clips"; plan: docs/VIDEO_URL_PLAN.md, phase 3). A full-bleed vertical swiper
// of members' video posts, newest first, loading more near the end. Only the
// visible clip plays. Per clip: who posted it (+ Follow), what it is, the
// place or the tour's stops, and Like / Save / Share / More. Likes are
// food_card_likes (the same as Feed likes), saves go to My Plate.
// Shared links: /dashboard?tab=trims&trim=<post id> opens on that clip.

const CreateFlow = dynamic(() => import('@/components/create/flow/CreateFlow').then((m) => m.CreateFlow), { ssr: false });

// Hoisted so the modules array is a stable reference across renders - a new
// array literal here on every render can make Swiper tear down/reinit repeatedly.
const SWIPER_MODULES = [Mousewheel];

type Status = 'loading' | 'ready' | 'error';

const scoutLink = (name: string, lat: number, lng: number, placeId?: string | null) =>
  `/scout?${new URLSearchParams({ name, lat: String(lat), lng: String(lng), ...(placeId ? { place: placeId } : {}) }).toString()}`;

export default function TrimsReel() {
  const { user } = useAuth();
  const [trims, setTrims] = useState<Trim[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [hasMore, setHasMore] = useState(true);
  const loadingMore = useRef(false);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [relations, setRelations] = useState<Record<string, FriendRequestRelationship>>({});
  const [activeTrimId, setActiveTrimId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // An imported clip playing from its original post (one at a time).
  const [embedFor, setEmbedFor] = useState<string | null>(null);
  const swiperRef = useRef<SwiperType | null>(null);

  // Player state: only the visible slide plays (others pause - saves battery
  // and data), one global mute toggle, tap-to-pause, and a progress bar.
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      video.muted = muted;
      if (i === activeIndex && !paused) video.play().catch(() => {});
      else video.pause();
    });
  }, [activeIndex, paused, muted, trims.length]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(t);
  }, [notice]);

  // Likes, saves and Follow state for newly loaded clips.
  const loadExtras = useCallback(
    async (batch: Trim[]) => {
      const ids = batch.map((t) => t.card.id);
      const [counts, mine] = await Promise.all([FoodCardLikesService.counts(ids), user ? FoodCardLikesService.likedAmong(ids) : Promise.resolve(new Set<string>())]);
      setLikeCounts((prev) => ({ ...prev, ...counts }));
      setLiked((prev) => new Set([...prev, ...mine]));
      if (user) {
        const authors = [...new Set(batch.map((t) => t.author.id).filter((id) => id !== user.id))];
        if (authors.length) {
          const rel = await FriendRequestService.getRelationshipsForUsers(user.id, authors);
          if (rel.success && rel.data) setRelations((prev) => ({ ...prev, ...rel.data }));
        }
      }
    },
    [user],
  );

  // First page (+ the shared clip, if the link points at one further back).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await TrimsService.list();
      if (cancelled) return;
      if (!res.success) {
        setStatus('error');
        return;
      }
      let list = res.data ?? [];
      const wanted = new URLSearchParams(window.location.search).get('trim');
      if (wanted && !list.some((t) => t.card.id === wanted)) {
        const one = await TrimsService.get(wanted);
        if (one) list = [one, ...list];
      }
      if (cancelled) return;
      setTrims(list);
      setHasMore((res.data ?? []).length >= TRIMS_PAGE);
      setStatus('ready');
      loadExtras(list);
      const idx = wanted ? list.findIndex((t) => t.card.id === wanted) : -1;
      if (idx > 0) requestAnimationFrame(() => swiperRef.current?.slideTo(idx, 0));
    })();
    return () => {
      cancelled = true;
    };
  }, [loadExtras]);

  // Saved clips (My Plate).
  useEffect(() => {
    if (!user?.id) return;
    PlateService.listSavedItems().then((res) => {
      if (res.success && res.data) setSaved(new Set(res.data.filter((i) => i.item_type === 'video').map((i) => i.item_id)));
    });
  }, [user?.id]);

  const loadMore = useCallback(async () => {
    if (loadingMore.current || !hasMore || !trims.length) return;
    loadingMore.current = true;
    const res = await TrimsService.list(trims[trims.length - 1].card.created_at);
    loadingMore.current = false;
    if (!res.success) return;
    const fresh = (res.data ?? []).filter((t) => !trims.some((x) => x.card.id === t.card.id));
    setHasMore((res.data ?? []).length >= TRIMS_PAGE);
    if (fresh.length) {
      setTrims((prev) => [...prev, ...fresh]);
      loadExtras(fresh);
    }
  }, [hasMore, trims, loadExtras]);

  const onSlideChange = useCallback(
    (index: number) => {
      setActiveIndex(index);
      setPaused(false);
      setProgress(0);
      setEmbedFor(null);
      if (index >= trims.length - 3) loadMore();
    },
    [trims.length, loadMore],
  );

  const needSignIn = () => {
    setNotice('Sign in to do that.');
    return false;
  };

  const toggleLike = async (id: string) => {
    if (!user) return needSignIn();
    const wasLiked = liked.has(id);
    const flip = (on: boolean) => {
      setLiked((prev) => {
        const next = new Set(prev);
        if (on) next.add(id);
        else next.delete(id);
        return next;
      });
      setLikeCounts((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (on ? 1 : -1)) }));
    };
    flip(!wasLiked);
    const res = wasLiked ? await FoodCardLikesService.unlike(id) : await FoodCardLikesService.like(id);
    if (!res.success) flip(wasLiked);
  };

  const toggleSave = async (trim: Trim) => {
    if (!user) return needSignIn();
    const id = trim.card.id;
    const wasSaved = saved.has(id);
    const set = (on: boolean) =>
      setSaved((prev) => {
        const next = new Set(prev);
        if (on) next.add(id);
        else next.delete(id);
        return next;
      });
    set(!wasSaved);
    const res = wasSaved
      ? await PlateService.removeFromPlate({ itemId: id, itemType: 'video' })
      : await PlateService.saveToPlate({
          itemId: id,
          itemType: 'video',
          metadata: { title: postTitle(trim.card), img: trim.card.image_url ?? undefined, cat: TYPE_META[trim.card.card_type]?.label ?? 'Trim', author: trim.author.name, cardId: id },
        });
    if (!res.success) set(wasSaved);
    else setNotice(wasSaved ? 'Removed from My Plate' : 'Saved to My Plate');
  };

  const follow = async (authorId: string) => {
    if (!user) return needSignIn();
    const rel = relations[authorId];
    const res =
      rel?.state === 'incoming-pending' && rel.request
        ? await FriendRequestService.acceptRequest(rel.request.id)
        : await FriendRequestService.sendRequest(user.id, authorId);
    if (!res.success) {
      setNotice("Couldn't follow right now. Please try again.");
      return;
    }
    const again = await FriendRequestService.getRelationship(user.id, authorId);
    if (again.success && again.data) setRelations((prev) => ({ ...prev, [authorId]: again.data! }));
  };

  // Share asks where: FUZO friends/groups or other apps (ShareSheet). The link opens the post.
  const [sharing, setSharing] = useState<SharePayload | null>(null);

  const hide = (id: string) => {
    setTrims((prev) => prev.filter((t) => t.card.id !== id));
    setNotice('Hidden for now.');
  };

  const activeTrim = trims.find((t) => t.card.id === activeTrimId) ?? null;

  if (status === 'loading') {
    return (
      <div className="reel-state" role="status">
        <Loader2 size={28} className="scout-spin" aria-hidden="true" />
        <span>Loading Trims…</span>
      </div>
    );
  }

  if (status === 'error' || trims.length === 0) {
    return (
      <div className="reel-state">
        <span className="reel-state__icon" aria-hidden="true">
          <Clapperboard size={30} />
        </span>
        <h2 className="reel-state__title">{status === 'error' ? "Trims didn't load" : 'No videos yet'}</h2>
        <p className="reel-state__sub">
          {status === 'error' ? 'Check your connection and try again.' : 'Short food videos from FUZO members show up here. Be the first!'}
        </p>
        {status === 'error' ? (
          <button type="button" className="reel-state__btn" onClick={() => window.location.reload()}>
            Try again
          </button>
        ) : (
          <button type="button" className="reel-state__btn" onClick={() => setCreating(true)}>
            Post the first video
          </button>
        )}
        {creating && <CreateFlow initialMode="video" onClose={() => setCreating(false)} />}
      </div>
    );
  }

  return (
    <>
      <Swiper
        direction="vertical"
        modules={SWIPER_MODULES}
        mousewheel
        className="reel-swiper"
        slidesPerView={1}
        onSlideChange={(sw) => onSlideChange(sw.activeIndex)}
        onSwiper={(sw) => {
          swiperRef.current = sw;
        }}
      >
        {trims.map((trim, i) => {
          const { card, author } = trim;
          const id = card.id;
          const meta = TYPE_META[card.card_type];
          const isLiked = liked.has(id);
          const isSaved = saved.has(id);
          const isActive = i === activeIndex;
          const own = user?.id === author.id;
          const rel = relations[author.id]?.state ?? 'none';
          const stops = card.stops ?? [];
          const hasPlace = card.card_type === 'REVIEW_VIDEO' && typeof card.lat === 'number' && typeof card.lng === 'number';
          const near = Math.abs(i - activeIndex) <= 1;
          // Imported by its link (URL import): plays from the original post.
          const imported = !card.media_url && !!card.source_url;
          const source = imported ? parseSourceUrl(card.source_url!) : null;
          const embed = imported ? embedUrlFor(card.source_url) : null;
          const where = source ? PLATFORM_LABEL[card.source_platform ?? source.platform] : '';
          return (
            <SwiperSlide key={id}>
              <div className="reel-area">
                {imported ? (
                  <div className="reel-import">
                    {card.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="reel-import__cover" src={card.image_url} alt="" />
                    ) : (
                      <span className="reel-import__cover reel-import__cover--blank" aria-hidden="true" />
                    )}
                    {embedFor === id && isActive && embed ? (
                      <div className="reel-import__player">
                        <iframe
                          src={embed}
                          title={`${postTitle(card)} on ${where}`}
                          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                          sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
                        />
                        <button type="button" className="reel-import__close" onClick={() => setEmbedFor(null)} aria-label="Close the video">
                          ✕
                        </button>
                      </div>
                    ) : embed ? (
                      <button type="button" className="reel-import__play" onClick={() => setEmbedFor(id)} aria-label={`Watch ${postTitle(card)} from ${where}`}>
                        <Play size={30} fill="currentColor" aria-hidden="true" />
                        <span>Watch</span>
                      </button>
                    ) : (
                      <a className="reel-import__play" href={source?.url} target="_blank" rel="noopener noreferrer nofollow">
                        <Play size={30} fill="currentColor" aria-hidden="true" />
                        <span>Watch on {where}</span>
                      </a>
                    )}
                  </div>
                ) : (
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el;
                  }}
                  src={near ? card.media_url ?? undefined : undefined}
                  poster={card.image_url ?? undefined}
                  loop
                  muted
                  playsInline
                  preload={near ? 'auto' : 'none'}
                  onClick={() => setPaused((p) => !p)}
                  onTimeUpdate={(e) => {
                    if (!isActive) return;
                    const el = e.currentTarget;
                    if (el.duration) setProgress(el.currentTime / el.duration);
                  }}
                  aria-label={`${meta?.label ?? 'Video'}: ${postTitle(card)}, by ${author.name}`}
                />
                )}
                <span className="reel-area__shade" aria-hidden="true" />

                {/* Top: position + sound */}
                <div className="reel-hud">
                  <span className="reel-hud__count">
                    {i + 1} / {trims.length}
                    {hasMore ? '+' : ''}
                  </span>
                  <button type="button" className="reel-hud__btn" onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Turn sound on' : 'Turn sound off'}>
                    {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                </div>

                {isActive && paused && (
                  <button type="button" className="reel-paused" onClick={() => setPaused(false)} aria-label="Play">
                    <Play size={30} fill="currentColor" />
                  </button>
                )}

                {/* Bottom: author + what it is, and the action rail */}
                <div className="reel-section">
                  <div className="reel-info">
                    <div className="reel-user">
                      <Link href={`/profile/${author.id}`} className="reel-user__link">
                        <span className="reel-user__avatar" aria-hidden="true">
                          {author.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={author.avatar} alt="" />
                          ) : (
                            author.name.charAt(0).toUpperCase()
                          )}
                        </span>
                        <span className="reel-user__name">{author.name}</span>
                      </Link>
                      {!own && rel !== 'accepted' && (
                        <button type="button" className={`follow-btn${rel === 'outgoing-pending' ? ' following' : ''}`} onClick={() => follow(author.id)} disabled={rel === 'outgoing-pending'}>
                          {rel === 'outgoing-pending' ? 'Requested' : rel === 'incoming-pending' ? 'Accept' : 'Follow'}
                        </button>
                      )}
                    </div>
                    <div className="reel-tags">
                      <span className="reel-tag">
                        {meta?.emoji} {meta?.label}
                      </span>
                      {hasPlace && (
                        <Link href={scoutLink(card.place_name || postTitle(card), card.lat as number, card.lng as number, card.place_id)} className="reel-tag reel-tag--link">
                          <MapPin size={12} aria-hidden="true" /> {card.place_name || 'On the map'}
                        </Link>
                      )}
                      {imported && source && (
                        <a href={source.url} target="_blank" rel="noopener noreferrer nofollow" className="reel-tag reel-tag--link">
                          From {card.source_author ? `${card.source_author} on ` : ''}
                          {where}
                        </a>
                      )}
                      {stops.length > 0 && (
                        <button
                          type="button"
                          className="reel-tag reel-tag--link"
                          data-bs-toggle="offcanvas"
                          data-bs-target="#trimsMoreCanvas"
                          onClick={() => setActiveTrimId(id)}
                        >
                          <Route size={12} aria-hidden="true" /> {stops.length} stops
                        </button>
                      )}
                    </div>
                    <p className="reel-caption">
                      <strong>{postTitle(card)}</strong>
                      {card.caption ? ` · ${card.caption}` : ''}
                    </p>
                    {card.card_type === 'RECIPE_VIDEO' && (
                      <Link href={postPath(id)} className="reel-recipe-link">
                        See the recipe
                      </Link>
                    )}
                  </div>

                  <div className="reel-actions">
                    <button type="button" className={`r-btn${isLiked ? ' liked' : ''}`} onClick={() => toggleLike(id)} aria-pressed={isLiked} aria-label={isLiked ? 'Unlike' : 'Like'}>
                      <span className="r-btn__icon">
                        <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} />
                      </span>
                      <span>{likeCounts[id] ?? 0}</span>
                    </button>
                    <button type="button" className={`r-btn${isSaved ? ' liked' : ''}`} onClick={() => toggleSave(trim)} aria-pressed={isSaved} aria-label={isSaved ? 'Remove from My Plate' : 'Save to My Plate'}>
                      <span className="r-btn__icon">
                        <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
                      </span>
                      <span>{isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                    <button type="button" className="r-btn" onClick={() => setSharing(postSharePayload(card, author.name))} aria-label="Share">
                      <span className="r-btn__icon">
                        <Share2 size={20} />
                      </span>
                      <span>Share</span>
                    </button>
                    <button
                      type="button"
                      className="r-btn"
                      data-bs-toggle="offcanvas"
                      data-bs-target="#trimsMoreCanvas"
                      onClick={() => setActiveTrimId(id)}
                      aria-label="More options"
                    >
                      <span className="r-btn__icon">
                        <MoreVertical size={20} />
                      </span>
                    </button>
                  </div>
                </div>

                {isActive && (
                  <span className="reel-progress" aria-hidden="true">
                    <span style={{ transform: `scaleX(${progress})` }} />
                  </span>
                )}
                {isActive && paused && <span className="visually-hidden">Paused</span>}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {notice && (
        <div className="reel-toast" role="status">
          {notice}
        </div>
      )}

      <ShareSheet payload={sharing} onClose={() => setSharing(null)} />

      <div className="offcanvas offcanvas-bottom fz-reel-sheet" tabIndex={-1} id="trimsMoreCanvas" aria-labelledby="trimsMoreTitle">
        <div className="offcanvas-header">
          <h6 className="offcanvas-title" id="trimsMoreTitle">
            {activeTrim ? postTitle(activeTrim.card) : 'Trim options'}
          </h6>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" />
        </div>
        <div className="offcanvas-body">
          {activeTrim && (activeTrim.card.stops?.length ?? 0) > 0 && (
            <ol className="reel-stops" aria-label="Stops on this tour">
              {activeTrim.card.stops!.map((s, n) => (
                <li key={`${n}-${s.name}`}>
                  <Link href={scoutLink(s.name, s.lat, s.lng, s.placeId)} data-bs-dismiss="offcanvas">
                    <strong>{s.name}</strong>
                    {s.dish && <span>{s.dish}</span>}
                  </Link>
                </li>
              ))}
            </ol>
          )}
          <div className="list-group">
            {activeTrim && (
              <Link href={postPath(activeTrim.card.id)} className="list-group-item list-group-item-action" data-bs-dismiss="offcanvas">
                📄 See the full post
              </Link>
            )}
            <button type="button" className="list-group-item list-group-item-action" data-bs-dismiss="offcanvas" onClick={() => activeTrim && toggleSave(activeTrim)}>
              🔖 {activeTrim && saved.has(activeTrim.card.id) ? 'Remove from My Plate' : 'Save to My Plate'}
            </button>
            <button type="button" className="list-group-item list-group-item-action" data-bs-dismiss="offcanvas" onClick={() => activeTrim && hide(activeTrim.card.id)}>
              🙈 Hide this video
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
