'use client';

import { Children, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Bell,
  ChartNoAxesColumn,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Compass,
  Film,
  Flame,
  LocateFixed,
  MapPin,
  MessageCircle,
  Play,
  Plus,
  Sparkles,
  Star,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { CreateCardModal } from '@/components/create/CreateCardModal';
import { ScoutAddPinModal } from '@/components/scout/ScoutAddPinModal';
import { VideoPlayerModal } from '@/components/ui/VideoPlayerModal';
import TakoAssistant from '@/components/tako/TakoAssistant';
import { NotificationsService } from '@/lib/services/notificationsService';
import { UserSettingsService, DEFAULT_USER_SETTINGS, type UserSettings } from '@/lib/services/userSettingsService';
import {
  aggregateForUser,
  getOnboardingPrefs,
  pickTopCuisine,
  getRecommendedRecipes,
  getNearbyRestaurants,
  getSuggestedVideos,
  type RecommendedRecipe,
  type NearbyRestaurant,
  type SuggestedVideo,
} from '@/lib/services/recommendationService';

// Dashboard = the post-login home, laid out from the client's sketch (same
// structure on phone and desktop):
//   top bar     profile photo | FUZO logo (opens Tako, the AI bot) | bell (notifications + messages)
//   segment     Bites | Feed | Trims  -> the matching /discover tab
//   rails       Recommended Restaurants, Near You, Your Taste (+ Watch & Cook)
//   bottom dock Explore (Scout) | raised + (create a card) | Rewards
// Data is unchanged from the previous dashboard - see recommendationService.ts
// for how each rail decides what "matches your taste" means. Styles: _dashboard.scss.
// The global SiteHeader and floating Tako button are hidden on this route
// because this page carries its own top bar and dock.

const SEGMENTS = [
  { tab: 'bites', label: 'Bites', icon: UtensilsCrossed },
  { tab: 'feed', label: 'Feed', icon: Flame },
  { tab: 'trims', label: 'Trims', icon: Film },
] as const;

const mapsUrl = (place: NearbyRestaurant) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}${place.placeId ? `&query_place_id=${encodeURIComponent(place.placeId)}` : ''}`;

const formatKm = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);

export default function DashboardView() {
  const { user } = useAuth();

  const [tasteLoaded, setTasteLoaded] = useState(false);
  const [topCuisine, setTopCuisine] = useState<string | undefined>(undefined);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [dnaLuxury, setDnaLuxury] = useState<number | undefined>(undefined);

  const [recipes, setRecipes] = useState<RecommendedRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);

  // null = not yet loaded (still requesting geolocation / fetching places).
  const [restaurants, setRestaurants] = useState<NearbyRestaurant[] | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);

  const [videos, setVideos] = useState<SuggestedVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTakoOpen, setIsTakoOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<SuggestedVideo | null>(null);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Restaurant-pin prompt for business profiles - null = not yet known.
  const [isBusinessProfile, setIsBusinessProfile] = useState<boolean | null>(null);
  const [hasPinnedRestaurant, setHasPinnedRestaurant] = useState<boolean | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Taste aggregate + recipes + videos - all keyed off the user's own data, no location needed.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const settingsResult = await UserSettingsService.get();
      const userSettings = settingsResult.success && settingsResult.data ? settingsResult.data : DEFAULT_USER_SETTINGS;
      if (cancelled) return;
      setSettings(userSettings);

      const supabase = createClient();
      if (supabase) {
        const { data: taste } = await supabase.from('taste_profiles').select('dna_scores').eq('user_id', user.id).maybeSingle();
        if (!cancelled && taste?.dna_scores) setDnaLuxury(taste.dna_scores.luxury);
      }

      const [aggregateResult, prefs] = await Promise.all([
        aggregateForUser(user.id, userSettings.useActivityForMl),
        getOnboardingPrefs(user.id),
      ]);
      if (cancelled) return;
      setTasteLoaded(true);
      const cuisine = pickTopCuisine(aggregateResult, prefs.cuisines);
      setTopCuisine(cuisine);

      const recipeResults = await getRecommendedRecipes(user.id, aggregateResult, prefs, 12);
      if (!cancelled) {
        setRecipes(recipeResults);
        setLoadingRecipes(false);
      }

      const videoResults = await getSuggestedVideos(cuisine);
      if (!cancelled) {
        setVideos(videoResults);
        setLoadingVideos(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Unread dot on the bell.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    NotificationsService.hasUnread(user.id).then((r) => {
      if (!cancelled) setHasUnread(r);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Business profiles get nudged to pin their own place (grows FUZO's local dataset).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const supabase = createClient();
    if (!supabase) return;

    (async () => {
      const { data: profileRow } = await supabase.from('users').select('profile_type').eq('id', user.id).maybeSingle();
      if (cancelled) return;
      const isBusiness = profileRow?.profile_type === 'business';
      setIsBusinessProfile(isBusiness);
      if (!isBusiness) {
        setHasPinnedRestaurant(true);
        return;
      }
      const { data: pinnedCard } = await supabase
        .from('food_cards')
        .select('id')
        .eq('user_id', user.id)
        .in('card_type', ['RESTAURANT_VISIT', 'CAFE_VISIT', 'STREET_FOOD'])
        .limit(1)
        .maybeSingle();
      if (!cancelled) setHasPinnedRestaurant(!!pinnedCard);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Nearby restaurants - waits for taste data (so matchesTaste is meaningful) and
  // geolocation consent. The location card's button retries it on demand.
  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setGeoDenied(false);
        const results = await getNearbyRestaurants(position.coords.latitude, position.coords.longitude, topCuisine, {
          radiusKm: settings.discoveryRadiusKm,
          hiddenGems: settings.showHiddenGems,
          luxury: dnaLuxury,
        });
        setRestaurants(results);
      },
      () => setGeoDenied(true),
    );
  };

  useEffect(() => {
    if (!tasteLoaded) return;
    requestLocation();
    // Runs once taste data is ready - re-prompting for location on every change would be hostile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasteLoaded]);

  // Same places, two lenses: best taste match first vs. closest first.
  const recommended = useMemo(
    () =>
      restaurants
        ? [...restaurants].sort(
            (a, b) => Number(b.matchesTaste) - Number(a.matchesTaste) || (b.rating ?? 0) - (a.rating ?? 0),
          )
        : null,
    [restaurants],
  );
  const nearest = useMemo(
    () => (restaurants ? [...restaurants].sort((a, b) => a.distanceMeters - b.distanceMeters) : null),
    [restaurants],
  );

  if (!user) {
    return (
      <div className="fz-dash">
        <div className="fz-dash__signin">Sign in to see your recommendations.</div>
      </div>
    );
  }

  const displayName = (user.user_metadata?.display_name as string | undefined) || user.email?.split('@')[0] || 'You';
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  const restaurantRail = (list: NearbyRestaurant[] | null, badge: 'match' | 'distance') => {
    if (geoDenied) {
      return (
        <div className="fz-dash-notice">
          <span className="fz-dash-notice__icon">
            <MapPin size={20} />
          </span>
          <span className="fz-dash-notice__text">
            <strong>Location is off</strong>
            <span>Turn it on to see great places around you.</span>
          </span>
          <button type="button" className="fz-dash-notice__btn" onClick={requestLocation}>
            <LocateFixed size={14} /> Enable
          </button>
        </div>
      );
    }
    if (list === null) return <SkeletonCards />;
    if (list.length === 0) return <div className="fz-dash-rail__empty">No restaurants found nearby yet.</div>;
    return list.slice(0, 10).map((place) => (
      <a
        key={place.placeId || place.name}
        className="fz-dash-card"
        href={mapsUrl(place)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {place.image ? <img className="fz-dash-card__img" src={place.image} alt="" loading="lazy" /> : <span className="fz-dash-card__img fz-dash-card__img--empty" />}
        <span className="fz-dash-card__shade" />
        {badge === 'match' && place.matchesTaste && (
          <span className="fz-dash-card__chip fz-dash-card__chip--gold">
            <Sparkles size={11} /> Your taste
          </span>
        )}
        {badge === 'distance' && Number.isFinite(place.distanceMeters) && (
          <span className="fz-dash-card__chip">
            <MapPin size={11} /> {formatKm(place.distanceMeters)}
          </span>
        )}
        <span className="fz-dash-card__body">
          <span className="fz-dash-card__title">{place.name}</span>
          <span className="fz-dash-card__meta">
            {place.rating != null && (
              <span className="fz-dash-card__rating">
                <Star size={11} fill="currentColor" /> {place.rating}
              </span>
            )}
            <span className="fz-dash-card__sub">{place.vicinity}</span>
          </span>
        </span>
      </a>
    ));
  };

  return (
    <div className="fz-dash">
      {/* ── Top bar: profile | FUZO (bot) | inbox ─────────────────────── */}
      <header className="fz-dash-top">
        <Link href="/profile" className="fz-dash-top__avatar" aria-label="Your profile">
          {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{displayName.charAt(0).toUpperCase()}</span>}
        </Link>

        {/* Tapping the logo opens Tako, the AI food assistant. */}
        <button type="button" className="fz-dash-top__logo" onClick={() => setIsTakoOpen(true)} aria-label="Ask Tako, your AI food assistant" title="Ask Tako">
          <img src="/fuzo_logo.svg" alt="FUZO" />
        </button>

        <div className="fz-dash-top__inbox">
          <button
            type="button"
            className="fz-dash-top__bell"
            aria-label="Notifications and messages"
            aria-expanded={inboxOpen}
            onClick={() => setInboxOpen((v) => !v)}
          >
            <Bell size={20} strokeWidth={2.2} />
            {hasUnread && <span className="fz-dash-top__dot" aria-hidden="true" />}
          </button>
          {inboxOpen && (
            <>
              <button type="button" className="fz-dash-top__scrim" aria-label="Close" onClick={() => setInboxOpen(false)} />
              <div className="fz-dash-top__menu" role="menu">
                <Link href="/notifications" className="fz-dash-top__menu-item" role="menuitem" onClick={() => setInboxOpen(false)}>
                  <span className="fz-dash-top__menu-icon"><Bell size={16} /></span>
                  Notifications
                  {hasUnread && <span className="fz-dash-top__menu-badge">New</span>}
                </Link>
                <Link href="/messages" className="fz-dash-top__menu-item" role="menuitem" onClick={() => setInboxOpen(false)}>
                  <span className="fz-dash-top__menu-icon"><MessageCircle size={16} /></span>
                  Messages
                </Link>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="fz-dash__body">
        {/* ── Bites | Feed | Trims ─────────────────────────────────────── */}
        <nav className="fz-dash-seg" aria-label="Discover">
          {SEGMENTS.map(({ tab, label, icon: Icon }) => (
            <Link key={tab} href={`/discover?tab=${tab}`} className="fz-dash-seg__item">
              <Icon size={16} strokeWidth={2.3} />
              {label}
            </Link>
          ))}
        </nav>

        {isBusinessProfile && hasPinnedRestaurant === false && (
          <div className="fz-dash-nudge">
            <div>
              <strong>Your restaurant isn&apos;t pinned yet.</strong>
              <span>Pin your place so FUZO users can find it on Scout.</span>
            </div>
            <button type="button" onClick={() => setIsPinModalOpen(true)}>
              <MapPin size={14} /> Pin it
            </button>
          </div>
        )}

        <Rail
          title="Recommended Restaurants"
          sub="Picked for your taste"
          link={{ href: '/scout', label: 'Scout' }}
          previews={recommended?.slice(0, 10).map((p) => p.image)}
        >
          {restaurantRail(recommended, 'match')}
        </Rail>

        <Rail title="Near You" sub="Closest first" link={{ href: '/scout', label: 'Map' }} previews={nearest?.slice(0, 10).map((p) => p.image)}>
          {restaurantRail(nearest, 'distance')}
        </Rail>

        <Rail
          title="Your Taste"
          sub={topCuisine ? `Because you love ${topCuisine}` : 'Recipes matched to your flavour profile'}
          previews={recipes.map((r) => r.image)}
        >
          {loadingRecipes ? (
            <SkeletonCards />
          ) : recipes.length === 0 ? (
            <div className="fz-dash-rail__empty">No recipe matches yet - create a card to teach FUZO your taste.</div>
          ) : (
            recipes.map((recipe) => (
              <div key={recipe.id} className="fz-dash-card">
                <img className="fz-dash-card__img" src={recipe.image} alt="" loading="lazy" />
                <span className="fz-dash-card__shade" />
                <span className="fz-dash-card__chip">
                  <Clock size={11} /> {recipe.readyInMinutes}m
                </span>
                <span className="fz-dash-card__body">
                  <span className="fz-dash-card__title">{recipe.title}</span>
                  <span className="fz-dash-card__sub fz-dash-card__sub--gold">{recipe.matchReason}</span>
                </span>
              </div>
            ))
          )}
        </Rail>

        {(loadingVideos || videos.length > 0) && (
          <Rail title="Watch & Cook" sub={topCuisine ? `${topCuisine} on YouTube` : 'Trending recipes'} wide previews={videos.map((v) => v.thumbnail)}>
            {loadingVideos ? (
              <SkeletonCards wide />
            ) : (
              videos.map((video) => (
                <button key={video.videoId} type="button" className="fz-dash-card fz-dash-card--wide" onClick={() => setActiveVideo(video)}>
                  {video.thumbnail && <img className="fz-dash-card__img" src={video.thumbnail} alt="" loading="lazy" />}
                  <span className="fz-dash-card__shade" />
                  <span className="fz-dash-card__play">
                    <Play size={18} fill="currentColor" />
                  </span>
                  <span className="fz-dash-card__body">
                    <span className="fz-dash-card__title">{video.title}</span>
                    <span className="fz-dash-card__sub">{video.channelTitle}</span>
                  </span>
                </button>
              ))
            )}
          </Rail>
        )}
      </main>

      {/* ── Bottom dock: Explore | + | Rewards ───────────────────────── */}
      <nav className="fz-dash-dock" aria-label="Quick actions">
        <Link href="/scout" className="fz-dash-dock__item">
          <Compass size={22} strokeWidth={2.1} />
          <span>Explore</span>
        </Link>
        <button type="button" className="fz-dash-dock__create" onClick={() => setIsCreateOpen(true)} aria-label="Create a food card">
          <Plus size={28} strokeWidth={2.6} />
        </button>
        <Link href="/rewards" className="fz-dash-dock__item">
          <ChartNoAxesColumn size={22} strokeWidth={2.4} />
          <span>Rewards</span>
        </Link>
      </nav>

      {isCreateOpen && <CreateCardModal onClose={() => setIsCreateOpen(false)} />}
      <TakoAssistant variant="overlay" isOpen={isTakoOpen} onClose={() => setIsTakoOpen(false)} />
      {isPinModalOpen && (
        <ScoutAddPinModal
          cardType="RESTAURANT_VISIT"
          onClose={() => setIsPinModalOpen(false)}
          onSuccess={() => setHasPinnedRestaurant(true)}
        />
      )}
      {activeVideo && (
        <VideoPlayerModal
          title={activeVideo.title}
          mediaUrl={`https://www.youtube.com/watch?v=${activeVideo.videoId}`}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </div>
  );
}

// A titled row of cards. Shows the first PREVIEW_COUNT cards, then a "See all"
// card (a fanned stack of the next photos + a count) that expands the section
// into a grid in place - no long sideways scroll. Arrow buttons appear on
// devices with a mouse while it's a row.
const PREVIEW_COUNT = 4;

function Rail({
  title,
  sub,
  link,
  wide = false,
  previews = [],
  children,
}: {
  title: string;
  sub?: string;
  link?: { href: string; label: string };
  wide?: boolean;
  /** Image URL per card, in the same order as the cards - used for the "See all" stack. */
  previews?: (string | undefined)[];
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const items = Children.toArray(children);
  const hidden = items.length - PREVIEW_COUNT;
  const collapsible = hidden > 0;
  const showGrid = collapsible && expanded;

  // Stack = the next photos after the visible cards (falling back to the first ones).
  const pool = previews.filter((u): u is string => !!u);
  const stack = (pool.slice(PREVIEW_COUNT, PREVIEW_COUNT + 3).length === 3 ? pool.slice(PREVIEW_COUNT, PREVIEW_COUNT + 3) : pool.slice(0, 3));

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const collapse = () => {
    setExpanded(false);
    trackRef.current?.closest('.fz-dash-rail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className={`fz-dash-rail${showGrid ? ' is-expanded' : ''}`}>
      <div className="fz-dash-rail__head">
        <div className="fz-dash-rail__heading">
          <h2 className="fz-dash-rail__title">{title}</h2>
          {sub && <p className="fz-dash-rail__sub">{sub}</p>}
        </div>
        <div className="fz-dash-rail__actions">
          {showGrid ? (
            <button type="button" className="fz-dash-rail__less" onClick={collapse}>
              Show less <ChevronUp size={14} />
            </button>
          ) : (
            <>
              {link && (
                <Link href={link.href} className="fz-dash-rail__link">
                  {link.label} <ChevronRight size={14} />
                </Link>
              )}
              <button type="button" className="fz-dash-rail__arrow" onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`}>
                <ChevronLeft size={16} />
              </button>
              <button type="button" className="fz-dash-rail__arrow" onClick={() => scroll(1)} aria-label={`Scroll ${title} right`}>
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      <div
        className={`fz-dash-rail__track${wide ? ' fz-dash-rail__track--wide' : ''}${showGrid ? ' fz-dash-rail__track--grid' : ''}`}
        ref={trackRef}
      >
        {showGrid || !collapsible ? items : items.slice(0, PREVIEW_COUNT)}
        {collapsible && !expanded && (
          <button
            type="button"
            className={`fz-dash-seeall${wide ? ' fz-dash-seeall--wide' : ''}`}
            onClick={() => setExpanded(true)}
            aria-label={`See all ${items.length} in ${title}`}
          >
            <span className="fz-dash-seeall__stack" aria-hidden="true">
              {stack.map((src, i) => (
                <img key={i} src={src} alt="" loading="lazy" className={`fz-dash-seeall__photo fz-dash-seeall__photo--${i + 1}`} />
              ))}
              {stack.length === 0 && <span className="fz-dash-seeall__photo fz-dash-seeall__photo--2 fz-dash-seeall__photo--blank" />}
            </span>
            <span className="fz-dash-seeall__label">See all</span>
            <span className="fz-dash-seeall__count">+{hidden} more</span>
          </button>
        )}
      </div>
    </section>
  );
}

function SkeletonCards({ wide = false }: { wide?: boolean }) {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`fz-dash-card fz-dash-card--skeleton${wide ? ' fz-dash-card--wide' : ''}`} aria-hidden="true" />
      ))}
    </>
  );
}
