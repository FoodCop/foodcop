/**
 * RECOMMENDATION SERVICE
 * Backs the /dashboard rails: recommended recipes, nearby restaurants, and
 * suggested videos, all driven off the user's aggregated flavor/cuisine data.
 *
 * aggregateForUser() is the piece the earlier Food Card Creation plan
 * explicitly deferred. It computes a recency-weighted FlavorVector from the
 * user's own food_cards (same half-life-decay idea as the original
 * recommendation-engine doc, minus the "likes" half - there's no
 * food_card_likes table) and writes it to profiles.food_dna, which makes the
 * existing (already-built, never-fed) public.get_recommended_recipes RPC
 * real for the first time instead of duplicating its matching logic here.
 *
 * Cold start (a user with zero food_cards) falls back to their onboarding
 * taste_profiles.cuisines/dietary for a cuisine/diet tag-overlap ranking -
 * the only real signal available before they've created anything.
 */

import { createClient } from '@/lib/supabase/client';
import { fetchCuratedRecipes } from '@/lib/recipes/curatedRecipes';
import { PlacesService } from '@/lib/services/placesService';
import { YouTubeService } from '@/lib/services/youtubeService';
import { getDistance } from '@/lib/scout/geometryUtils';
import { buildPlacePhotoUrl } from '@/lib/scout/scoutLogic';
import { FLAVOR_AXES, ZERO_FLAVOR, type CardTags, type FlavorVector, type FoodCardRecord } from '@/lib/types/foodCard';
import type { MatchSensitivity } from '@/lib/services/userSettingsService';
import type { DnaAxis } from '@/lib/recommendation/dna';

// Diet tags treated as "health-conscious" for the Food DNA quiz's Health
// axis bias below - deliberately excludes Halal/Kosher/Jain, which are
// about religious/cultural practice, not health.
const HEALTH_DIET_TAGS = new Set(['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free']);
const HIGH_PRICE_LEVELS = new Set(['$$$', '$$$$']);
const LOW_PRICE_LEVELS = new Set(['$', '$$']);
const DNA_AXIS_THRESHOLD = 65;

export interface AggregateResult {
  vector: FlavorVector;
  cuisineCounts: Record<string, number>;
  dietCounts: Record<string, number>;
  sampleSize: number;
}

export interface RecommendedRecipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  matchReason: string;
  diets: string[];
}

export interface NearbyRestaurant {
  placeId: string;
  name: string;
  vicinity: string;
  rating?: number;
  reviews?: number;
  priceLevel?: number;
  distanceMeters: number;
  matchesTaste: boolean;
  image?: string;
}

export interface SuggestedVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

const HALF_LIFE_DAYS = 90;

// Shared by aggregateForUser() (weighting the viewer's own cards) and
// getFeedCards() (a small recency bonus on candidate cards) - same half-life
// idea, one implementation.
function decay(at: string): number {
  return Math.pow(0.5, (Date.now() - new Date(at).getTime()) / (HALF_LIFE_DAYS * 86400000));
}

function topEntry(counts: Record<string, number>): string | undefined {
  const entries = Object.entries(counts);
  if (!entries.length) return undefined;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Recomputes the user's flavor vector + cuisine/diet frequency from their own
 * food_cards (all statuses - this personalizes their own dashboard, not a
 * public-facing aggregate) and writes the vector to profiles.food_dna.
 */
// useActivityForMl gates this at the caller's discretion (Settings' "Use
// Activity for ML" toggle) - when a user opts out, their own authored-card
// history stops personalizing recommendations for themselves; existing
// profiles.food_dna is left untouched rather than overwritten with zeros.
export async function aggregateForUser(userId: string, useActivityForMl = true): Promise<AggregateResult> {
  const empty: AggregateResult = { vector: ZERO_FLAVOR, cuisineCounts: {}, dietCounts: {}, sampleSize: 0 };
  if (!useActivityForMl) return empty;
  const supabase = createClient();
  if (!supabase) return empty;

  const { data, error } = await supabase
    .from('food_cards')
    .select('flavor_profile, tags, created_at')
    .eq('user_id', userId);

  if (error || !data?.length) return empty;

  const sum = { ...ZERO_FLAVOR };
  let totalWeight = 0;
  const cuisineCounts: Record<string, number> = {};
  const dietCounts: Record<string, number> = {};

  for (const row of data) {
    const weight = decay(row.created_at);
    const vector = (row.flavor_profile || {}) as Partial<FlavorVector>;
    for (const axis of FLAVOR_AXES) sum[axis] += (vector[axis] || 0) * weight;
    totalWeight += weight;

    const tags = (row.tags || {}) as Partial<CardTags>;
    for (const cuisine of tags.cuisine || []) cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
    for (const diet of tags.diet || []) dietCounts[diet] = (dietCounts[diet] || 0) + 1;
  }

  const vector = { ...ZERO_FLAVOR };
  for (const axis of FLAVOR_AXES) vector[axis] = totalWeight ? Number((sum[axis] / totalWeight).toFixed(2)) : 0;

  await supabase.from('profiles').upsert({ id: userId, food_dna: vector }, { onConflict: 'id' });

  return { vector, cuisineCounts, dietCounts, sampleSize: data.length };
}

/** Onboarding-declared cuisines/dietary - the only real signal for a cold-start user. */
export async function getOnboardingPrefs(userId: string): Promise<{ cuisines: string[]; dietary: string[] }> {
  const supabase = createClient();
  if (!supabase) return { cuisines: [], dietary: [] };

  const { data } = await supabase.from('taste_profiles').select('cuisines, dietary').eq('user_id', userId).maybeSingle();
  return {
    cuisines: data?.cuisines || [],
    dietary: (data?.dietary || []).filter((d: string) => d !== 'No Restrictions'),
  };
}

export function pickTopCuisine(aggregate: AggregateResult, onboardingCuisines: string[]): string | undefined {
  return topEntry(aggregate.cuisineCounts) || onboardingCuisines[0];
}

interface RecommendedRecipeRow {
  recipe_id: number;
  title: string;
  image: string;
  ready_in_minutes: number;
  diets: string[] | null;
}

export async function getRecommendedRecipes(
  userId: string,
  aggregate: AggregateResult,
  onboardingPrefs: { cuisines: string[]; dietary: string[] },
  limit = 8,
): Promise<RecommendedRecipe[]> {
  const supabase = createClient();
  if (!supabase) return [];

  if (aggregate.sampleSize > 0) {
    const { data, error } = await supabase.rpc('get_recommended_recipes', { p_user_id: userId, p_limit: limit });
    if (!error && data?.length) {
      return (data as RecommendedRecipeRow[]).map((r) => ({
        id: r.recipe_id,
        title: r.title,
        image: r.image,
        readyInMinutes: r.ready_in_minutes,
        matchReason: 'Matches your flavor profile',
        diets: r.diets || [],
      }));
    }
  }

  // Cold start: no food_cards yet - rank the curated set by cuisine/diet overlap
  // with what they told us at onboarding, instead of a fake flavor match.
  const prefCuisines = new Set(onboardingPrefs.cuisines.map((c) => c.toLowerCase()));
  const prefDiets = new Set(onboardingPrefs.dietary.map((d) => d.toLowerCase()));
  const hasPrefs = prefCuisines.size > 0 || prefDiets.size > 0;

  const recipes = await fetchCuratedRecipes();
  const scored = recipes.map((recipe) => {
    const cuisineHits = recipe.cuisines.filter((c) => prefCuisines.has(c.toLowerCase())).length;
    const dietHits = recipe.diets.filter((d) => prefDiets.has(d.toLowerCase())).length;
    return { recipe, score: cuisineHits * 2 + dietHits };
  });

  const ranked = hasPrefs
    ? scored.sort((a, b) => b.score - a.score)
    : scored.sort(() => Math.random() - 0.5); // no declared prefs at all - avoid always showing the same first N

  return ranked.slice(0, limit).map(({ recipe, score }) => ({
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    readyInMinutes: recipe.readyInMinutes,
    matchReason: score > 0 ? 'Matches your onboarding preferences' : 'Popular pick',
    diets: recipe.diets || [],
  }));
}

export interface FeedCardAuthor {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  isMasterBot: boolean;
}

export interface FeedCard {
  card: FoodCardRecord;
  author: FeedCardAuthor;
  matchReason: string;
}

const FEED_CANDIDATE_LIMIT = 100;

function euclideanDistance(a: FlavorVector, b: Partial<FlavorVector>): number {
  let sum = 0;
  for (const axis of FLAVOR_AXES) {
    const diff = a[axis] - (b[axis] || 0);
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Discover Feed's ranking: surfaces other users' PUBLISHED food_cards, scored
 * against the viewer's own aggregate (aggregateForUser) and onboarding prefs
 * (getOnboardingPrefs) - the same two inputs get_recommended_recipes already
 * uses for the /dashboard "warm"/"cold" split, reused here rather than
 * recomputed. No SQL RPC: 100 candidate rows is cheap enough to score in JS,
 * same shape as getRecommendedRecipes' own cold-start ranking below.
 *
 * Score, per card:
 *  - +100 per viewer onboarding cuisine present in the card's tags.cuisine
 *  - -300 soft penalty if the viewer is Vegan/Vegetarian and the card's
 *    tags.diet doesn't carry that same value (there's no strict allergy
 *    field anywhere in taste_profiles, confirmed against its migration - this
 *    is a ranking nudge, not a safety guarantee)
 *  - a flavor-distance bonus, only once the viewer has a real aggregate
 *    (sampleSize > 0) - max(0, 60 - distance*6) across the 10 FLAVOR_AXES
 *  - a small recency bonus (same decay() half-life used by aggregateForUser)
 *  - +random jitter (0-10) so ordering isn't perfectly static across reloads
 *
 * The viewer's own cards are excluded at the query level, not score-penalized.
 */
export async function getFeedCards(
  userId: string,
  aggregate: AggregateResult,
  onboardingPrefs: { cuisines: string[]; dietary: string[] },
  limit = 30,
  matchSensitivity: MatchSensitivity = 'Balanced',
  prioritizeTrending = false,
  dnaScores?: Record<DnaAxis, number> | null,
): Promise<FeedCard[]> {
  const supabase = createClient();
  if (!supabase) return [];

  // image_url IS NOT NULL: a swipeable photo-card feed needs a real photo to
  // mean anything - excludes the older, imageless food_cards from
  // scripts/seed_masterbots.ts's first pass (confirmed via a real browser
  // screenshot: without this filter, an imageless card's fully-transparent
  // top half - the card-info gradient has no opaque photo layer beneath it -
  // let the stacked card behind it visually bleed through). Those cards are
  // still visible elsewhere (Profile Activity tab); just not in this feed.
  const { data: cards, error } = await supabase
    .from('food_cards')
    .select('*')
    .eq('status', 'PUBLISHED')
    .neq('user_id', userId)
    .not('image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(FEED_CANDIDATE_LIMIT);

  if (error || !cards?.length) return [];

  const authorIds = [...new Set(cards.map((c) => c.user_id as string))];
  const { data: authors } = await supabase
    .from('users')
    .select('id, display_name, username, avatar_url, is_master_bot')
    .in('id', authorIds);

  const authorsById = new Map(
    (authors || []).map((a) => [
      a.id as string,
      {
        id: a.id as string,
        displayName: (a.display_name as string) || (a.username as string) || 'FUZO User',
        username: (a.username as string) || 'fuzo_user',
        avatarUrl: (a.avatar_url as string) || null,
        isMasterBot: !!a.is_master_bot,
      } satisfies FeedCardAuthor,
    ]),
  );

  const prefCuisines = new Set(onboardingPrefs.cuisines.map((c) => c.toLowerCase()));
  const strictDiets = onboardingPrefs.dietary.filter((d) => d === 'Vegan' || d === 'Vegetarian');

  // Match Sensitivity (Settings' "Discovery & Matching" section): Balanced
  // is the original, unchanged default. Broad softens the diet penalty for
  // viewers who'd rather see more, imperfectly-matching cards. Exact hard-
  // excludes cards that don't genuinely fit, rather than just ranking them
  // lower - the only sensitivity level that filters instead of just sorts.
  const dietPenalty = matchSensitivity === 'Broad' ? 150 : 300;
  const trendingWeight = prioritizeTrending ? 50 : 20;

  const dietSatisfied = (cardDiets: string[]) =>
    strictDiets.every((diet) => cardDiets.includes(diet) || (diet === 'Vegetarian' && cardDiets.includes('Vegan')));

  const scored = (cards as FoodCardRecord[]).map((card) => {
    const tags = (card.tags || {}) as Partial<CardTags>;
    const cardCuisines = tags.cuisine || [];
    const cardDiets = tags.diet || [];

    const cuisineHits = cardCuisines.filter((c) => prefCuisines.has(c.toLowerCase())).length;
    let score = cuisineHits * 100;

    for (const diet of strictDiets) {
      // Vegan is a subset of Vegetarian - a card tagged only 'Vegan' still
      // satisfies a Vegetarian requirement, so it shouldn't stack both
      // penalties (confirmed via the ranking sanity check: without this, a
      // Vegan+Vegetarian viewer got -600 on cards that would in fact be fine).
      const satisfied = cardDiets.includes(diet) || (diet === 'Vegetarian' && cardDiets.includes('Vegan'));
      if (!satisfied) score -= dietPenalty;
    }

    if (aggregate.sampleSize > 0) {
      const distance = euclideanDistance(aggregate.vector, (card.flavor_profile || {}) as Partial<FlavorVector>);
      score += Math.max(0, 60 - distance * 6);
    }

    // Food DNA quiz bias (Health/Luxury only - the two axes with a real
    // content signal to hook into, see supabase/migrations/
    // 20260726000000_taste_profiles_dna_scores.sql). No score change at all
    // when dnaScores is absent (hasn't taken the quiz).
    if (dnaScores) {
      if (dnaScores.health > DNA_AXIS_THRESHOLD && cardDiets.some((d) => HEALTH_DIET_TAGS.has(d))) {
        score += 30;
      }
      const priceLevel = tags.price_level;
      if (priceLevel) {
        if (dnaScores.luxury > DNA_AXIS_THRESHOLD && HIGH_PRICE_LEVELS.has(priceLevel)) score += 30;
        else if (dnaScores.luxury < 100 - DNA_AXIS_THRESHOLD && LOW_PRICE_LEVELS.has(priceLevel)) score += 30;
      }
    }

    score += decay(card.created_at) * trendingWeight;
    score += Math.random() * 10;

    const matchReason = cuisineHits > 0
      ? `Matches your ${cardCuisines.find((c) => prefCuisines.has(c.toLowerCase()))} preference`
      : aggregate.sampleSize > 0
        ? 'Matches your flavor profile'
        : 'Popular pick';

    const qualifiesForExact = prefCuisines.size === 0 || cuisineHits > 0;

    return { card, score, matchReason, cardDiets, qualifiesForExact };
  });

  return scored
    .filter((entry) => matchSensitivity !== 'Exact' || (entry.qualifiesForExact && dietSatisfied(entry.cardDiets)))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ card, matchReason }) => ({
      card,
      author: authorsById.get(card.user_id) || {
        id: card.user_id,
        displayName: 'FUZO User',
        username: 'fuzo_user',
        avatarUrl: null,
        isMasterBot: false,
      },
      matchReason,
    }));
}

export async function getNearbyRestaurants(
  lat: number,
  lng: number,
  topCuisine?: string,
  options?: { radiusKm?: number; hiddenGems?: boolean; luxury?: number },
): Promise<NearbyRestaurant[]> {
  const radiusMeters = (options?.radiusKm ?? 5) * 1000;
  const result = await PlacesService.searchNearby(lat, lng, radiusMeters);
  if (!result.success || !result.data?.results?.length) return [];

  const cuisineLower = topCuisine?.toLowerCase();

  const restaurants = result.data.results.map((place) => {
    const placeLat = place.geometry?.location?.lat;
    const placeLng = place.geometry?.location?.lng;
    const distanceMeters =
      placeLat != null && placeLng != null ? getDistance({ lat, lng }, { lat: placeLat, lng: placeLng }) : Infinity;
    const haystack = `${place.name} ${place.vicinity || ''}`.toLowerCase();

    const photoReference = place.photos?.[0]?.photo_reference;

    return {
      placeId: place.place_id || place.id || '',
      name: place.name,
      vicinity: place.vicinity || place.formatted_address || '',
      rating: place.rating,
      reviews: place.user_ratings_total,
      priceLevel: place.price_level,
      distanceMeters,
      matchesTaste: !!cuisineLower && haystack.includes(cuisineLower),
      image: photoReference ? buildPlacePhotoUrl(photoReference) : undefined,
    };
  });

  // Show Hidden Gems (Settings' "Discovery & Matching" section): a soft
  // re-sort toward fewer-reviews spots first, using Google Places' own real
  // review-count field - not a hard filter, so a sparse area doesn't end up
  // empty. Off (or no review-count data) keeps the original rating-first sort.
  const baseCompare = options?.hiddenGems
    ? (a: NearbyRestaurant, b: NearbyRestaurant) => (a.reviews ?? 0) - (b.reviews ?? 0)
    : (a: NearbyRestaurant, b: NearbyRestaurant) => (b.rating ?? 0) - (a.rating ?? 0);

  // Food DNA quiz's Luxury axis: a secondary bias (not a hard filter) toward
  // higher/lower Google price_level (0-4, already real), same threshold/
  // no-op-when-absent convention as getFeedCards' Health/Luxury bias above.
  const luxury = options?.luxury;
  if (luxury === undefined) return restaurants.sort(baseCompare);

  const luxuryCompare = (a: NearbyRestaurant, b: NearbyRestaurant) => {
    if (luxury > DNA_AXIS_THRESHOLD) return (b.priceLevel ?? -1) - (a.priceLevel ?? -1);
    if (luxury < 100 - DNA_AXIS_THRESHOLD) return (a.priceLevel ?? 5) - (b.priceLevel ?? 5);
    return 0;
  };
  return restaurants.sort((a, b) => luxuryCompare(a, b) || baseCompare(a, b));
}

export async function getSuggestedVideos(topCuisine?: string): Promise<SuggestedVideo[]> {
  const query = `${topCuisine ?? 'food'} recipe`;
  const result = await YouTubeService.searchVideos(query, 8);
  if (!result.success || !result.data?.items?.length) return [];

  return result.data.items
    .filter((item) => item.id?.videoId)
    .map((item) => ({
      videoId: item.id!.videoId!,
      title: item.snippet?.title || 'Untitled',
      thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '',
      channelTitle: item.snippet?.channelTitle || '',
    }));
}
