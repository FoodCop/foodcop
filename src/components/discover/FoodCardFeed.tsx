'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bookmark, Heart, Share2, X } from 'lucide-react';
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
import { FoodCardLikesService } from '@/lib/services/foodCardLikesService';
import { TYPE_META, familyOf, type FoodCardFamily } from '@/lib/types/foodCard';
import { UserSettingsService, DEFAULT_USER_SETTINGS } from '@/lib/services/userSettingsService';
import { createClient } from '@/lib/supabase/client';

// Same Tinder-style drag/swipe mechanic as the old SwipeFeed.tsx (ported
// from Romio's Home.tsx originally), re-pointed at real food_cards ranked by
// getFeedCards() instead of a static shuffled curatedRecipes.json sample -
// curated recipes are Bites' job now, not Feed's (Bites already owns full
// search/browse of that same set, so showing it twice was redundant).
// Swipe directions (client, 2026-10-06): left = dislike, right = like,
// up = share, down = save to My Plate.
type SwipeDir = 'left' | 'right' | 'up' | 'down';
const SWIPE_X = 100; // px of horizontal drag that commits a left/right swipe
const SWIPE_Y = 90; // px of vertical drag that commits an up/down swipe
const FLY: Record<SwipeDir, string> = { left: 'swipeLeft', right: 'swipeRight', up: 'swipeUp', down: 'swipeDown' };
const HINT_KEY = 'fz-feed-swipe-hint-seen';

/** Show one direction's stamp (Nope / Like / Share / Save) at a strength, hide the rest. */
function showStamp(card: HTMLElement, dir: SwipeDir | null, strength = 1) {
  card.querySelectorAll<HTMLElement>('[data-stamp]').forEach((el) => {
    el.style.opacity = el.dataset.stamp === dir ? `${Math.min(1, strength)}` : '0';
  });
}

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
  const dragInfo = useRef({ isDragging: false, startX: 0, startY: 0, moveX: 0, moveY: 0 });
  // Short confirmation after an action ("Saved to My Plate", "Liked").
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | undefined>(undefined);
  const flash = (text: string) => {
    window.clearTimeout(noticeTimer.current);
    setNotice(text);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2200);
  };
  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);
  // "How to swipe" hint until the first swipe (remembered on this device;
  // read after hydration so the server and first client render agree).
  const hintSeen = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return window.localStorage.getItem(HINT_KEY) === '1';
      } catch {
        return false;
      }
    },
    () => true,
  );
  const [hintDismissed, setHintDismissed] = useState(false);
  const showHint = !hintSeen && !hintDismissed;
  const hideHint = () => {
    if (!showHint) return;
    setHintDismissed(true);
    try {
      window.localStorage.setItem(HINT_KEY, '1');
    } catch {
      /* storage unavailable - the hint just shows again next visit */
    }
  };

  useEffect(() => {
    if (!user?.id) return; // signed out: nothing to load (see isLoading below)
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
        showStamp(cardEl, null);
      });
    }, 30);

    return () => clearTimeout(t);
  }, [currentIndex, cards]);

  // Share (swipe up) asks where: FUZO friends/groups or other apps (ShareSheet).
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

  // Swipe down: save to My Plate (saved_items - the same pipeline as every other save).
  async function saveToPlate(feedCard: FeedCard) {
    const family = familyOf(feedCard.card.card_type);
    const res = await PlateService.saveToPlate({
      itemId: feedCard.card.id,
      itemType: FAMILY_TO_PLATE_TYPE[family],
      metadata: {
        title: feedCard.card.title,
        image: feedCard.card.image_url,
        cuisine: feedCard.card.tags?.cuisine?.[0],
        authorName: feedCard.author.displayName,
        card_type: feedCard.card.card_type,
      },
    });
    flash(res.success ? 'Saved to My Plate' : res.error === 'User not authenticated' ? 'Sign in to save' : 'Could not save - try again');
  }

  // Swipe right: like (its own table - a like isn't a save).
  async function like(feedCard: FeedCard) {
    const res = await FoodCardLikesService.like(feedCard.card.id);
    flash(res.success ? 'Liked' : res.error === 'User not authenticated' ? 'Sign in to like' : 'Could not save your like');
  }

  function handleSwipe(direction: SwipeDir) {
    if (isAnimating) return;
    if (currentIndex >= cards.length) return;

    const node = containerRef.current;
    if (!node) return;
    const cardEls = Array.from(node.querySelectorAll<HTMLElement>('.tinder-card'));
    const currentCard = cardEls[currentIndex];
    if (!currentCard) return;
    setIsAnimating(true);
    hideHint();

    const feedCard = cards[currentIndex];
    showStamp(currentCard, direction);
    currentCard.style.animation = `${FLY[direction]} 0.45s forwards`;

    if (direction === 'right') like(feedCard);
    else if (direction === 'down') saveToPlate(feedCard);
    else if (direction === 'up') shareCard(feedCard);
    else {
      // Dislike feeds the Flavor DNA / Food DNA behaviour signals (src/lib/profile/kpi).
      ActivityEventService.track({ type: 'card_skipped', entityType: 'food_card', entityId: feedCard.card.id, metadata: { action: 'dislike' } });
    }
    ActivityEventService.track({ type: 'card_viewed', entityType: 'food_card', entityId: feedCard.card.id });

    setTimeout(() => {
      currentCard.style.display = 'none';
      setCurrentIndex((prev) => prev + 1);
      showStamp(currentCard, null);
      setIsAnimating(false);
    }, 450);
  }

  const currentCardEl = () => containerRef.current?.querySelectorAll<HTMLElement>('.tinder-card')[currentIndex] ?? null;

  function onDragStart(clientX: number, clientY: number, idx: number, card: HTMLElement) {
    if (idx !== currentIndex) return;
    dragInfo.current = { isDragging: true, startX: clientX, startY: clientY, moveX: 0, moveY: 0 };
    card.style.transition = 'none';
  }

  /** The direction a drag points in (whichever axis moved more), or null if it's still small. */
  const dragDir = (x: number, y: number): SwipeDir | null =>
    Math.abs(x) >= Math.abs(y) ? (Math.abs(x) > 30 ? (x > 0 ? 'right' : 'left') : null) : Math.abs(y) > 30 ? (y < 0 ? 'up' : 'down') : null;

  function onDragMove(clientX: number, clientY: number) {
    if (!dragInfo.current.isDragging || isAnimating || currentIndex >= cards.length) return;
    const currentCard = currentCardEl();
    if (!currentCard) return;

    const x = (dragInfo.current.moveX = clientX - dragInfo.current.startX);
    const y = (dragInfo.current.moveY = clientY - dragInfo.current.startY);
    currentCard.style.transform = `translate(${x}px, ${y}px) rotate(${x * 0.08}deg) scale(1)`;
    const dir = dragDir(x, y);
    showStamp(currentCard, dir, dir === 'left' || dir === 'right' ? Math.abs(x) / SWIPE_X : Math.abs(y) / SWIPE_Y);
  }

  function onDragEnd() {
    if (!dragInfo.current.isDragging) return;
    dragInfo.current.isDragging = false;
    const currentCard = currentCardEl();
    if (!currentCard) return;

    const { moveX: x, moveY: y } = dragInfo.current;
    currentCard.style.transition = 'transform 0.3s ease';
    const dir = dragDir(x, y);
    const committed =
      (dir === 'left' || dir === 'right') ? Math.abs(x) > SWIPE_X : dir ? Math.abs(y) > SWIPE_Y : false;
    if (dir && committed) {
      handleSwipe(dir);
    } else {
      currentCard.style.transform = 'translateY(0) rotate(0deg) scale(1)';
      showStamp(currentCard, null);
    }
    dragInfo.current.moveX = 0;
    dragInfo.current.moveY = 0;
  }

  // Arrow keys do the same as swipes when the card stack has focus.
  function onKeyDown(e: React.KeyboardEvent) {
    const map: Record<string, SwipeDir> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    const dir = map[e.key];
    if (!dir) return;
    e.preventDefault();
    handleSwipe(dir);
  }

  const isLoading = !!user?.id && loading;
  if (isLoading) {
    return (
      <div className="feed">
        <div className="feed__stage" role="status" aria-label="Finding discoveries for you">
          <div className="feed-card feed-card--skeleton" />
        </div>
        <div className="feed__bar" aria-hidden="true">
          <span className="feed__btn feed__btn--nope feed__btn--ghost" />
          <span className="feed__btn feed__btn--nope feed__btn--ghost" />
          <span className="feed__count">&nbsp;</span>
          <span className="feed__btn feed__btn--nope feed__btn--ghost" />
          <span className="feed__btn feed__btn--like feed__btn--ghost" />
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
        tabIndex={0}
        role="group"
        aria-label="Feed cards. Swipe or use arrow keys: left dislike, right like, up share, down save to My Plate."
        onKeyDown={onKeyDown}
        onMouseMove={(e) => onDragMove(e.clientX, e.clientY)}
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
              onMouseDown={(e) => onDragStart(e.clientX, e.clientY, idx, e.currentTarget)}
              onTouchStart={(e) => onDragStart(e.touches[0].clientX, e.touches[0].clientY, idx, e.currentTarget)}
              onTouchMove={(e) => onDragMove(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchEnd={onDragEnd}
            >
              {feedCard.card.image_url ? (
                <img className="feed-card__img" src={feedCard.card.image_url} alt="" draggable={false} loading={idx - currentIndex < 3 ? 'eager' : 'lazy'} />
              ) : (
                <span className="feed-card__img feed-card__img--empty" />
              )}
              <span className="feed-card__shade" />

              {/* Drag feedback stamps (opacity driven by the swipe handlers). */}
              <div data-stamp="left" className="feed-stamp feed-stamp--nope" aria-hidden="true">
                <X size={16} strokeWidth={3} /> Nope
              </div>
              <div data-stamp="right" className="feed-stamp feed-stamp--like" aria-hidden="true">
                <Heart size={16} fill="currentColor" /> Like
              </div>
              <div data-stamp="up" className="feed-stamp feed-stamp--share" aria-hidden="true">
                <Share2 size={16} strokeWidth={2.6} /> Share
              </div>
              <div data-stamp="down" className="feed-stamp feed-stamp--save" aria-hidden="true">
                <Bookmark size={16} fill="currentColor" /> Save
              </div>

              <span className="feed-card-badge">
                <span className="feed-card-badge__dot" style={{ backgroundColor: meta.color }} aria-hidden="true" />
                {meta.emoji} {meta.label}
              </span>

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

      {notice && (
        <div className="feed__notice" role="status">
          {notice}
        </div>
      )}

      <div className="feed__bar">
        <button className="feed__btn feed__btn--nope" onClick={() => handleSwipe('left')} type="button" aria-label="Dislike" title="Dislike (swipe left)" disabled={done}>
          <X size={16} strokeWidth={2.8} />
        </button>
        <button className="feed__btn feed__btn--share" onClick={() => handleSwipe('up')} type="button" aria-label="Share" title="Share (swipe up)" disabled={done}>
          <Share2 size={16} strokeWidth={2.4} />
        </button>
        <span className="feed__count" aria-live="polite">
          {done ? `${cards.length} / ${cards.length}` : `${currentIndex + 1} / ${cards.length}`}
        </span>
        <button className="feed__btn feed__btn--save" onClick={() => handleSwipe('down')} type="button" aria-label="Save to My Plate" title="Save to My Plate (swipe down)" disabled={done}>
          <Bookmark size={16} strokeWidth={2.4} />
        </button>
        <button className="feed__btn feed__btn--like" onClick={() => handleSwipe('right')} type="button" aria-label="Like" title="Like (swipe right)" disabled={done}>
          <Heart size={19} fill="currentColor" />
        </button>
      </div>

      {showHint && !done && (
        <p className="feed__hint" aria-hidden="true">
          <span><ArrowLeft size={13} /> Nope</span>
          <span><ArrowRight size={13} /> Like</span>
          <span><ArrowUp size={13} /> Share</span>
          <span><ArrowDown size={13} /> Save</span>
        </p>
      )}
    </div>
  );
}
