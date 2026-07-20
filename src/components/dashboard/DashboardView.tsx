'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Clock, MapPin, Star, Play, Compass, UtensilsCrossed, Film, Bot, Leaf, Plus, LocateFixed } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { CreateCardModal } from '@/components/create/CreateCardModal';
import { ScoutAddPinModal } from '@/components/scout/ScoutAddPinModal';
import { VideoPlayerModal } from '@/components/ui/VideoPlayerModal';
import { PointsService } from '@/lib/services/pointsService';
import { POINTS_PER_LEVEL } from '@/lib/rewards/progressionEngine';
import {
  aggregateForUser,
  getOnboardingPrefs,
  pickTopCuisine,
  getRecommendedRecipes,
  getNearbyRestaurants,
  getSuggestedVideos,
  type AggregateResult,
  type RecommendedRecipe,
  type NearbyRestaurant,
  type SuggestedVideo,
} from '@/lib/services/recommendationService';

// 8 real FUZO taxonomy categories (src/lib/data/fuzoTaxonomy.json's
// foodCategories.tags) with matching real icon assets copied from the
// source /SVG/food/ library - filters the recipe rail by a title keyword
// match, not a fabricated tag on data that doesn't carry one.
const CATEGORY_SHORTCUTS = [
  { label: 'Pizza', keyword: 'pizza', icon: '/SVG/food/PIZZA.svg' },
  { label: 'Burger', keyword: 'burger', icon: '/SVG/food/BURGER.svg' },
  { label: 'Sandwich', keyword: 'sandwich', icon: '/SVG/food/SANDWICH.svg' },
  { label: 'Curry', keyword: 'curry', icon: '/SVG/food/CURRY RICE.svg' },
  { label: 'Noodles', keyword: 'noodle', icon: '/SVG/food/NOODLE.svg' },
  { label: 'Salad', keyword: 'salad', icon: '/SVG/food/SALAD.svg' },
  { label: 'Soup', keyword: 'soup', icon: '/SVG/food/SOUP.svg' },
  { label: 'Sushi', keyword: 'sushi', icon: '/SVG/food/SUSHI.svg' },
];

const QUICK_NAV = [
  { href: '/scout', label: 'Scout', icon: Compass },
  { href: '/discover', label: 'Bites', icon: UtensilsCrossed },
  { href: '/trims', label: 'Trims', icon: Film },
  { href: '/rewards', label: 'Rewards', icon: Star },
  { href: '/ai-chef', label: 'AI Chef', icon: Bot },
];

const JUMP_SECTIONS = [
  { key: 'recipes', label: 'Recipes' },
  { key: 'restaurants', label: 'Restaurants' },
  { key: 'videos', label: 'Videos' },
] as const;
type JumpSection = (typeof JUMP_SECTIONS)[number]['key'];

const VEG_DIETS = new Set(['vegetarian', 'vegan']);

// The post-login landing page. Three rails, each backed by real data:
// recipes (aggregateForUser -> get_recommended_recipes RPC, or cuisine/diet
// overlap with onboarding prefs for a brand-new user), restaurants (browser
// geolocation -> PlacesService.searchNearby, now with real Places photos),
// and videos (YouTubeService, keyed to the user's top cuisine). See
// recommendationService.ts for how each rail decides what "matches your
// taste" means. Reskinned onto an image-forward, badge-on-scrim card
// language (reference: real food-delivery-app screenshots) - see
// _dashboard.scss for the full styling rationale.
export default function DashboardView() {
  const { user } = useAuth();
  const pathname = usePathname();

  const [aggregate, setAggregate] = useState<AggregateResult | null>(null);
  const [tasteLoaded, setTasteLoaded] = useState(false);
  const [topCuisine, setTopCuisine] = useState<string | undefined>(undefined);

  const [recipes, setRecipes] = useState<RecommendedRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);

  // null = not yet loaded (still requesting geolocation / fetching places).
  const [restaurants, setRestaurants] = useState<NearbyRestaurant[] | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);

  const [videos, setVideos] = useState<SuggestedVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<SuggestedVideo | null>(null);

  // Restaurant-pin prompt (Group 2 item 12) - null = not yet known.
  const [isBusinessProfile, setIsBusinessProfile] = useState<boolean | null>(null);
  const [hasPinnedRestaurant, setHasPinnedRestaurant] = useState<boolean | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const [rewardsStats, setRewardsStats] = useState<{ points: number; level: number } | null>(null);

  const [searchText, setSearchText] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<JumpSection>('recipes');

  const recipesRef = useRef<HTMLDivElement | null>(null);
  const restaurantsRef = useRef<HTMLDivElement | null>(null);
  const videosRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs: Record<JumpSection, RefObject<HTMLDivElement | null>> = {
    recipes: recipesRef,
    restaurants: restaurantsRef,
    videos: videosRef,
  };

  // Taste aggregate + recipes + videos - all keyed off the user's own data,
  // no location needed.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const [aggregateResult, prefs] = await Promise.all([aggregateForUser(user.id), getOnboardingPrefs(user.id)]);
      if (cancelled) return;
      setAggregate(aggregateResult);
      setTasteLoaded(true);
      setVegOnly(prefs.dietary.some((d) => VEG_DIETS.has(d.toLowerCase())));
      const cuisine = pickTopCuisine(aggregateResult, prefs.cuisines);
      setTopCuisine(cuisine);

      const recipeResults = await getRecommendedRecipes(user.id, aggregateResult, prefs);
      if (!cancelled) {
        setRecipes(recipeResults);
        setLoadingRecipes(false);
      }

      const videoResults = await getSuggestedVideos(cuisine);
      if (!cancelled) {
        setVideos(videoResults);
        setLoadingVideos(false);
      }

      const statsResult = await PointsService.getUserStats(user.id);
      if (!cancelled && statsResult.success && statsResult.data) {
        setRewardsStats({ points: statsResult.data.points, level: statsResult.data.level });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Restaurant-pin prompt: business-type profiles get nudged to pin their
  // own place via the existing Scout Restaurant-family Create Card flow -
  // every pin grows FUZO's own local-establishment dataset (the whole point
  // of prompting, not just allowing it). Gated on card_type, not just "any
  // food_cards exist," since a restaurant owner could have published a
  // recipe card first without ever pinning their own place.
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

  // Nearby restaurants - waits for taste data (so matchesTaste is meaningful)
  // and browser geolocation consent. Extracted so the empty-state's "Enable
  // Location" button can retry the same request on demand, not just the
  // one automatic attempt on load.
  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setGeoDenied(false);
        const results = await getNearbyRestaurants(position.coords.latitude, position.coords.longitude, topCuisine);
        setRestaurants(results);
      },
      () => {
        setGeoDenied(true);
      },
    );
  };

  useEffect(() => {
    if (!tasteLoaded) return;
    requestLocation();
    // Deliberately runs once taste data is ready, not on every topCuisine change -
    // re-requesting geolocation on every render would be a bad prompt experience.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasteLoaded]);

  const visibleRecipes = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    return recipes.filter((recipe) => {
      if (search && !recipe.title.toLowerCase().includes(search)) return false;
      if (activeCategory && !recipe.title.toLowerCase().includes(activeCategory)) return false;
      if (vegOnly && !recipe.diets.some((d) => VEG_DIETS.has(d.toLowerCase()))) return false;
      return true;
    });
  }, [recipes, searchText, activeCategory, vegOnly]);

  const pointsToNextLevel = rewardsStats ? POINTS_PER_LEVEL - (rewardsStats.points % POINTS_PER_LEVEL) : 0;

  const scrollToSection = (section: JumpSection) => {
    setActiveSection(section);
    sectionRefs[section].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!user) {
    return (
      <div className="dashboard-view">
        <div className="dashboard-empty">Sign in to see your recommendations.</div>
      </div>
    );
  }

  const displayName = (user.user_metadata?.display_name as string | undefined) || user.email?.split('@')[0] || 'there';

  return (
    <div className="dashboard-view">
      {/* Hero greeting band */}
      <div className="dashboard-hero">
        <div className="dashboard-hero__title">Hey, {displayName} 👋</div>
        <div className="dashboard-hero__sub">Recommendations tuned to your taste, wherever you are.</div>

        {isBusinessProfile && hasPinnedRestaurant === false ? (
          <div className="dashboard-hero__nudge">
            <div>
              <div className="dashboard-nudge__text">Your restaurant isn&apos;t pinned yet.</div>
              <div className="dashboard-nudge__sub">Pin your place so FUZO users can discover it on Scout — it only takes a minute.</div>
            </div>
            <button type="button" className="dashboard-nudge__cta" onClick={() => setIsPinModalOpen(true)}>
              <MapPin size={14} /> Pin My Restaurant
            </button>
          </div>
        ) : (
          tasteLoaded && aggregate?.sampleSize === 0 && (
            <div className="dashboard-hero__nudge">
              <div>
                <div className="dashboard-nudge__text">You haven&apos;t created any food cards yet.</div>
                <div className="dashboard-nudge__sub">Recipes below are based on your onboarding preferences — create a card to sharpen them.</div>
              </div>
              <button type="button" className="dashboard-nudge__cta" onClick={() => setIsCreateOpen(true)}>
                <Plus size={14} /> Create a Card
              </button>
            </div>
          )
        )}
      </div>

      {/* Quick-nav pills */}
      <div className="dashboard-quicknav">
        {QUICK_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`dashboard-quicknav__pill${pathname === href ? ' is-active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </div>

      {/* Search + veg toggle */}
      <div className="dashboard-search">
        <div className="dashboard-search__bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search your recommended recipes…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={`dashboard-veg-toggle${vegOnly ? ' is-active' : ''}`}
          onClick={() => setVegOnly((v) => !v)}
          aria-pressed={vegOnly}
        >
          <Leaf size={14} />
          Veg
        </button>
      </div>

      {/* Section-jump pills */}
      <div className="dashboard-jumpnav">
        {JUMP_SECTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={activeSection === key ? 'is-active' : undefined}
            onClick={() => scrollToSection(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Real rewards promo banner */}
      {rewardsStats && (
        <Link href="/rewards" className="dashboard-promo">
          <div>
            <div className="dashboard-promo__title">
              <span className="dashboard-promo__level">Level {rewardsStats.level}</span> · {pointsToNextLevel} pts to next level
            </div>
            <div className="dashboard-promo__sub">Publish and share cards to keep leveling up</div>
          </div>
          <span className="dashboard-promo__cta">View Rewards →</span>
        </Link>
      )}

      {/* Category shortcuts */}
      <div className="dashboard-categories">
        {CATEGORY_SHORTCUTS.map((cat) => (
          <button
            key={cat.keyword}
            type="button"
            className={`dashboard-categories__item${activeCategory === cat.keyword ? ' is-active' : ''}`}
            onClick={() => setActiveCategory((prev) => (prev === cat.keyword ? null : cat.keyword))}
          >
            <span className="dashboard-categories__icon">
              <img src={cat.icon} alt="" />
            </span>
            <span className="dashboard-categories__label">{cat.label}</span>
          </button>
        ))}
      </div>

      <section className="dashboard-section" ref={recipesRef}>
        <div className="dashboard-section__head">
          <span className="dashboard-section__title">Recommended Recipes</span>
          <span className="dashboard-section__sub">{aggregate?.sampleSize ? 'Matched to your flavor profile' : 'From your onboarding preferences'}</span>
        </div>
        {loadingRecipes ? (
          <div className="dashboard-empty">Loading recipes…</div>
        ) : visibleRecipes.length === 0 ? (
          <div className="dashboard-empty">No recipe matches yet.</div>
        ) : (
          <div className="dashboard-recipe-grid">
            {visibleRecipes.map((recipe) => (
              <div key={recipe.id} className="dashboard-card">
                <div className="dashboard-card__image" style={{ backgroundImage: `url(${recipe.image})` }}>
                  <span className="dashboard-card__badge dashboard-card__badge--scrim">
                    <Clock size={11} /> {recipe.readyInMinutes}m
                  </span>
                </div>
                <div className="dashboard-card__body">
                  <div className="dashboard-card__title">{recipe.title}</div>
                  <span className="dashboard-card__pick">{recipe.matchReason}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section" ref={restaurantsRef}>
        <div className="dashboard-section__head">
          <span className="dashboard-section__title">Restaurants Near You</span>
          <Link href="/scout" className="dashboard-section__sub">Open Scout →</Link>
        </div>
        {geoDenied ? (
          <div className="dashboard-empty dashboard-empty--location">
            <div className="dashboard-empty__icon">
              <MapPin size={20} />
            </div>
            <p className="mb-3">Enable location access to see restaurants near you.</p>
            <button type="button" className="dashboard-empty__cta" onClick={requestLocation}>
              <LocateFixed size={14} /> Enable Location
            </button>
          </div>
        ) : restaurants === null ? (
          <div className="dashboard-empty">Finding restaurants near you…</div>
        ) : restaurants.length === 0 ? (
          <div className="dashboard-empty">No nearby restaurants found.</div>
        ) : (
          <div className="dashboard-recipe-grid">
            {restaurants.slice(0, 6).map((place) => (
              <div key={place.placeId || place.name} className="dashboard-card">
                <div
                  className="dashboard-card__image"
                  style={place.image ? { backgroundImage: `url(${place.image})` } : undefined}
                >
                  {Number.isFinite(place.distanceMeters) && (
                    <span className="dashboard-card__badge dashboard-card__badge--scrim">
                      <MapPin size={11} /> {(place.distanceMeters / 1000).toFixed(1)} km
                    </span>
                  )}
                  {place.matchesTaste && <span className="dashboard-card__badge dashboard-card__badge--match">Matches your taste</span>}
                </div>
                <div className="dashboard-card__body">
                  <div className="dashboard-card__title">{place.name}</div>
                  <div className="dashboard-card__meta">
                    <span className="dashboard-card__meta-row">
                      {place.rating != null && (
                        <span className="dashboard-card__rating">
                          <Star size={11} fill="currentColor" /> {place.rating}
                        </span>
                      )}
                      <span className="dashboard-card__vicinity">{place.vicinity}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section" ref={videosRef}>
        <div className="dashboard-section__head">
          <span className="dashboard-section__title">Watch &amp; Cook</span>
          <span className="dashboard-section__sub">{topCuisine ? `${topCuisine} on YouTube` : 'Trending recipes'}</span>
        </div>
        {loadingVideos ? (
          <div className="dashboard-empty">Loading videos…</div>
        ) : videos.length === 0 ? null : (
          <div className="dashboard-video-grid">
            {videos.map((video) => (
              <button
                key={video.videoId}
                type="button"
                onClick={() => setActiveVideo(video)}
                className="dashboard-video-card"
              >
                <div className="dashboard-video-card__thumb">
                  {video.thumbnail && <img src={video.thumbnail} alt="" />}
                  <span className="dashboard-video-card__play">
                    <Play size={18} fill="currentColor" />
                  </span>
                </div>
                <div className="dashboard-video-card__body">
                  <div className="dashboard-video-card__title">{video.title}</div>
                  <div className="dashboard-video-card__channel">{video.channelTitle}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

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
    </div>
  );
}
