'use client';

import { postSharePayload } from '@/lib/share/postShare';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
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
import { familyOf, type FoodCardFamily } from '@/lib/types/foodCard';
import { UserSettingsService, DEFAULT_USER_SETTINGS } from '@/lib/services/userSettingsService';
import { createClient } from '@/lib/supabase/client';
import FeedDeck, { type SwipeDir } from './FeedDeck';

// The Feed tab: real food_cards ranked by getFeedCards(), in a Tinder-style
// swipe stack (FeedDeck). Curated recipes are Bites' job, not Feed's.
// Swipe directions (client, 2026-10-06): left = dislike, right = like,
// up = share, down = save to My Plate.
const HINT_KEY = 'fz-feed-swipe-hint-seen';

const FAMILY_TO_PLATE_TYPE: Record<FoodCardFamily, PlateItemType> = {
  recipe: 'recipe',
  restaurant: 'restaurant',
  video: 'video',
  discovery: 'photo',
};

export default function FoodCardFeed() {
  const { user } = useAuth();
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Share (swipe up) asks where: FUZO friends/groups or other apps (ShareSheet).
  const [sharing, setSharing] = useState<SharePayload | null>(null);
  function shareCard(feedCard: FeedCard) {
    const { card, author } = feedCard;
    // The link opens the post itself (/post/<id>; sign-up first for new people).
    setSharing(postSharePayload(card, author.displayName));
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

  function onSwipe(direction: SwipeDir, feedCard: FeedCard) {
    hideHint();
    if (direction === 'right') like(feedCard);
    else if (direction === 'down') saveToPlate(feedCard);
    else if (direction === 'up') shareCard(feedCard);
    else {
      // Dislike feeds the Flavor DNA / Food DNA behaviour signals (src/lib/profile/kpi).
      ActivityEventService.track({ type: 'card_skipped', entityType: 'food_card', entityId: feedCard.card.id, metadata: { action: 'dislike' } });
    }
    ActivityEventService.track({ type: 'card_viewed', entityType: 'food_card', entityId: feedCard.card.id });
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
          <span className="feed__btn feed__btn--share feed__btn--ghost" />
          <span className="feed__count">&nbsp;</span>
          <span className="feed__btn feed__btn--save feed__btn--ghost" />
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

  return (
    <>
      <FeedDeck
        cards={cards}
        onSwipe={onSwipe}
        notice={
          notice && (
            <div className="feed__notice" role="status">
              {notice}
            </div>
          )
        }
        footer={
          showHint && (
            <p className="feed__hint" aria-hidden="true">
              <span><ArrowLeft size={13} /> Nope</span>
              <span><ArrowRight size={13} /> Like</span>
              <span><ArrowUp size={13} /> Share</span>
              <span><ArrowDown size={13} /> Save</span>
            </p>
          )
        }
      />
      <ShareSheet payload={sharing} onClose={() => setSharing(null)} />
    </>
  );
}
