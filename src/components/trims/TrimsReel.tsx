'use client';

import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel } from 'swiper/modules';
import 'swiper/css';
import { PlateService } from '@/lib/services/plateService';
import { TrimLikesService } from '@/lib/services/trimLikesService';
import { useAuth } from '@/components/auth/AuthProvider';

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

  const share = async (id: number) => {
    const url = `${window.location.origin}/trims#${id}`;
    if (navigator.share) {
      await navigator.share({ title: 'FUZO Trim', url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <>
      <Swiper direction="vertical" modules={SWIPER_MODULES} mousewheel className="reel-swiper" slidesPerView={1}>
        {VIDEOS.map((v) => {
          const like = likes[v.id] ?? { liked: false, count: 0 };
          return (
            <SwiperSlide key={v.id}>
              <div className="reel-area">
                <div className="reel-top">
                  <span className="fw-bold">Trims</span>
                </div>

                <video src={v.src} autoPlay loop muted playsInline />

                <div className="reel-section">
                  <div className="reel-user">
                    <div
                      className="rounded-circle bg-light d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 36, height: 36 }}
                    >
                      🍽️
                    </div>
                    <button type="button" className="follow-btn">
                      Follow
                    </button>
                  </div>

                  <div className="reel-actions">
                    <button type="button" className={`r-btn${like.liked ? ' liked' : ''}`} onClick={() => toggleLike(v.id)}>
                      ♥<span>{like.count}</span>
                    </button>
                    <button type="button" className="r-btn" onClick={() => share(v.id)}>
                      ↗<span>Share</span>
                    </button>
                    <button
                      type="button"
                      className="r-btn"
                      data-bs-toggle="offcanvas"
                      data-bs-target="#trimsMoreCanvas"
                      onClick={() => setActiveTrimId(v.id)}
                    >
                      ⋮
                    </button>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      <div className="offcanvas offcanvas-bottom" tabIndex={-1} id="trimsMoreCanvas">
        <div className="offcanvas-header">
          <h6 className="offcanvas-title">Trim options</h6>
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
              ✂️ Edit
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
