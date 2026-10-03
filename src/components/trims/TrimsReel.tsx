'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel } from 'swiper/modules';
import 'swiper/css';
import { PlateService } from '@/lib/services/plateService';
import { TrimLikesService } from '@/lib/services/trimLikesService';
import { useAuth } from '@/components/auth/AuthProvider';
import { Bookmark, Heart, MoreVertical, Play, Share2, Volume2, VolumeX } from 'lucide-react';
import ShareSheet, { type SharePayload } from '@/components/share/ShareSheet';

// Ported from Soziety's reels.html: a full-bleed vertical video swiper with a
// like/comment/share/more action rail per slide. Real video files (not mock
// data), the "more" menu reuses Bootstrap's own offcanvas-bottom component.
// Like (trim_likes table) and Save (saved_items/PlateService, itemType
// 'video') are both real, persisted actions now - previously in-memory only.
const VIDEOS = [
  { id: 1, src: '/videos/trims/video1.mp4' },
  { id: 2, src: '/videos/trims/video2.mp4' },
  { id: 3, src: '/videos/trims/video3.mp4' },
  { id: 4, src: '/videos/trims/video4.mp4' },
  { id: 5, src: '/videos/trims/video5.mp4' },
];

// A trim's saved_items itemId - prefixed so it can never collide with a real
// uploaded food-card video, which also uses itemType 'video'.
const trimItemId = (id: number) => `trim-${id}`;

// Hoisted so the modules array is a stable reference across renders - a new
// array literal here on every render can make Swiper tear down/reinit repeatedly.
const SWIPER_MODULES = [Mousewheel];

export default function TrimsReel() {
  const { user } = useAuth();
  const [likes, setLikes] = useState<Record<number, { liked: boolean; count: number }>>({});
  const [saved, setSaved] = useState<Set<number>>(new Set());
  // The single shared offcanvas (#trimsMoreCanvas) doesn't otherwise know
  // which slide's ⋮ button opened it - tracked here so its Save action acts
  // on the right trim.
  const [activeTrimId, setActiveTrimId] = useState<number | null>(null);

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
  }, [activeIndex, paused, muted]);

  const onSlideChange = useCallback((index: number) => {
    setActiveIndex(index);
    setPaused(false);
    setProgress(0);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const [likedResult, savedResult] = await Promise.all([
        TrimLikesService.listLikedTrimIds(),
        PlateService.listSavedItems(),
      ]);

      if (likedResult.success && likedResult.data) {
        const likedIds = new Set(likedResult.data);
        setLikes(
          Object.fromEntries(
            VIDEOS.map((v) => [v.id, { liked: likedIds.has(v.id), count: likedIds.has(v.id) ? 1 : 0 }]),
          ),
        );
      }

      if (savedResult.success && savedResult.data) {
        const savedIds = new Set(
          savedResult.data
            .filter((i) => i.item_type === 'video' && i.item_id.startsWith('trim-'))
            .map((i) => Number(i.item_id.replace('trim-', ''))),
        );
        setSaved(savedIds);
      }
    })();
  }, [user?.id]);

  const toggleLike = async (id: number) => {
    const current = likes[id] ?? { liked: false, count: 0 };
    const nextLiked = !current.liked;

    setLikes((prev) => ({ ...prev, [id]: { liked: nextLiked, count: nextLiked ? 1 : 0 } }));

    const result = nextLiked ? await TrimLikesService.like(id) : await TrimLikesService.unlike(id);
    if (!result.success) {
      setLikes((prev) => ({ ...prev, [id]: current }));
    }
  };

  const toggleSave = async (id: number) => {
    const wasSaved = saved.has(id);

    setSaved((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(id);
      else next.add(id);
      return next;
    });

    const result = wasSaved
      ? await PlateService.removeFromPlate({ itemId: trimItemId(id), itemType: 'video' })
      : await PlateService.saveToPlate({
          itemId: trimItemId(id),
          itemType: 'video',
          metadata: { title: `Trim ${id}`, cat: 'Studio Trim' },
        });

    if (!result.success) {
      setSaved((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  // Share asks where: FUZO friends/groups or other apps (ShareSheet).
  const [sharing, setSharing] = useState<SharePayload | null>(null);
  const share = (id: number) =>
    setSharing({
      title: `FUZO Trim ${id}`,
      subtitle: 'Short food clip on FUZO',
      url: `/dashboard?tab=trims&trim=${id}`,
      text: 'Watch this food clip on FUZO',
      item: { id: trimItemId(id), itemId: trimItemId(id), itemType: 'video', type: 'video', title: `FUZO Trim ${id}`, cat: 'Trim' },
    });

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
          // Shared links open on that clip: /dashboard?tab=trims&trim=<id> (or the older /trims#<id>).
          const wanted = new URLSearchParams(window.location.search).get('trim') ?? window.location.hash.slice(1);
          const idx = VIDEOS.findIndex((v) => String(v.id) === wanted);
          if (idx > 0) sw.slideTo(idx, 0);
        }}
      >
        {VIDEOS.map((v, i) => {
          const like = likes[v.id] ?? { liked: false, count: 0 };
          const isSaved = saved.has(v.id);
          const isActive = i === activeIndex;
          return (
            <SwiperSlide key={v.id}>
              <div className="reel-area">
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el;
                  }}
                  src={v.src}
                  loop
                  muted
                  playsInline
                  preload={Math.abs(i - activeIndex) <= 1 ? 'auto' : 'metadata'}
                  onClick={() => setPaused((p) => !p)}
                  onTimeUpdate={(e) => {
                    if (!isActive) return;
                    const el = e.currentTarget;
                    if (el.duration) setProgress(el.currentTime / el.duration);
                  }}
                />
                <span className="reel-area__shade" aria-hidden="true" />

                {/* Top: position + sound */}
                <div className="reel-hud">
                  <span className="reel-hud__count">
                    {i + 1} / {VIDEOS.length}
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

                {/* Bottom: author + caption, and the action rail */}
                <div className="reel-section">
                  <div className="reel-info">
                    <div className="reel-user">
                      <span className="reel-user__avatar" aria-hidden="true">🍽️</span>
                      <span className="reel-user__name">FUZO Trims</span>
                      <button type="button" className="follow-btn">
                        Follow
                      </button>
                    </div>
                    <p className="reel-caption">Short food clips from the FUZO community · Trim {v.id}</p>
                  </div>

                  <div className="reel-actions">
                    <button type="button" className={`r-btn${like.liked ? ' liked' : ''}`} onClick={() => toggleLike(v.id)} aria-pressed={like.liked} aria-label={like.liked ? 'Unlike' : 'Like'}>
                      <span className="r-btn__icon"><Heart size={22} fill={like.liked ? 'currentColor' : 'none'} /></span>
                      <span>{like.count}</span>
                    </button>
                    <button type="button" className={`r-btn${isSaved ? ' liked' : ''}`} onClick={() => toggleSave(v.id)} aria-pressed={isSaved} aria-label={isSaved ? 'Remove from saved' : 'Save'}>
                      <span className="r-btn__icon"><Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} /></span>
                      <span>{isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                    <button type="button" className="r-btn" onClick={() => share(v.id)} aria-label="Share">
                      <span className="r-btn__icon"><Share2 size={20} /></span>
                      <span>Share</span>
                    </button>
                    <button
                      type="button"
                      className="r-btn"
                      data-bs-toggle="offcanvas"
                      data-bs-target="#trimsMoreCanvas"
                      onClick={() => setActiveTrimId(v.id)}
                      aria-label="More options"
                    >
                      <span className="r-btn__icon"><MoreVertical size={20} /></span>
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

      <ShareSheet payload={sharing} onClose={() => setSharing(null)} />

      <div className="offcanvas offcanvas-bottom fz-reel-sheet" tabIndex={-1} id="trimsMoreCanvas" aria-labelledby="trimsMoreTitle">
        <div className="offcanvas-header">
          <h6 className="offcanvas-title" id="trimsMoreTitle">Trim options</h6>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" />
        </div>
        <div className="offcanvas-body">
          <div className="list-group">
            <button
              type="button"
              className="list-group-item list-group-item-action"
              data-bs-dismiss="offcanvas"
              onClick={() => activeTrimId !== null && toggleSave(activeTrimId)}
            >
              🔖 {activeTrimId !== null && saved.has(activeTrimId) ? 'Saved' : 'Save'}
            </button>
            <button type="button" className="list-group-item list-group-item-action" data-bs-dismiss="offcanvas">
              🙈 Not interested
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
