import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface FeedCard {
  id: string;
  card_type: 'RECIPE' | 'RESTAURANT_NEARBY' | 'VIDEO' | 'PHOTO' | 'AD';
  content_id: string;
  metadata: Record<string, any>;
  source_api?: string;
  relevance_score: number;
  created_at: string;
}

interface FeedComposerRequest {
  user_id: string;
  exclude_cards?: string[];
  user_lat?: number;
  user_lng?: number;
  radius_km?: number;
  custom_ratio?: {
    recipes?: number;
    restaurants?: number;
    videos?: number;
    photos?: number;
    ads?: number;
  };
}

interface FeedComposerResponse {
  cards: FeedCard[];
  composition: {
    recipes: number;
    restaurants: number;
    videos: number;
    photos: number;
    ads: number;
  };
  total_available: {
    recipes: number;
    restaurants: number;
    videos: number;
    photos: number;
    ads: number;
  };
  user_preferences_applied: boolean;
}

// Default composition ratios for 7 cards
const DEFAULT_RATIO = {
  recipes: 3,
  restaurants: 2,
  videos: 1,
  photos: 0,
  ads: 1
};

const FALLBACK_RATIOS = [
  // If one pool is empty, try these alternative distributions
  { recipes: 4, restaurants: 2, videos: 1, photos: 0, ads: 0 }, // No ads
  { recipes: 3, restaurants: 3, videos: 1, photos: 0, ads: 0 }, // No ads, more restaurants
  { recipes: 5, restaurants: 1, videos: 1, photos: 0, ads: 0 }, // Mostly recipes
  { recipes: 2, restaurants: 4, videos: 1, photos: 0, ads: 0 }, // Mostly restaurants
  { recipes: 4, restaurants: 0, videos: 3, photos: 0, ads: 0 }, // No restaurants
  { recipes: 7, restaurants: 0, videos: 0, photos: 0, ads: 0 }, // Only recipes
];

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Parse request body
    const requestBody: FeedComposerRequest = await req.json();
    const { 
      user_id, 
      exclude_cards = [], 
      user_lat, 
      user_lng, 
      radius_km = 50,
      custom_ratio 
    } = requestBody;

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user preferences for personalization
    const { data: userPreferences } = await supabaseClient
      .rpc('get_feed_composition_preferences', { p_user_id: user_id });

    const hasPreferences = userPreferences && userPreferences.length > 0;
    const preferences = hasPreferences ? userPreferences[0] : null;

    // Use custom ratio or default
    const targetRatio = custom_ratio || DEFAULT_RATIO;
    let actualComposition = { recipes: 0, restaurants: 0, videos: 0, photos: 0, ads: 0 };
    const selectedCards: FeedCard[] = [];

    // Helper function to build preference filters
    const buildPreferenceFilter = (cardType: string) => {
      if (!preferences) return '';

      switch (cardType) {
        case 'RECIPE':
          const cuisineFilter = preferences.preferred_cuisines?.length 
            ? `AND (metadata->>'cuisine' = ANY(ARRAY[${preferences.preferred_cuisines.map((c: string) => `'${c}'`).join(',')}]))`
            : '';
          const difficultyFilter = preferences.preferred_difficulty_levels?.length
            ? `AND (metadata->>'difficulty' = ANY(ARRAY[${preferences.preferred_difficulty_levels.map((d: string) => `'${d}'`).join(',')}]))`
            : '';
          return cuisineFilter + difficultyFilter;

        case 'RESTAURANT_NEARBY':
          const priceFilter = preferences.preferred_price_levels?.length
            ? `AND (metadata->>'price_level')::INTEGER = ANY(ARRAY[${preferences.preferred_price_levels.join(',')}])`
            : '';
          return priceFilter;

        case 'VIDEO':
          const categoryFilter = preferences.preferred_video_categories?.length
            ? `AND (metadata->>'category' = ANY(ARRAY[${preferences.preferred_video_categories.map((c: string) => `'${c}'`).join(',')}]))`
            : '';
          return categoryFilter;

        default:
          return '';
      }
    };

    // Helper function to fetch cards of a specific type
    const fetchCards = async (cardType: string, limit: number, usePreferences = true) => {
      const excludeFilter = exclude_cards.length > 0 
        ? `AND id NOT IN (${exclude_cards.map(id => `'${id}'`).join(',')})`
        : '';

      const locationFilter = (cardType === 'RESTAURANT_NEARBY' && user_lat && user_lng)
        ? `AND ST_DWithin(
             ST_SetSRID(ST_Point(location_lng, location_lat), 4326)::geography,
             ST_SetSRID(ST_Point(${user_lng}, ${user_lat}), 4326)::geography,
             ${radius_km * 1000}
           )`
        : '';

      const preferenceFilter = usePreferences ? buildPreferenceFilter(cardType) : '';

      const query = `
        SELECT id, card_type, content_id, metadata, source_api, relevance_score, created_at
        FROM feed_cards 
        WHERE card_type = '${cardType}' 
          AND is_active = true
          ${excludeFilter}
          ${locationFilter}
          ${preferenceFilter}
        ORDER BY relevance_score DESC, RANDOM()
        LIMIT ${limit}
      `;

      const { data, error } = await supabaseClient.rpc('execute_sql', { query });
      
      if (error) {
        console.error(`Error fetching ${cardType} cards:`, error);
        return [];
      }

      return data || [];
    };

    // Helper function to get total available count
    const getAvailableCount = async (cardType: string) => {
      const excludeFilter = exclude_cards.length > 0 
        ? `AND id NOT IN (${exclude_cards.map(id => `'${id}'`).join(',')})`
        : '';

      const locationFilter = (cardType === 'RESTAURANT_NEARBY' && user_lat && user_lng)
        ? `AND ST_DWithin(
             ST_SetSRID(ST_Point(location_lng, location_lat), 4326)::geography,
             ST_SetSRID(ST_Point(${user_lng}, ${user_lat}), 4326)::geography,
             ${radius_km * 1000}
           )`
        : '';

      const query = `
        SELECT COUNT(*) as count
        FROM feed_cards 
        WHERE card_type = '${cardType}' 
          AND is_active = true
          ${excludeFilter}
          ${locationFilter}
      `;

      const { data } = await supabaseClient.rpc('execute_sql', { query });
      return data?.[0]?.count || 0;
    };

    // Get total available counts for each type
    const totalAvailable = {
      recipes: await getAvailableCount('RECIPE'),
      restaurants: await getAvailableCount('RESTAURANT_NEARBY'),
      videos: await getAvailableCount('VIDEO'),
      photos: await getAvailableCount('PHOTO'),
      ads: await getAvailableCount('AD')
    };

    // Try to fulfill the target ratio, with fallbacks
    const tryRatio = async (ratio: typeof DEFAULT_RATIO) => {
      const cards: FeedCard[] = [];
      let composition = { recipes: 0, restaurants: 0, videos: 0, photos: 0, ads: 0 };

      // Fetch each card type according to ratio
      if (ratio.recipes > 0) {
        const recipeCards = await fetchCards('RECIPE', ratio.recipes);
        cards.push(...recipeCards);
        composition.recipes = recipeCards.length;
      }

      if (ratio.restaurants > 0) {
        const restaurantCards = await fetchCards('RESTAURANT_NEARBY', ratio.restaurants);
        cards.push(...restaurantCards);
        composition.restaurants = restaurantCards.length;
      }

      if (ratio.videos > 0) {
        const videoCards = await fetchCards('VIDEO', ratio.videos);
        cards.push(...videoCards);
        composition.videos = videoCards.length;
      }

      if (ratio.photos > 0) {
        const photoCards = await fetchCards('PHOTO', ratio.photos);
        cards.push(...photoCards);
        composition.photos = photoCards.length;
      }

      if (ratio.ads > 0) {
        const adCards = await fetchCards('AD', ratio.ads);
        cards.push(...adCards);
        composition.ads = adCards.length;
      }

      return { cards, composition };
    };

    // Try target ratio first
    let result = await tryRatio(targetRatio);
    
    // If we don't have enough cards, try fallback ratios
    if (result.cards.length < 7) {
      for (const fallbackRatio of FALLBACK_RATIOS) {
        result = await tryRatio(fallbackRatio);
        if (result.cards.length >= 7) break;
      }
    }

    // If still not enough, fill with any available cards up to 7
    if (result.cards.length < 7) {
      const remaining = 7 - result.cards.length;
      const cardTypes = ['RECIPE', 'RESTAURANT_NEARBY', 'VIDEO', 'PHOTO', 'AD'];
      
      for (const cardType of cardTypes) {
        if (result.cards.length >= 7) break;
        
        const needed = Math.min(remaining, 7 - result.cards.length);
        const additionalCards = await fetchCards(cardType, needed, false); // No preferences for fallback
        
        // Filter out already selected cards
        const selectedIds = new Set(result.cards.map(c => c.id));
        const newCards = additionalCards.filter(card => !selectedIds.has(card.id));
        
        result.cards.push(...newCards.slice(0, needed));
        
        // Update composition
        switch (cardType) {
          case 'RECIPE': result.composition.recipes += newCards.length; break;
          case 'RESTAURANT_NEARBY': result.composition.restaurants += newCards.length; break;
          case 'VIDEO': result.composition.videos += newCards.length; break;
          case 'PHOTO': result.composition.photos += newCards.length; break;
          case 'AD': result.composition.ads += newCards.length; break;
        }
      }
    }

    // Shuffle the final cards to avoid predictable ordering
    const shuffledCards = result.cards.sort(() => Math.random() - 0.5);

    const response: FeedComposerResponse = {
      cards: shuffledCards.slice(0, 7), // Ensure exactly 7 cards
      composition: result.composition,
      total_available: totalAvailable,
      user_preferences_applied: hasPreferences
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Feed composer error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});