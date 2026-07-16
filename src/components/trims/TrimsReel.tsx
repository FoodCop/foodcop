'use client';

import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel } from 'swiper/modules';
import 'swiper/css';

// Ported from Soziety's reels.html: a full-bleed vertical video swiper with a
// like/comment/share/more action rail per slide. Real video files (not mock
// data), the "more" menu reuses Bootstrap's own offcanvas-bottom component.
const VIDEOS = [
  { id: 1, src: '/videos/trims/video1.mp4' },
  { id: 2, src: '/videos/trims/video2.mp4' },
  { id: 3, src: '/videos/trims/video3.mp4' },
  { id: 4, src: '/videos/trims/video4.mp4' },
  { id: 5, src: '/videos/trims/video5.mp4' },
];

// Hoisted so the modules array is a stable reference across renders - a new
// array literal here on every render can make Swiper tear down/reinit repeatedly.
const SWIPER_MODULES = [Mousewheel];

export default function TrimsReel() {
  const [likes, setLikes] = useState<Record<number, { liked: boolean; count: number }>>({});

  const toggleLike = (id: number) => {
    setLikes((prev) => {
      const current = prev[id] ?? { liked: false, count: 0 };
      return { ...prev, [id]: { liked: !current.liked, count: current.count + (current.liked ? -1 : 1) } };
    });
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
                    <button type="button" className="r-btn" data-bs-toggle="offcanvas" data-bs-target="#trimsMoreCanvas">
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
            <button type="button" className="list-group-item list-group-item-action" data-bs-dismiss="offcanvas">
              🔖 Save
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
