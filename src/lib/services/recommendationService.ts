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
import { FLAVOR_AXES, ZERO_FLAVOR, type CardTags, type FlavorVector } from '@/lib/types/foodCard';

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
}

export interface NearbyRestaurant {
  placeId: string;
  name: string;
  vicinity: string;
  rating?: number;
  priceLevel?: number;
  distanceMeters: number;
  matchesTaste: boolean;
}

export interface SuggestedVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

const HALF_LIFE_DAYS = 90;

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
export async function aggregateForUser(userId: string): Promise<AggregateResult> {
  const empty: AggregateResult = { vector: ZERO_FLAVOR, cuisineCounts: {}, dietCounts: {}, sampleSize: 0 };
  const supabase = createClient();
  if (!supabase) return empty;

  const { data, error } = await supabase
    .from('food_cards')
    .select('flavor_profile, tags, created_at')
    .eq('user_id', userId);

  if (error || !data?.length) return empty;

  const now = Date.now();
  const decay = (at: string) => Math.pow(0.5, (now - new Date(at).getTime()) / (HALF_LIFE_DAYS * 86400000));

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
  }));
}

export async function getNearbyRestaurants(lat: number, lng: number, topCuisine?: string): Promise<NearbyRestaurant[]> {
  const result = await PlacesService.searchNearby(lat, lng);
  if (!result.success || !result.data?.results?.length) return [];

  const cuisineLower = topCuisine?.toLowerCase();

  return result.data.results
    .map((place) => {
      const placeLat = place.geometry?.location?.lat;
      const placeLng = place.geometry?.location?.lng;
      const distanceMeters =
        placeLat != null && placeLng != null ? getDistance({ lat, lng }, { lat: placeLat, lng: placeLng }) : Infinity;
      const haystack = `${place.name} ${place.vicinity || ''}`.toLowerCase();

      return {
        placeId: place.place_id || place.id || '',
        name: place.name,
        vicinity: place.vicinity || place.formatted_address || '',
        rating: place.rating,
        priceLevel: place.price_level,
        distanceMeters,
        matchesTaste: !!cuisineLower && haystack.includes(cuisineLower),
      };
    })
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
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
