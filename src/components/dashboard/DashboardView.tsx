'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, MapPin, Star, PlayCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { CreateCardModal } from '@/components/create/CreateCardModal';
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

// The post-login landing page. Three rails, each backed by real data:
// recipes (aggregateForUser -> get_recommended_recipes RPC, or cuisine/diet
// overlap with onboarding prefs for a brand-new user), restaurants (browser
// geolocation -> PlacesService.searchNearby), and videos (YouTubeService,
// keyed to the user's top cuisine). See recommendationService.ts for how
// each rail decides what "matches your taste" means.
export default function DashboardView() {
  const { user } = useAuth();

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
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Nearby restaurants - waits for taste data (so matchesTaste is meaningful)
  // and browser geolocation consent.
  useEffect(() => {
    if (!tasteLoaded || typeof navigator === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const results = await getNearbyRestaurants(position.coords.latitude, position.coords.longitude, topCuisine);
        setRestaurants(results);
      },
      () => {
        setGeoDenied(true);
      },
    );
    // Deliberately runs once taste data is ready, not on every topCuisine change -
    // re-requesting geolocation on every render would be a bad prompt experience.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasteLoaded]);

  if (!user) {
    return (
      <div className="dashboard-view">
        <div className="dashboard-empty">Sign in to see your recommendations.</div>
      </div>
    );
  }

  return (
    <div className="dashboard-view">
      <div className="dashboard-greeting">
        <div className="dashboard-greeting__title">Your Dashboard</div>
        <div className="dashboard-greeting__sub">Recommendations tuned to your taste, wherever you are.</div>
      </div>

      {tasteLoaded && aggregate?.sampleSize === 0 && (
        <div className="dashboard-nudge">
          <div>
            <div className="dashboard-nudge__text">You haven&apos;t created any food cards yet.</div>
            <div className="dashboard-nudge__sub">Recipes below are based on your onboarding preferences — create a card to sharpen them.</div>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsCreateOpen(true)}>
            + Create a Card
          </button>
        </div>
      )}

      <section className="dashboard-section">
        <div className="dashboard-section__head">
          <span className="dashboard-section__title">Recommended Recipes</span>
          <span className="dashboard-section__sub">{aggregate?.sampleSize ? 'Matched to your flavor profile' : 'From your onboarding preferences'}</span>
        </div>
        {loadingRecipes ? (
          <div className="dashboard-empty">Loading recipes…</div>
        ) : recipes.length === 0 ? (
          <div className="dashboard-empty">No recipe matches yet.</div>
        ) : (
          <div className="dashboard-recipe-grid">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="dashboard-recipe-card">
                <div className="dashboard-recipe-card__image" style={{ backgroundImage: `url(${recipe.image})` }} />
                <div className="dashboard-recipe-card__body">
                  <div className="dashboard-recipe-card__title">{recipe.title}</div>
                  <div className="dashboard-recipe-card__meta">
                    <Clock size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
                    {recipe.readyInMinutes}m · {recipe.matchReason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section__head">
          <span className="dashboard-section__title">Restaurants Near You</span>
          <Link href="/scout" className="dashboard-section__sub">Open Scout →</Link>
        </div>
        {geoDenied ? (
          <div className="dashboard-empty">Enable location access to see restaurants near you.</div>
        ) : restaurants === null ? (
          <div className="dashboard-empty">Finding restaurants near you…</div>
        ) : restaurants.length === 0 ? (
          <div className="dashboard-empty">No nearby restaurants found.</div>
        ) : (
          <div className="dashboard-restaurant-list">
            {restaurants.slice(0, 6).map((place) => (
              <div key={place.placeId || place.name} className="dashboard-restaurant-row">
                <div>
                  <div className="dashboard-restaurant-row__name">{place.name}</div>
                  <div className="dashboard-restaurant-row__meta">
                    <MapPin size={11} style={{ verticalAlign: -1, marginRight: 3 }} />
                    {place.vicinity}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {place.matchesTaste && <span className="dashboard-restaurant-row__badge">Matches your taste</span>}
                  <div className="dashboard-restaurant-row__stats">
                    {place.rating != null && (
                      <div className="dashboard-restaurant-row__rating">
                        <Star size={12} fill="#f2a93b" style={{ color: '#f2a93b', verticalAlign: -1, marginRight: 2 }} />
                        {place.rating}
                      </div>
                    )}
                    {Number.isFinite(place.distanceMeters) && (
                      <div className="dashboard-restaurant-row__distance">{(place.distanceMeters / 1000).toFixed(1)} km</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section__head">
          <span className="dashboard-section__title">Watch &amp; Cook</span>
          <span className="dashboard-section__sub">{topCuisine ? `${topCuisine} on YouTube` : 'Trending recipes'}</span>
        </div>
        {loadingVideos ? (
          <div className="dashboard-empty">Loading videos…</div>
        ) : videos.length === 0 ? null : (
          <div className="dashboard-video-row">
            {videos.map((video) => (
              <a
                key={video.videoId}
                href={`https://www.youtube.com/watch?v=${video.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="dashboard-video-card"
              >
                {video.thumbnail ? (
                  <img src={video.thumbnail} alt="" className="dashboard-video-card__thumb" />
                ) : (
                  <div className="dashboard-video-card__thumb d-flex align-items-center justify-content-center">
                    <PlayCircle size={28} />
                  </div>
                )}
                <div className="dashboard-video-card__body">
                  <div className="dashboard-video-card__title">{video.title}</div>
                  <div className="dashboard-video-card__channel">{video.channelTitle}</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {isCreateOpen && <CreateCardModal onClose={() => setIsCreateOpen(false)} />}
    </div>
  );
}
