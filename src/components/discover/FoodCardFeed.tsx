'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import {
  aggregateForUser,
  getOnboardingPrefs,
  getFeedCards,
  type FeedCard,
} from '@/lib/services/recommendationService';
import { PlateService, type PlateItemType } from '@/lib/services/plateService';
import { TYPE_META, familyOf, type FoodCardFamily } from '@/lib/types/foodCard';
import { UserSettingsService, DEFAULT_USER_SETTINGS } from '@/lib/services/userSettingsService';

// Same Tinder-style drag/swipe mechanic as the old SwipeFeed.tsx (ported
// from Romio's Home.tsx originally), re-pointed at real food_cards ranked by
// getFeedCards() instead of a static shuffled curatedRecipes.json sample -
// curated recipes are Bites' job now, not Feed's (Bites already owns full
// search/browse of that same set, so showing it twice was redundant).
const FAMILY_TO_PLATE_TYPE: Record<FoodCardFamily, PlateItemType> = {
  recipe: 'recipe',
  restaurant: 'restaurant',
  video: 'video',
  discovery: 'photo',
};

export default function FoodCardFeed() {
  const { user } = useAuth();
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragInfo = useRef({ isDragging: false, startX: 0, moveX: 0 });

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      const settingsResult = await UserSettingsService.get();
      const settings = settingsResult.success && settingsResult.data ? settingsResult.data : DEFAULT_USER_SETTINGS;

      const [aggregate, onboardingPrefs] = await Promise.all([
        aggregateForUser(user.id, settings.useActivityForMl),
        getOnboardingPrefs(user.id),
      ]);
      const feed = await getFeedCards(
        user.id,
        aggregate,
        onboardingPrefs,
        30,
        settings.matchSensitivity,
        settings.prioritizeTrending,
      );
      if (!cancelled) {
        setCards(feed);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // reset transforms of visible cards after index changes
  useEffect(() => {
    const t = setTimeout(() => {
      const node = containerRef.current;
      if (!node) return;
      const nodeCards = Array.from(node.querySelectorAll<HTMLDivElement>('.tinder-card'));
      nodeCards.forEach((cardEl, idx) => {
        const stackIdx = idx - currentIndex;
        if (stackIdx < 0) {
          cardEl.style.display = 'none';
        } else if (stackIdx === 0) {
          cardEl.style.display = 'flex';
          cardEl.style.zIndex = `${cards.length}`;
          cardEl.style.transform = 'translateY(0) scale(1) rotate(0deg)';
          cardEl.style.opacity = '1';
        } else if (stackIdx > 0 && stackIdx < 6) {
          cardEl.style.display = 'flex';
          cardEl.style.zIndex = `${cards.length - stackIdx}`;
          cardEl.style.transform = `translateY(${stackIdx * 10}px) scale(${1 - stackIdx * 0.03}) rotate(0deg)`;
          cardEl.style.opacity = '1';
        } else {
          cardEl.style.display = 'none';
        }
        const likeEl = cardEl.querySelector<HTMLElement>('.like');
        const dislikeEl = cardEl.querySelector<HTMLElement>('.dislike');
        if (likeEl) likeEl.style.opacity = '0';
        if (dislikeEl) dislikeEl.style.opacity = '0';
      });
    }, 30);

    return () => clearTimeout(t);
  }, [currentIndex, cards]);

  // Swipe-right persists to saved_items via the same PlateService.saveToPlate
  // path ActivityTab.tsx's own save button already uses - closes the old
  // SwipeFeed.tsx's "liking is local-state only for now" TODO. Swipe-left
  // stays session-only (no skip-tracking table exists, and nothing asked for
  // one yet).
  function persistLike(feedCard: FeedCard) {
    const family = familyOf(feedCard.card.card_type);
    PlateService.saveToPlate({
      itemId: feedCard.card.id,
      itemType: FAMILY_TO_PLATE_TYPE[family],
      metadata: {
        title: feedCard.card.title,
        image: feedCard.card.image_url,
        cuisine: feedCard.card.tags?.cuisine?.[0],
        authorName: feedCard.author.displayName,
        card_type: feedCard.card.card_type,
      },
    }).catch((err) => console.warn('Feed like persistence failed:', err));
  }

  function handleSwipe(direction: 'left' | 'right') {
    if (isAnimating) return;
    if (currentIndex >= cards.length) return;

    setIsAnimating(true);
    const node = containerRef.current;
    if (!node) return;
    const cardEls = Array.from(node.querySelectorAll<HTMLDivElement>('.tinder-card'));
    const currentCard = cardEls[currentIndex];
    if (!currentCard) return;

    const likeEl = currentCard.querySelector<HTMLElement>('.like');
    const dislikeEl = currentCard.querySelector<HTMLElement>('.dislike');

    if (direction === 'right') {
      if (likeEl) likeEl.style.opacity = '1';
      currentCard.style.animation = 'swipeRight 0.5s forwards';
      persistLike(cards[currentIndex]);
    } else {
      if (dislikeEl) dislikeEl.style.opacity = '1';
      currentCard.style.animation = 'swipeLeft 0.5s forwards';
    }

    setTimeout(() => {
      currentCard.style.display = 'none';
      setCurrentIndex((prev) => prev + 1);
      if (likeEl) likeEl.style.opacity = '0';
      if (dislikeEl) dislikeEl.style.opacity = '0';
      setIsAnimating(false);
    }, 500);
  }

  function onDragStart(clientX: number, idx: number, card: HTMLDivElement) {
    if (idx !== currentIndex) return;
    dragInfo.current = { isDragging: true, startX: clientX, moveX: 0 };
    card.style.transition = 'none';
  }

  function onDragMove(clientX: number) {
    if (!dragInfo.current.isDragging || isAnimating || currentIndex >= cards.length) return;
    const cardElems = containerRef.current?.querySelectorAll<HTMLDivElement>('.tinder-card');
    if (!cardElems) return;
    const currentCard = cardElems[currentIndex];
    if (!currentCard) return;

    dragInfo.current.moveX = clientX - dragInfo.current.startX;
    const rotate = dragInfo.current.moveX * 0.1;
    currentCard.style.transform = `translateX(${dragInfo.current.moveX}px) rotate(${rotate}deg) translateY(0) scale(1)`;

    const likeEl = currentCard.querySelector<HTMLElement>('.like');
    const dislikeEl = currentCard.querySelector<HTMLElement>('.dislike');
    if (dragInfo.current.moveX > 50) {
      if (likeEl) likeEl.style.opacity = `${Math.min(1, dragInfo.current.moveX / 100)}`;
      if (dislikeEl) dislikeEl.style.opacity = '0';
    } else if (dragInfo.current.moveX < -50) {
      if (dislikeEl) dislikeEl.style.opacity = `${Math.min(1, Math.abs(dragInfo.current.moveX) / 100)}`;
      if (likeEl) likeEl.style.opacity = '0';
    }
  }

  function onDragEnd() {
    if (!dragInfo.current.isDragging) return;
    dragInfo.current.isDragging = false;
    const cardElems = containerRef.current?.querySelectorAll<HTMLDivElement>('.tinder-card');
    if (!cardElems) return;
    const currentCard = cardElems[currentIndex];
    if (!currentCard) return;

    currentCard.style.transition = 'transform 0.3s ease';
    if (dragInfo.current.moveX > 100) {
      handleSwipe('right');
    } else if (dragInfo.current.moveX < -100) {
      handleSwipe('left');
    } else {
      currentCard.style.transform = 'translateY(0) rotate(0deg) scale(1)';
      const likeEl = currentCard.querySelector<HTMLElement>('.like');
      const dislikeEl = currentCard.querySelector<HTMLElement>('.dislike');
      if (likeEl) likeEl.style.opacity = '0';
      if (dislikeEl) dislikeEl.style.opacity = '0';
    }
    dragInfo.current.moveX = 0;
  }

  if (loading) {
    return (
      <div className="container text-center py-5 text-muted">
        Finding discoveries for you…
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div className="container text-center py-5 text-muted">
        No discoveries right now.
        <br />
        Check back later, or follow more people to see their food cards here.
      </div>
    );
  }

  return (
    <div className="container">
      <div
        className="tinder-container"
        ref={containerRef}
        onMouseMove={(e) => onDragMove(e.clientX)}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
      >
        {cards.map((feedCard, idx) => {
          const meta = TYPE_META[feedCard.card.card_type];
          return (
            <div
              key={feedCard.card.id}
              className="tinder-card"
              data-index={idx}
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.75) 100%), url(${feedCard.card.image_url || ''})`,
              }}
              onMouseDown={(e) => onDragStart(e.clientX, idx, e.currentTarget)}
              onTouchStart={(e) => onDragStart(e.touches[0].clientX, idx, e.currentTarget)}
              onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
              onTouchEnd={onDragEnd}
            >
              <div className="dislike">✕</div>
              <div className="like">♥</div>

              <span className="feed-card-badge" style={{ backgroundColor: meta.color }}>
                {meta.emoji} {meta.label}
              </span>

              <div className="card-info">
                <h3>{feedCard.card.title}</h3>
                <div className="feed-card-byline">by {feedCard.author.displayName}</div>
                <div className="feed-meta">
                  {feedCard.card.tags?.cuisine?.[0] && <span>{feedCard.card.tags.cuisine[0]}</span>}
                  <span className="feed-card-match-reason">{feedCard.matchReason}</span>
                </div>
              </div>
            </div>
          );
        })}

        <div className="card-actions">
          <button className="action-btn dislike-btn" onClick={() => handleSwipe('left')} type="button" aria-label="Skip">
            ✕
          </button>
          <button className="action-btn like-btn" onClick={() => handleSwipe('right')} type="button" aria-label="Save">
            ♥
          </button>
        </div>

        <div className="end-message" style={{ display: currentIndex >= cards.length ? 'block' : 'none' }}>
          You&rsquo;re all caught up.
          <br />
          Check back later for more discoveries.
        </div>
      </div>
    </div>
  );
}
