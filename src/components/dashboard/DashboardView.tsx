'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ChartNoAxesColumn,
  Clock,
  Compass,
  Film,
  Flame,
  Home,
  LocateFixed,
  MapPin,
  Play,
  Plus,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { CreateCardModal } from '@/components/create/CreateCardModal';
import { ScoutAddPinModal } from '@/components/scout/ScoutAddPinModal';
import { VideoPlayerModal } from '@/components/ui/VideoPlayerModal';
import { RecipeDetailModal, useRecipeSaves } from '@/components/bites/RecipeDetailModal';
import { fetchCuratedRecipes, type CuratedRecipe } from '@/lib/recipes/curatedRecipes';
import { UserSettingsService, DEFAULT_USER_SETTINGS, type UserSettings } from '@/lib/services/userSettingsService';
import {
  aggregateForUser,
  getOnboardingPrefs,
  pickTopCuisine,
  getRecommendedRecipes,
  getSuggestedVideos,
  type RecommendedRecipe,
  type SuggestedVideo,
} from '@/lib/services/recommendationService';
import HomeTabs, { type HomeTab } from './HomeTabs';
import { Rail, SkeletonCards } from './Rail';
import DashPlaceCard from './DashPlaceCard';
import { useNearbyPlaces, type DashPlace } from './useNearbyPlaces';
import { NearbyCities } from './NearbyCities';

// Dashboard = the post-login home, laid out from the client's sketch (same
// structure on phone and desktop):
//   top bar     the app-wide SiteHeader: profile photo | FUZO logo (Tako) | bell + menu
//   tabs        For you · Bites · Feed · Trims - switch in place (no navigation), URL ?tab= kept in sync
//   For you     Recommended Restaurants, Near You (Google + FUZO restaurants), Your Taste, Watch & Cook
//   bottom dock Explore (Scout) | raised + (create a card) | Rewards
// Styles: _dashboard.scss (top bar: _header.scss).

type TabKey = 'foryou' | 'bites' | 'feed' | 'trims';
const TABS: HomeTab<TabKey>[] = [
  { key: 'foryou', label: 'For you', icon: Home },
  { key: 'bites', label: 'Bites', icon: UtensilsCrossed },
  { key: 'feed', label: 'Feed', icon: Flame },
  { key: 'trims', label: 'Trims', icon: Film },
];
const isTab = (v: string | null): v is TabKey => TABS.some((t) => t.key === v);

// Each section's code only loads the first time its tab is opened.
function PanelLoading({ label }: { label: string }) {
  return (
    <div className="fz-dash-panel__loading" role="status">
      <span className="spinner-border spinner-border-sm text-warning" aria-hidden="true" /> Loading {label}…
    </div>
  );
}
const BitesView = dynamic(() => import('@/components/bites/BitesView').then((m) => m.BitesView), { loading: () => <PanelLoading label="Bites" /> });
const FoodCardFeed = dynamic(() => import('@/components/discover/FoodCardFeed'), { loading: () => <PanelLoading label="Feed" /> });
const TrimsReel = dynamic(() => import('@/components/trims/TrimsReel'), { ssr: false, loading: () => <PanelLoading label="Trims" /> });

export default function DashboardView() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const active: TabKey = isTab(tabParam) ? tabParam : 'foryou';
  const tabsAnchorRef = useRef<HTMLDivElement>(null);

  // Keep Bites/Feed mounted once opened, so switching back is instant and keeps
  // their scroll/filter state. (Trims unmounts when you leave so videos stop.)
  const [visited, setVisited] = useState<Set<TabKey>>(() => new Set([active]));
  if (!visited.has(active)) setVisited(new Set(visited).add(active));

  const selectTab = (key: TabKey) => {
    if (key === active) return;
    window.history.pushState(null, '', key === 'foryou' ? window.location.pathname : `?tab=${key}`);
    // If the tab bar has scrolled under the top bar, bring the new section into view from its start.
    const anchor = tabsAnchorRef.current;
    if (anchor && anchor.getBoundingClientRect().top < 0) {
      window.scrollTo({ top: window.scrollY + anchor.getBoundingClientRect().top - 60, behavior: 'smooth' });
    }
  };

  const [tasteLoaded, setTasteLoaded] = useState(false);
  const [topCuisine, setTopCuisine] = useState<string | undefined>(undefined);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [dnaLuxury, setDnaLuxury] = useState<number | undefined>(undefined);

  const [recipes, setRecipes] = useState<RecommendedRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [curatedById, setCuratedById] = useState<Map<number, CuratedRecipe>>(() => new Map());
  const [openRecipe, setOpenRecipe] = useState<CuratedRecipe | null>(null);
  const { saved: savedRecipes, toggleSave: toggleRecipeSave } = useRecipeSaves();

  const [videos, setVideos] = useState<SuggestedVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<SuggestedVideo | null>(null);

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

      const [recipeResults, curated] = await Promise.all([getRecommendedRecipes(user.id, aggregateResult, prefs, 12), fetchCuratedRecipes()]);
      if (!cancelled) {
        setRecipes(recipeResults);
        // Full recipes (ingredients/steps/nutrition) for the cards' detail view.
        setCuratedById(new Map(curated.map((r) => [r.id, r])));
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

  // Restaurants (Google + FUZO) near the user's GPS location or saved home area.
  const { loc, recommended, nearest, retryGps } = useNearbyPlaces({
    enabled: tasteLoaded,
    topCuisine,
    radiusKm: settings.discoveryRadiusKm,
    hiddenGems: settings.showHiddenGems,
    luxury: dnaLuxury,
  });

  const placePreviews = (list: DashPlace[] | null) => list?.slice(0, 10).map((p) => p.image);
  const usingHome = loc.status === 'ready' && loc.source === 'home';
  const restaurantSub = (base: string) => (usingHome ? `${base} · near your home area` : base);

  const restaurantRail = (list: DashPlace[] | null, lens: 'match' | 'distance') => {
      if (loc.status === 'unavailable') {
        return (
          <div className="fz-dash-notice">
            <span className="fz-dash-notice__icon">
              <MapPin size={20} />
            </span>
            <span className="fz-dash-notice__text">
              <strong>We don&apos;t know where you are yet</strong>
              <span>Turn on location, or set your home area so we can show places near you.</span>
            </span>
            <span className="fz-dash-notice__actions">
              <button type="button" className="fz-dash-notice__btn" onClick={retryGps}>
                <LocateFixed size={14} /> Use my location
              </button>
              <Link href="/profile?tab=settings" className="fz-dash-notice__link">
                Set home area
              </Link>
            </span>
          </div>
        );
      }
      if (list === null) return <SkeletonCards />;
      if (list.length === 0) return <div className="fz-dash-rail__empty">No restaurants found nearby yet - try a bigger discovery radius in Settings.</div>;
      return list.slice(0, 10).map((place) => <DashPlaceCard key={place.key} place={place} lens={lens} />);
  };

  if (!user) {
    return (
      <div className="fz-dash">
        <div className="fz-dash__signin">Sign in to see your recommendations.</div>
      </div>
    );
  }

  const useMyLocation = usingHome ? (
    <button type="button" className="fz-dash-rail__locate" onClick={retryGps}>
      <LocateFixed size={13} /> Use my location
    </button>
  ) : null;

  return (
    <div className="fz-dash">
      {/* The top bar is the app-wide SiteHeader (same on every page). */}
      <main className="fz-dash__body">
        {/* ── For you · Bites · Feed · Trims (switch in place) ─────────── */}
        <div ref={tabsAnchorRef} className="fz-dash-tabs-wrap">
          <HomeTabs tabs={TABS} active={active} onChange={selectTab} />
        </div>

        {/* For you */}
        <div role="tabpanel" id="home-panel-foryou" aria-labelledby="home-tab-foryou" hidden={active !== 'foryou'} className="fz-dash-panel">
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

          <NearbyCities loc={loc} />

          <Rail
            title="Recommended Restaurants"
            sub={restaurantSub('On FUZO & picked for your taste')}
            link={{ href: '/scout', label: 'Scout' }}
            previews={placePreviews(recommended)}
            extraAction={useMyLocation}
          >
            {restaurantRail(recommended, 'match')}
          </Rail>

          <Rail title="Near You" sub={restaurantSub('Closest first')} link={{ href: '/scout', label: 'Map' }} previews={placePreviews(nearest)}>
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
              recipes.map((recipe) => {
                const full = curatedById.get(recipe.id);
                const inner = (
                  <>
                    <img className="fz-dash-card__img" src={recipe.image} alt="" loading="lazy" />
                    <span className="fz-dash-card__shade" />
                    <span className="fz-dash-card__chip">
                      <Clock size={11} /> {recipe.readyInMinutes}m
                    </span>
                    <span className="fz-dash-card__body">
                      <span className="fz-dash-card__title">{recipe.title}</span>
                      <span className="fz-dash-card__sub fz-dash-card__sub--gold">{recipe.matchReason}</span>
                    </span>
                  </>
                );
                // Opens the full recipe (ingredients, steps, nutrition, save) when we have it.
                return full ? (
                  <button key={recipe.id} type="button" className="fz-dash-card" onClick={() => setOpenRecipe(full)} aria-label={`Open recipe: ${recipe.title}`}>
                    {inner}
                  </button>
                ) : (
                  <div key={recipe.id} className="fz-dash-card fz-dash-card--static">
                    {inner}
                  </div>
                );
              })
            )}
          </Rail>

          {(loadingVideos || videos.length > 0) && (
            <Rail title="Watch & Cook" sub={topCuisine ? `${topCuisine} on YouTube` : 'Trending recipes'} wide previews={videos.map((v) => v.thumbnail)}>
              {loadingVideos ? (
                <SkeletonCards wide />
              ) : (
                videos.map((video) => (
                  <button key={video.videoId} type="button" className="fz-dash-card fz-dash-card--wide" onClick={() => setActiveVideo(video)} aria-label={`Play: ${video.title}`}>
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
        </div>

        {/* Bites / Feed stay mounted once opened; Trims only while active. */}
        {visited.has('bites') && (
          <div role="tabpanel" id="home-panel-bites" aria-labelledby="home-tab-bites" hidden={active !== 'bites'} className="fz-dash-panel fz-dash-panel--bites">
            <BitesView />
          </div>
        )}
        {visited.has('feed') && (
          <div role="tabpanel" id="home-panel-feed" aria-labelledby="home-tab-feed" hidden={active !== 'feed'} className="fz-dash-panel fz-dash-panel--feed">
            <FoodCardFeed />
          </div>
        )}
        {active === 'trims' && (
          <div role="tabpanel" id="home-panel-trims" aria-labelledby="home-tab-trims" className="fz-dash-panel fz-dash-panel--trims">
            <div className="fz-dash-reel">
              <TrimsReel />
            </div>
          </div>
        )}
      </main>

      {/* ── Bottom dock: Explore | + | Rewards ───────────────────────── */}
      <nav className="fz-dash-dock" aria-label="Quick actions">
        <Link href="/scout" className="fz-dash-dock__item">
          <Compass size={18} strokeWidth={2.1} />
          <span>Explore</span>
        </Link>
        <button type="button" className="fz-dash-dock__create" onClick={() => setIsCreateOpen(true)} aria-label="Create a food card">
          <Plus size={22} strokeWidth={2.6} />
        </button>
        <Link href="/rewards" className="fz-dash-dock__item">
          <ChartNoAxesColumn size={18} strokeWidth={2.4} />
          <span>Rewards</span>
        </Link>
      </nav>

      {isCreateOpen && <CreateCardModal onClose={() => setIsCreateOpen(false)} />}
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
      {openRecipe && (
        <RecipeDetailModal
          recipe={openRecipe}
          initialTab="ingredients"
          saved={savedRecipes.has(openRecipe.id)}
          onToggleSave={() => toggleRecipeSave(openRecipe)}
          onClose={() => setOpenRecipe(null)}
        />
      )}
    </div>
  );
}
