'use client';

import { useEffect, useRef, useState } from 'react';
import { Heart, Share2, X } from 'lucide-react';
import ShareSheet, { type SharePayload } from '@/components/share/ShareSheet';
import { useAuth } from '../auth/AuthProvider';
import {
  aggregateForUser,
  getOnboardingPrefs,
  getFeedCards,
  type FeedCard,
} from '@/lib/services/recommendationService';
import { PlateService, type PlateItemType } from '@/lib/services/plateService';
import { ActivityEventService } from '@/lib/services/activityEventService';
import { TYPE_META, familyOf, type FoodCardFamily } from '@/lib/types/foodCard';
import { UserSettingsService, DEFAULT_USER_SETTINGS } from '@/lib/services/userSettingsService';
import { createClient } from '@/lib/supabase/client';

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

      const supabase = createClient();
      const dnaScores = supabase
        ? (
            await supabase.from('taste_profiles').select('dna_scores').eq('user_id', user.id).maybeSingle()
          ).data?.dna_scores ?? null
        : null;

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
        dnaScores,
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
      const nodeCards = Array.from(node.querySelectorAll<HTMLElement>('.tinder-card'));
      nodeCards.forEach((cardEl, idx) => {
        const stackIdx = idx - currentIndex;
        if (stackIdx >= 0) cardEl.style.animation = '';
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
          // Cards behind peek out below, slightly smaller.
          cardEl.style.transform = `translateY(${stackIdx * 12}px) scale(${1 - stackIdx * 0.04}) rotate(0deg)`;
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
  // Share asks where: FUZO friends/groups or other apps (ShareSheet).
  const [sharing, setSharing] = useState<SharePayload | null>(null);
  function shareCard(feedCard: FeedCard) {
    const { card, author } = feedCard;
    const meta = TYPE_META[card.card_type];
    setSharing({
      title: card.title,
      subtitle: `${meta.label} · by ${author.displayName}`,
      image: card.image_url ?? undefined,
      url: `/profile/${author.id}`,
      text: `Check out "${card.title}" by ${author.displayName} on FUZO`,
      item: {
        id: card.id,
        itemId: card.id,
        itemType: 'food_card', // chat opens it in the food-card viewer
        type: meta.label,
        title: card.title,
        cat: meta.label,
        img: card.image_url ?? undefined,
        caption: card.caption ?? undefined,
        author: author.displayName,
        placeId: card.place_id ?? undefined,
      },
    });
  }

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
    const cardEls = Array.from(node.querySelectorAll<HTMLElement>('.tinder-card'));
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
      // Skips feed Flavor DNA / Food DNA behaviour signals (src/lib/profile/kpi).
      ActivityEventService.track({ type: 'card_skipped', entityType: 'food_card', entityId: cards[currentIndex].card.id });
    }
    ActivityEventService.track({ type: 'card_viewed', entityType: 'food_card', entityId: cards[currentIndex].card.id });

    setTimeout(() => {
      currentCard.style.display = 'none';
      setCurrentIndex((prev) => prev + 1);
      if (likeEl) likeEl.style.opacity = '0';
      if (dislikeEl) dislikeEl.style.opacity = '0';
      setIsAnimating(false);
    }, 500);
  }

  function onDragStart(clientX: number, idx: number, card: HTMLElement) {
    if (idx !== currentIndex) return;
    dragInfo.current = { isDragging: true, startX: clientX, moveX: 0 };
    card.style.transition = 'none';
  }

  function onDragMove(clientX: number) {
    if (!dragInfo.current.isDragging || isAnimating || currentIndex >= cards.length) return;
    const cardElems = containerRef.current?.querySelectorAll<HTMLElement>('.tinder-card');
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
    const cardElems = containerRef.current?.querySelectorAll<HTMLElement>('.tinder-card');
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
      <div className="feed">
        <div className="feed__stage" role="status" aria-label="Finding discoveries for you">
          <div className="feed-card feed-card--skeleton" />
        </div>
        <div className="feed__bar" aria-hidden="true">
          <span className="feed__btn feed__btn--skip feed__btn--ghost" />
          <span className="feed__count">&nbsp;</span>
          <span className="feed__btn feed__btn--save feed__btn--ghost" />
        </div>
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div className="feed-empty">
        <div className="feed-empty__emoji" aria-hidden="true">🍽️</div>
        <div className="feed-empty__title">No discoveries right now</div>
        <p className="feed-empty__sub">Check back later, or follow more people to see their food cards here.</p>
      </div>
    );
  }

  const done = currentIndex >= cards.length;

  return (
    <div className="feed">
      <div
        className="feed__stage tinder-container"
        ref={containerRef}
        onMouseMove={(e) => onDragMove(e.clientX)}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
      >
        {cards.map((feedCard, idx) => {
          const meta = TYPE_META[feedCard.card.card_type];
          const author = feedCard.author;
          return (
            <article
              key={feedCard.card.id}
              className="tinder-card feed-card"
              data-index={idx}
              aria-hidden={idx !== currentIndex}
              onMouseDown={(e) => onDragStart(e.clientX, idx, e.currentTarget)}
              onTouchStart={(e) => onDragStart(e.touches[0].clientX, idx, e.currentTarget)}
              onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
              onTouchEnd={onDragEnd}
            >
              {feedCard.card.image_url ? (
                <img className="feed-card__img" src={feedCard.card.image_url} alt="" draggable={false} loading={idx - currentIndex < 3 ? 'eager' : 'lazy'} />
              ) : (
                <span className="feed-card__img feed-card__img--empty" />
              )}
              <span className="feed-card__shade" />

              {/* Drag feedback stamps (opacity driven by the swipe handlers). */}
              <div className="dislike feed-stamp feed-stamp--skip" aria-hidden="true">
                <X size={16} strokeWidth={3} /> Skip
              </div>
              <div className="like feed-stamp feed-stamp--save" aria-hidden="true">
                <Heart size={16} fill="currentColor" /> Save
              </div>

              <span className="feed-card-badge">
                <span className="feed-card-badge__dot" style={{ backgroundColor: meta.color }} aria-hidden="true" />
                {meta.emoji} {meta.label}
              </span>

              {idx === currentIndex && (
                <button
                  type="button"
                  className="feed-card__share"
                  aria-label="Share"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={() => shareCard(feedCard)}
                >
                  <Share2 size={17} />
                </button>
              )}

              <div className="feed-card__body">
                <div className="feed-card__author">
                  {author.avatarUrl ? (
                    <img src={author.avatarUrl} alt="" draggable={false} />
                  ) : (
                    <span aria-hidden="true">{(author.displayName || '?').charAt(0).toUpperCase()}</span>
                  )}
                  <span className="feed-card__author-name">{author.displayName}</span>
                </div>
                <h3 className="feed-card__title">{feedCard.card.title}</h3>
                {feedCard.card.caption && <p className="feed-card__caption">{feedCard.card.caption}</p>}
                <div className="feed-meta">
                  {feedCard.card.tags?.cuisine?.[0] && <span>{feedCard.card.tags.cuisine[0]}</span>}
                  {feedCard.matchReason && <span className="feed-card-match-reason">{feedCard.matchReason}</span>}
                </div>
              </div>
            </article>
          );
        })}

        {done && (
          <div className="feed-done">
            <div className="feed-done__emoji" aria-hidden="true">🎉</div>
            <div className="feed-done__title">You&rsquo;re all caught up</div>
            <p className="feed-done__sub">Check back later for more discoveries.</p>
            <button type="button" className="feed-done__btn" onClick={() => setCurrentIndex(0)}>
              Start over
            </button>
          </div>
        )}
      </div>

      <ShareSheet payload={sharing} onClose={() => setSharing(null)} />

      <div className="feed__bar">
        <button className="feed__btn feed__btn--skip" onClick={() => handleSwipe('left')} type="button" aria-label="Skip" disabled={done}>
          <X size={16} strokeWidth={2.8} />
        </button>
        <span className="feed__count" aria-live="polite">
          {done ? `${cards.length} / ${cards.length}` : `${currentIndex + 1} / ${cards.length}`}
        </span>
        <button className="feed__btn feed__btn--save" onClick={() => handleSwipe('right')} type="button" aria-label="Save" disabled={done}>
          <Heart size={19} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
