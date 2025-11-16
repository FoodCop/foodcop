import { supabase } from './supabase';
import { GooglePlacesService } from './googlePlaces';
import { backendService } from './backendService';
import { SpoonacularService } from './spoonacular';
import { YouTubeService } from './youtube';
import { withCache, generateLocationKey, generatePreferencesKey } from './feedCache';
import feedCache from './feedCache';
import { imageOptimizer } from './imageOptimizer';
import { getPlaceHeroImage } from './googlePlacesImages';
import type { FeedCard, RestaurantCard, RecipeCard, VideoCard, MasterbotCard, AdCard } from '../components/feed/data/feed-content';

// Core interfaces for feed generation
export interface UserLocation {
  lat: number;
  lng: number;
}

export interface UserPreferences {
  cuisinePreferences: string[];
  dietaryRestrictions: string[];
  preferredRadius: number;
  priceRange?: string[];
  contentTypes?: string[];
}

export interface FeedGenerationParams {
  userLocation?: UserLocation;
  userPreferences?: UserPreferences;
  pageSize?: number;
  cursor?: string;
  userId?: string;
}

export interface SwipeEvent {
  cardId: string;
  cardType: string;
  contentId: string;
  swipeDirection: 'left' | 'right' | 'up' | 'down';
  swipeAction: 'pass' | 'like' | 'share' | 'save';
  userId: string;
  sessionId?: string;
}

// API Response Types
interface GoogleRestaurant {
  place_id: string;
  name: string;
  vicinity?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
  }>;
  types?: string[];
}

interface MasterbotPost {
  id: string;
  title: string;
  content: string;
  image_url: string;
  restaurant_name?: string;
  restaurant_location?: string;
  restaurant_rating?: string;
  restaurant_price_range?: string;
  restaurant_cuisine?: string;
  tags: string[];
  engagement_likes: number;
  personality_trait?: string;
  content_type?: string;
  latitude?: string;
  longitude?: string;
  display_name: string;
  username: string;
  avatar_url: string;
}

interface SpoonacularRecipe {
  id: number;
  title: string;
  image?: string;
  imageType?: string;
  summary?: string;
  readyInMinutes?: number;
  servings?: number;
  sourceName?: string;
  sourceUrl?: string;
  spoonacularScore?: number;
  healthScore?: number;
}

interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
    channelTitle: string;
    publishedAt: string;
  };
}

// Card Distribution Configuration - Phase 2 Enhanced
// Original working formula: 2 Restaurants + 2 Masterbot + 1 Ad + 1 Recipe + 1 Video
const DEFAULT_CARD_DISTRIBUTION = {
  restaurant: 0.30,  // 30% - Location-based restaurants (2-3 per 10 cards)
  masterbot: 0.25,   // 25% - Masterbot influencer posts (2-3 per 10 cards) ✅ RESTORED
  recipe: 0.20,      // 20% - Personalized recipes (2 per 10 cards)
  video: 0.15,       // 15% - Cooking videos (1-2 per 10 cards)
  ad: 0.10          // 10% - Sponsored content (1 per 10 cards)
};

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_RADIUS = 15000; // 15km in meters (increased for variety)

// Phase 2: API Timeout Configuration 
const API_TIMEOUTS = {
  restaurant: 8000,  // 8s - Google Places can be slow
  recipe: 6000,      // 6s - Spoonacular is usually fast
  video: 7000,       // 7s - YouTube API medium speed
  masterbot: 5000,   // 5s - Supabase should be fast
  default: 10000     // 10s fallback
};

/**
 * Phase 2: Timeout wrapper for API calls
 */
const withTimeout = async <T>(
  promise: Promise<T>, 
  timeoutMs: number, 
  apiName: string
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${apiName} API timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
};

// Transformation Functions
export const transformRestaurantToFeedCard = async (
  restaurant: GoogleRestaurant, 
  userLocation?: UserLocation
): Promise<RestaurantCard> => {
  const distance = userLocation ? 
    calculateDistance(
      userLocation.lat, 
      userLocation.lng,
      restaurant.geometry.location.lat,
      restaurant.geometry.location.lng
    ) : null;

  // Map Google Places types to cuisine categories
  const cuisine = mapPlaceTypesToCuisine(restaurant.types || []);
  
  // ✅ FIX: Use photo reference from nearby search instead of fetching details
  // This eliminates 20+ serial API calls per feed load
  let rawImageUrl: string;
  try {
    // Check if restaurant has photos in the nearby search result
    if (restaurant.photos && restaurant.photos.length > 0) {
      const photoRef = restaurant.photos[0].photo_reference;
      // Build photo URL directly from photo reference (no API call needed)
      rawImageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
    } else if (restaurant.place_id) {
      // Only fetch details if no photo reference available (rare case)
      const placeImage = await getPlaceHeroImage(restaurant.place_id, { maxWidth: 400, maxHeight: 300 });
      rawImageUrl = placeImage.url || generateRestaurantFallbackImage(cuisine);
    } else {
      rawImageUrl = generateRestaurantFallbackImage(cuisine);
    }
  } catch (error) {
    console.warn('Failed to fetch Google Places image:', error);
    rawImageUrl = generateRestaurantFallbackImage(cuisine);
  }
    
  // Phase 3: Optimize restaurant image for performance
  const optimizedImage = imageOptimizer.optimizeImageByType(rawImageUrl, 'restaurant');

  return {
    id: `restaurant-${restaurant.place_id}`,
    type: 'restaurant',
    saveCategory: 'Places',
    name: restaurant.name,
    cuisine: cuisine,
    priceRange: mapPriceLevel(restaurant.price_level),
    rating: restaurant.rating || 0,
    reviewCount: restaurant.user_ratings_total || 0,
    location: restaurant.vicinity || 'Location not available',
    distance: distance ? `${distance.toFixed(1)} km away` : 'Distance unavailable',
    imageUrl: optimizedImage.src,
    description: `${cuisine} restaurant${restaurant.rating ? ` with ${restaurant.rating}⭐ rating` : ''}`,
    tags: restaurant.types?.slice(0, 3) || []
  };
};

export const transformRecipeToFeedCard = (recipe: SpoonacularRecipe): RecipeCard => {
  // Determine difficulty based on various factors
  const difficulty = determineDifficulty(
    recipe.readyInMinutes || 30,
    recipe.spoonacularScore || 50
  );

  // Phase 3: Optimize recipe image for performance
  const rawImageUrl = recipe.image || generateRecipeFallbackImage(recipe.title);
  const optimizedImage = imageOptimizer.optimizeImageByType(rawImageUrl, 'recipe');

  return {
    id: `recipe-${recipe.id}`,
    type: 'recipe',
    saveCategory: 'Recipes',
    title: recipe.title,
    author: recipe.sourceName || 'Spoonacular',
    imageUrl: optimizedImage.src,
    prepTime: `${Math.max((recipe.readyInMinutes || 30) - 20, 5)} min`,
    cookTime: `${recipe.readyInMinutes || 30} min`,
    difficulty: difficulty,
    servings: recipe.servings || 4,
    description: cleanHtmlSummary(recipe.summary || `Delicious ${recipe.title} recipe`),
    tags: generateRecipeTags(recipe.title)
  };
};

export const transformVideoToFeedCard = (video: YouTubeVideo): VideoCard => {
  // Phase 3: Optimize video thumbnail for performance
  const rawThumbnailUrl = video.snippet.thumbnails.medium.url;
  const optimizedImage = imageOptimizer.optimizeImageByType(rawThumbnailUrl, 'video');

  return {
    id: `video-${video.id.videoId}`,
    type: 'video',
    saveCategory: 'Videos',
    title: video.snippet.title,
    creator: video.snippet.channelTitle,
    thumbnailUrl: optimizedImage.src,
    duration: 'Short', // YouTube search doesn't provide duration
    views: Math.floor(Math.random() * 100000), // Placeholder - would need separate API call
    description: video.snippet.description.slice(0, 150) + '...',
    tags: extractVideoTags(video.snippet.title, video.snippet.description)
  };
};

export const transformMasterbotToFeedCard = (post: MasterbotPost): MasterbotCard => {
  // Phase 3: Optimize masterbot images for performance
  // Ensure we have valid URLs before optimization
  const avatarUrl = post.avatar_url || 'https://lgladnskxmbkhcnrsfxv.supabase.co/storage/v1/object/public/master-bot-posts/avatars/jun_zen_minimalist.png';
  const optimizedAvatar = imageOptimizer.optimizeImageByType(avatarUrl, 'avatar');
  
  // TEMPORARY: Bypass image optimization to debug the issue
  let finalImageUrl = post.image_url || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80';
  
  // Try image optimization but fallback to original if it fails
  const optimizedImage = post.image_url 
    ? imageOptimizer.optimizeImageByType(post.image_url, 'feedCard')
    : null;

  // Use optimized only if it exists and looks valid, otherwise use original
  if (optimizedImage?.src && optimizedImage.src !== '' && !optimizedImage.src.includes('undefined')) {
    finalImageUrl = optimizedImage.src;
  }

  // ✅ FIX: Add null guard for tags to prevent entire batch from being dropped
  const safeTags = Array.isArray(post.tags) ? post.tags.slice(0, 3) : [];

  // Debug image URLs with more detail
  console.log('🖼️ Masterbot image optimization DEBUG:', {
    postId: post.id,
    username: post.username,
    originalAvatar: post.avatar_url,
    optimizedAvatar: optimizedAvatar.src,
    avatarFallback: optimizedAvatar.fallbackSrc,
    originalImage: post.image_url,
    optimizedImage: optimizedImage?.src,
    imageFallback: optimizedImage?.fallbackSrc,
    finalImageUrl: finalImageUrl,
    imageOptimizationWorked: !!optimizedImage?.src,
    tagsStatus: post.tags ? 'valid' : 'null - using fallback'
  });

  return {
    id: `masterbot-${post.id}`,
    type: 'masterbot',
    saveCategory: 'Posts',
    username: post.username,
    displayName: post.display_name,
    avatarUrl: optimizedAvatar.src,
    imageUrl: finalImageUrl,
    caption: post.content,
    likes: post.engagement_likes,
    restaurantTag: post.restaurant_name || undefined,
    tags: safeTags
  };
};

export const generatePlaceholderAdCard = (): AdCard => {
  const placeholderAds = [
    {
      brandName: 'FoodieFinds',
      headline: 'Discover Local Gems',
      description: 'Find hidden restaurants in your neighborhood',
      ctaText: 'Explore Now',
      imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80'
    },
    {
      brandName: 'CookingMaster',
      headline: 'Learn to Cook Like a Pro',
      description: 'Professional cooking courses from master chefs',
      ctaText: 'Start Learning',
      imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80'
    }
  ];

  const ad = placeholderAds[Math.floor(Math.random() * placeholderAds.length)];
  
  return {
    id: `ad-${Date.now()}-${Math.random()}`,
    type: 'ad',
    saveCategory: 'Ads',
    brandName: ad.brandName,
    imageUrl: ad.imageUrl,
    headline: ad.headline,
    description: ad.description,
    ctaText: ad.ctaText,
    ctaUrl: '#'
  };
};

// Phase 2: Anti-repetition system state (module-level for persistence)
const seenContentIds = new Set<string>();
const sessionSeenIds = new Set<string>();
let seenContentInitialized = false; // Cache flag to prevent re-queries
let lastInitializedUserId: string | null = null;

// Main Feed Service
export const FeedService = {

  /**
   * Phase 2: Initialize anti-repetition system from user's swipe history
   * NOW WITH SESSION CACHING: Only queries once per user session
   */
  async initializeSeenContent(userId?: string): Promise<void> {
    if (!userId) {
      console.log('👤 No userId provided, using session-only tracking');
      return;
    }

    // ✅ FIX: Cache check - skip if already initialized for this user
    if (seenContentInitialized && lastInitializedUserId === userId) {
      console.log('✨ Seen content already initialized for this session, using cache');
      return;
    }

    try {
      console.log('🔍 Loading user swipe history for anti-repetition (first time)...');
      
      // Query user's swipe history from last 30 days to avoid repetition
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: swipeHistory, error } = await supabase
        .from('user_swipe_history')
        .select('content_id, swipe_direction, created_at')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist, just continue with session-only tracking
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('⚠️ user_swipe_history table not found, using session-only tracking');
          seenContentInitialized = true;
          lastInitializedUserId = userId;
          return;
        }
        console.error('❌ Failed to load swipe history:', error);
        return;
      }

      // Add seen content IDs to filter set
      swipeHistory?.forEach(swipe => {
        if (swipe.content_id) {
          seenContentIds.add(swipe.content_id);
        }
      });

      console.log(`🚫 Loaded ${seenContentIds.size} previously seen items for filtering`);
      
      // ✅ Mark as initialized
      seenContentInitialized = true;
      lastInitializedUserId = userId;

    } catch (error) {
      console.error('❌ Error initializing seen content:', error);
    }
  },

  /**
   * Clear all cached feed data (restaurants, recipes, videos, etc.)
   * Useful for forcing fresh data from APIs
   */
  clearCache(): void {
    feedCache.clear();
    console.log('🗑️ Feed cache cleared - fresh data will be fetched');
  },

  /**
   * Phase 2: Filter out already-seen content (improved with less aggressive filtering)
   */
  filterSeenContent<T extends { id: string }>(items: T[], contentType: string): T[] {
    const startCount = items.length;
    
    const filtered = items.filter(item => {
      // For restaurants, be less aggressive - only filter if seen in current session
      // This prevents infinite loops while still providing some variety
      if (contentType === 'restaurant') {
        const seenInSession = sessionSeenIds.has(item.id);
        if (seenInSession) {
          console.log(`🚫 Filtered session-seen ${contentType}:`, item.id);
          return false;
        }
        // Don't add to session tracking here - do it when actually shown/swiped
        return true;
      }
      
      // For other content types, use full filtering
      const alreadySeen = seenContentIds.has(item.id) || sessionSeenIds.has(item.id);
      
      if (alreadySeen) {
        console.log(`🚫 Filtered seen ${contentType}:`, item.id);
        return false;
      }
      
      return true;
    });

    const filteredCount = startCount - filtered.length;
    if (filteredCount > 0) {
      console.log(`🔍 Anti-repetition: Filtered ${filteredCount} seen ${contentType} items (${contentType === 'restaurant' ? 'session-only' : 'full'})`);
    }

    return filtered;
  },

  /**
   * Phase 2: Mark content as seen (called when card is swiped)
   */
  markContentAsSeen(contentId: string): void {
    seenContentIds.add(contentId);
    sessionSeenIds.add(contentId);
  },

  /**
   * Phase 2: Clear session tracking (called on app restart/new session)
   */
  clearSessionSeen(): void {
    sessionSeenIds.clear();
    console.log('🧹 Cleared session seen content tracking');
  },

  /**
   * Debug: Clear all seen content (for testing)
   */
  clearAllSeenContent(): void {
    seenContentIds.clear();
    sessionSeenIds.clear();
    console.log('🧹 DEBUG: Cleared ALL seen content tracking');
  },

  /**
   * Debug: Get seen content stats
   */
  getSeenContentStats(): { persistent: number, session: number } {
    return {
      persistent: seenContentIds.size,
      session: sessionSeenIds.size
    };
  },

  /**
   * Phase 2: Calculate weighted card distribution ensuring exact pageSize
   */
  calculateWeightedDistribution(pageSize: number) {
    // Calculate initial counts using weights
    let restaurantCount = Math.floor(pageSize * DEFAULT_CARD_DISTRIBUTION.restaurant);
    let recipeCount = Math.floor(pageSize * DEFAULT_CARD_DISTRIBUTION.recipe);
    let videoCount = Math.floor(pageSize * DEFAULT_CARD_DISTRIBUTION.video);
    let masterbotCount = Math.floor(pageSize * DEFAULT_CARD_DISTRIBUTION.masterbot);
    let adCount = Math.floor(pageSize * DEFAULT_CARD_DISTRIBUTION.ad);
    
    // Calculate remainder to distribute
    const totalAssigned = restaurantCount + recipeCount + videoCount + masterbotCount + adCount;
    const remainder = pageSize - totalAssigned;
    
    // Distribute remainder based on priority (restaurants first, then recipes, etc.)
    const priorities = [
      { key: 'restaurant', count: restaurantCount },
      { key: 'recipe', count: recipeCount },
      { key: 'video', count: videoCount },
      { key: 'masterbot', count: masterbotCount },
      { key: 'ad', count: adCount }
    ];
    
    for (let i = 0; i < remainder; i++) {
      const priorityIndex = i % priorities.length;
      if (priorities[priorityIndex].key === 'restaurant') restaurantCount++;
      else if (priorities[priorityIndex].key === 'recipe') recipeCount++;
      else if (priorities[priorityIndex].key === 'video') videoCount++;
      else if (priorities[priorityIndex].key === 'masterbot') masterbotCount++;
      else if (priorities[priorityIndex].key === 'ad') adCount++;
    }
    
    return {
      restaurant: restaurantCount,
      recipe: recipeCount,
      video: videoCount,
      masterbot: masterbotCount,
      ad: adCount
    };
  },

  /**
   * Generate a batch of feed cards based on user parameters
   */
  async generateFeed(params: FeedGenerationParams = {}): Promise<FeedCard[]> {
    const {
      userLocation,
      userPreferences,
      pageSize = DEFAULT_PAGE_SIZE,
      userId
    } = params;

    console.log('🍽️ Generating feed with params:', { userLocation, userPreferences, pageSize, userId });

    try {
      // Phase 2: Initialize anti-repetition system
      await this.initializeSeenContent(userId);
      
      // Phase 2: Enhanced weighted card distribution algorithm
      const cardCounts = this.calculateWeightedDistribution(pageSize);
      
      console.log('📊 Phase 2 weighted distribution:', {
        restaurant: cardCounts.restaurant,
        recipe: cardCounts.recipe,
        video: cardCounts.video,
        masterbot: cardCounts.masterbot,
        ad: cardCounts.ad,
        total: cardCounts.restaurant + cardCounts.recipe + cardCounts.video + cardCounts.masterbot + cardCounts.ad
      });

      // Phase 2: Fetch all card types in parallel with timeout management
      const startTime = Date.now();
      console.log('🔄 Starting parallel API orchestration...');
      
      const [
        restaurantResults,
        masterbotResults,
        recipeResults,
        videoResults
      ] = await Promise.allSettled([
        withTimeout(
          this.fetchRestaurantCards(userLocation, cardCounts.restaurant, userId),
          API_TIMEOUTS.restaurant,
          'Restaurant'
        ),
        withTimeout(
          this.fetchMasterbotCards(userLocation, cardCounts.masterbot, userId),
          API_TIMEOUTS.masterbot,
          'Masterbot'
        ),
        withTimeout(
          this.fetchRecipeCards(userPreferences, cardCounts.recipe, userId),
          API_TIMEOUTS.recipe,
          'Recipe'
        ),
        withTimeout(
          this.fetchVideoCards(userPreferences, cardCounts.video, userId),
          API_TIMEOUTS.video,
          'Video'
        )
      ]);
      
      const fetchTime = Date.now() - startTime;
      console.log(`⚡ Parallel API orchestration completed in ${fetchTime}ms`);

      // Collect successful results
      const feedCards: FeedCard[] = [];

      // Process results with enhanced error handling
      const processedResults = {
        restaurants: 0,
        masterbot: 0,
        recipes: 0,
        videos: 0,
        failed: [] as string[]
      };

      // Add restaurants
      if (restaurantResults.status === 'fulfilled') {
        const cards = restaurantResults.value as RestaurantCard[];
        feedCards.push(...cards);
        processedResults.restaurants = cards.length;
        console.log('✅ Added', cards.length, 'restaurant cards');
      } else {
        console.error('❌ Failed to fetch restaurant cards:', restaurantResults.reason);
        processedResults.failed.push('restaurants');
      }

      // Add masterbot posts
      if (masterbotResults.status === 'fulfilled') {
        const cards = masterbotResults.value as MasterbotCard[];
        feedCards.push(...cards);
        processedResults.masterbot = cards.length;
        console.log('✅ Added', cards.length, 'masterbot cards');
      } else {
        console.error('❌ Failed to fetch masterbot cards:', masterbotResults.reason);
        processedResults.failed.push('masterbot');
      }

      // Add recipes
      if (recipeResults.status === 'fulfilled') {
        const cards = recipeResults.value as RecipeCard[];
        feedCards.push(...cards);
        processedResults.recipes = cards.length;
        console.log('✅ Added', cards.length, 'recipe cards');
      } else {
        console.error('❌ Failed to fetch recipe cards:', recipeResults.reason);
        processedResults.failed.push('recipes');
      }

      // Add videos
      if (videoResults.status === 'fulfilled') {
        const cards = videoResults.value as VideoCard[];
        feedCards.push(...cards);
        processedResults.videos = cards.length;
        console.log('✅ Added', cards.length, 'video cards');
      } else {
        console.error('❌ Failed to fetch video cards:', videoResults.reason);
        processedResults.failed.push('videos');
      }

      // Add placeholder ads
      for (let i = 0; i < cardCounts.ad; i++) {
        feedCards.push(generatePlaceholderAdCard());
      }
      // Ads are always successful since they're generated locally
      console.log('✅ Added', cardCounts.ad, 'placeholder ad cards');

      // Phase 2: Enhanced orchestration summary
      console.log('📊 API Orchestration Results:', {
        targetDistribution: cardCounts,
        actualResults: processedResults,
        failedAPIs: processedResults.failed.length > 0 ? processedResults.failed : 'none',
        successRate: `${((4 - processedResults.failed.length) / 4 * 100).toFixed(1)}%`,
        totalCards: feedCards.length,
        fetchTime: `${fetchTime}ms`
      });

      // Shuffle for natural feed experience
      const shuffledCards = this.shuffleFeedCards(feedCards);
      
      console.log('🎲 Final feed generated:', shuffledCards.length, 'cards');
      return shuffledCards;

    } catch (error) {
      console.error('💥 Error generating feed:', error);
      throw new Error(`Feed generation failed: ${(error as Error).message}`);
    }
  },

  /**
   * Fetch restaurant cards based on location
   */
  async fetchRestaurantCards(
    userLocation?: UserLocation, 
    count: number = 4,
    userId?: string
  ): Promise<RestaurantCard[]> {
    if (!userLocation) {
      console.warn('⚠️ No user location provided for restaurant cards');
      return [];
    }

    try {
      // Phase 3: Use intelligent caching for restaurant data with anti-repetition
      const locationKey = generateLocationKey(userLocation.lat, userLocation.lng, DEFAULT_RADIUS);
      
      // Include session state in cache key to avoid repetition
      const sessionSeenCount = sessionSeenIds.size;
      const cacheOffset = Math.floor(sessionSeenCount / 10); // Change cache key every 10 seen items
      
      const cachedRestaurants = await withCache(
        'restaurant',
        [locationKey, count, userId || 'anonymous', cacheOffset],
        async () => {
          // Try backendService first, fallback to direct Google Places API
          console.log('🔍 Requesting restaurants from backend for location:', userLocation, 'radius:', DEFAULT_RADIUS);
          
          let result = await backendService.searchNearbyPlaces(
            { lat: userLocation.lat, lng: userLocation.lng },
            DEFAULT_RADIUS,
            'restaurant'
          );

          console.log('🔍 Backend service response:', {
            success: result.success,
            error: result.error,
            dataType: typeof result.data,
            hasResults: result.data?.results ? 'yes' : 'no',
            resultCount: result.data?.results?.length || 0,
            sampleResult: result.data?.results?.[0] || null
          });

          // Fallback to direct Google Places API if backend fails
          if (!result.success || !result.data) {
            console.warn('⚠️ Backend failed, using direct Google Places API fallback');
            result = await GooglePlacesService.nearbySearch(
              { lat: userLocation.lat, lng: userLocation.lng },
              DEFAULT_RADIUS,
              'restaurant'
            );
            
            console.log('🔍 Direct Google Places API response:', {
              success: result.success,
              error: result.error,
              dataType: typeof result.data,
              hasResults: result.data?.results ? 'yes' : 'no',
              resultCount: result.data?.results?.length || 0
            });
          }

          if (!result.success || !result.data) {
            console.error('❌ Restaurant search failed (both backend and direct API):', result.error);
            return [];
          }

          console.log('🔍 Restaurant API Response Structure:', { 
            success: result.success, 
            dataType: typeof result.data,
            isArray: Array.isArray(result.data),
            dataKeys: result.data ? Object.keys(result.data) : null,
            firstItem: Array.isArray(result.data) ? result.data[0] : null,
            rawDataSample: JSON.stringify(result.data).substring(0, 500)
          });

          // Enhanced data extraction with multiple possible structures
          let restaurantData = result.data;
          
          if (!Array.isArray(restaurantData)) {
            console.log('🔧 Extracting restaurant data from wrapper object...');
            
            // Try common response patterns
            const possibleArrayPaths = [
              'results',           // Google Places API style
              'data',              // Generic API wrapper
              'places',            // Places API specific
              'restaurants',       // Restaurant API specific
              'businesses',        // Business API style
              'venues',            // Venue API style
              'items',             // Generic items
              'list'               // Generic list
            ];
            
            let extracted = false;
            for (const path of possibleArrayPaths) {
              if (restaurantData[path] && Array.isArray(restaurantData[path])) {
                console.log(`✅ Found restaurant array at path: ${path}`);
                restaurantData = restaurantData[path];
                extracted = true;
                break;
              }
            }
            
            if (!extracted) {
              // If no standard paths work, try to find any array in the object
              const arrayValues = Object.values(restaurantData).filter(val => Array.isArray(val));
              if (arrayValues.length > 0) {
                console.log('✅ Found array in object values, using first array');
                restaurantData = arrayValues[0] as RestaurantCard[];
                extracted = true;
              }
            }
            
            if (!extracted) {
              console.error('❌ No restaurant array found in response structure:', {
                availableKeys: Object.keys(restaurantData),
                sampleData: restaurantData
              });
              return [];
            }
          }

          console.log(`✅ Successfully extracted ${restaurantData.length} restaurants from API response`);

          // Transform Google Places results to RestaurantCard format (async)
          return Promise.all(
            restaurantData.map(restaurant => 
              transformRestaurantToFeedCard(restaurant, userLocation)
            )
          );
        }
      );
      
      // Phase 2: Filter out seen content and apply anti-repetition
      let filteredRestaurants = this.filterSeenContent(cachedRestaurants, 'restaurant');
      
      // If we don't have enough unique restaurants, try expanding the search
      if (filteredRestaurants.length < count) {
        console.log(`⚠️ Only ${filteredRestaurants.length} unique restaurants found, expanding search...`);
        
        try {
          // Try multiple strategies for more variety
          const searchStrategies = [
            // Strategy 1: Expanded radius
            { radius: DEFAULT_RADIUS * 2, type: 'restaurant' },
            // Strategy 2: Different establishment types 
            { radius: DEFAULT_RADIUS, type: 'food' },
            { radius: DEFAULT_RADIUS, type: 'meal_takeaway' },
            { radius: DEFAULT_RADIUS, type: 'cafe' }
          ];
          
          const additionalRestaurants: RestaurantCard[] = [];
          
          for (const strategy of searchStrategies) {
            if (filteredRestaurants.length >= count) break;
            
            console.log(`🔍 Trying search strategy: ${strategy.type} at ${strategy.radius}m`);
            
            const expandedResult = await backendService.searchNearbyPlaces(
              { lat: userLocation.lat, lng: userLocation.lng },
              strategy.radius,
              strategy.type
            );
            
            if (expandedResult.success && expandedResult.data) {
              let expandedData = expandedResult.data;
              
              // Extract array if needed (same logic as before)
              if (!Array.isArray(expandedData)) {
                const possibleArrayPaths = ['results', 'data', 'places', 'restaurants', 'businesses'];
                for (const path of possibleArrayPaths) {
                  if (expandedData[path] && Array.isArray(expandedData[path])) {
                    expandedData = expandedData[path];
                    break;
                  }
                }
              }
              
              if (Array.isArray(expandedData)) {
                const expandedCards = await Promise.all(
                  expandedData.map(restaurant => 
                    transformRestaurantToFeedCard(restaurant, userLocation)
                  )
                );
                
                // Filter and combine with existing results
                const newUniqueCards = expandedCards.filter(card => 
                  !filteredRestaurants.some(existing => existing.id === card.id) &&
                  !sessionSeenIds.has(card.id)
                );
                
                additionalRestaurants.push(...newUniqueCards);
                console.log(`✅ Strategy ${strategy.type} added ${newUniqueCards.length} new restaurants`);
              }
            }
          }
          
          // Add new restaurants to the filtered results
          filteredRestaurants = [...filteredRestaurants, ...additionalRestaurants];
          console.log(`🎯 Total expansion added ${additionalRestaurants.length} unique restaurants`);
        } catch (expandError) {
          console.warn('⚠️ Expanded search failed:', expandError);
        }
      }
      
      console.log('🎯 Final restaurant feed results:', {
        totalFromAPI: cachedRestaurants.length,
        afterFiltering: filteredRestaurants.length,
        requesting: count,
        finalCount: Math.min(filteredRestaurants.length, count),
        restaurantNames: filteredRestaurants.slice(0, count).map(r => r.name),
        restaurantCuisines: filteredRestaurants.slice(0, count).map(r => r.cuisine),
        restaurantLocations: filteredRestaurants.slice(0, count).map(r => r.location)
      });
      
      // Return requested count, may be less if many were filtered
      return filteredRestaurants.slice(0, count);

    } catch (error) {
      console.error('💥 Error fetching restaurant cards:', error);
      return [];
    }
  },

  /**
   * Fetch masterbot cards from Supabase
   */
  async fetchMasterbotCards(
    userLocation?: UserLocation,
    count: number = 3,
    _userId?: string
  ): Promise<MasterbotCard[]> {
    try {
      // ✅ FIX: Early return if count is 0 or negative
      if (count <= 0) {
        console.log('⚠️ Masterbot count is 0 or negative, skipping fetch');
        return [];
      }

      // Get a larger random sample to ensure variety across different authors
      // Request more posts and use random sampling
      // ✅ OPTIMIZED: Reduced from 50 to 15 to cut Supabase egress by 70%
      const sampleSize = Math.max(count * 3, 15); // Get at least 15 posts (reduced from 50)
      
      // ✅ FIX: Use random offset instead of toggling created_at order
      // This ensures we get variety from the entire 490-post table
      const totalPostsEstimate = 490; // Approximate total posts
      const maxOffset = Math.max(0, totalPostsEstimate - sampleSize);
      const randomOffset = Math.floor(Math.random() * maxOffset);
      
      const query = supabase
        .from('master_bot_posts')
        .select(`
          *,
          users:master_bot_id (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('is_published', true)
        .range(randomOffset, randomOffset + sampleSize - 1);

      const { data: posts, error } = await query;

      if (error) {
        console.error('❌ Supabase masterbot query error:', error);
        return [];
      }
      
      // Shuffle the results to ensure random selection from different authors
      const shuffledPosts = posts ? [...posts].sort(() => Math.random() - 0.5) : [];

      if (!shuffledPosts || shuffledPosts.length === 0) {
        console.warn('⚠️ No masterbot posts found');
        return [];
      }

      // Track variety for logging
      const uniqueAuthors = new Set(shuffledPosts.map(p => p.master_bot_id)).size;
      console.log(`🎲 Masterbot pool: ${shuffledPosts.length} posts from ${uniqueAuthors} different authors, requesting ${count}`);

      // Transform to MasterbotCard format
      const allPosts = shuffledPosts.map(post => {
        const userData = Array.isArray(post.users) ? post.users[0] : post.users;
        
        // Debug logging for masterbot images
        console.log('🤖 Masterbot post data:', {
          id: post.id,
          image_url: post.image_url,
          avatar_url: userData?.avatar_url,
          username: userData?.username
        });
        
        return transformMasterbotToFeedCard({
          ...post,
          display_name: userData?.display_name || 'Unknown User',
          username: userData?.username || 'unknown',
          avatar_url: userData?.avatar_url || 'https://lgladnskxmbkhcnrsfxv.supabase.co/storage/v1/object/public/master-bot-posts/avatars/jun_zen_minimalist.png'
        });
      });

      // Phase 2: Filter out seen content and apply anti-repetition
      const filteredPosts = this.filterSeenContent(allPosts, 'masterbot');
      
      // Return requested count, may be less if many were filtered
      return filteredPosts.slice(0, count);

    } catch (error) {
      console.error('💥 Error fetching masterbot cards:', error);
      return [];
    }
  },

  /**
   * Fetch recipe cards based on preferences
   */
  async fetchRecipeCards(
    userPreferences?: UserPreferences,
    count: number = 2,
    userId?: string
  ): Promise<RecipeCard[]> {
    try {
      // Determine search query based on preferences or use trending terms
      const searchQuery = this.generateRecipeSearchQuery(userPreferences);
      
      // Phase 3: Use intelligent caching for recipe data
      const preferencesKey = generatePreferencesKey({ 
        query: searchQuery, 
        preferences: userPreferences || {} 
      });
      
      const cachedRecipes = await withCache(
        'recipe',
        [preferencesKey, count, userId || 'anonymous'],
        async () => {
          const result = await SpoonacularService.searchRecipes(searchQuery, count);

          if (!result.success || !result.data?.results) {
            console.error('❌ Recipe search failed:', result.error);
            return [];
          }

          // Transform Spoonacular results to RecipeCard format
          return result.data.results.map(recipe => transformRecipeToFeedCard(recipe));
        }
      );
      
      // Phase 2: Filter out seen content and apply anti-repetition
      const filteredRecipes = this.filterSeenContent(cachedRecipes, 'recipe');
      
      // Return requested count, may be less if many were filtered
      return filteredRecipes.slice(0, count);

    } catch (error) {
      console.error('💥 Error fetching recipe cards:', error);
      return [];
    }
  },

  /**
   * Fetch video cards based on preferences
   */
  async fetchVideoCards(
    userPreferences?: UserPreferences,
    count: number = 2,
    userId?: string
  ): Promise<VideoCard[]> {
    try {
      // Determine search query based on preferences or use trending terms
      const searchQuery = this.generateVideoSearchQuery(userPreferences);
      
      // Phase 3: Use intelligent caching for video data
      const preferencesKey = generatePreferencesKey({ 
        query: searchQuery, 
        preferences: userPreferences || {} 
      });
      
      const cachedVideos = await withCache(
        'video',
        [preferencesKey, count, userId || 'anonymous'],
        async () => {
          const result = await YouTubeService.searchVideos(searchQuery, count);

          if (!result.success || !result.data?.items) {
            console.error('❌ Video search failed:', result.error);
            return [];
          }

          // Transform YouTube results to VideoCard format
          return result.data.items.map(video => transformVideoToFeedCard(video));
        }
      );
      
      // Phase 2: Filter out seen content and apply anti-repetition
      const filteredVideos = this.filterSeenContent(cachedVideos, 'video');
      
      // Return requested count, may be less if many were filtered
      return filteredVideos.slice(0, count);

    } catch (error) {
      console.error('💥 Error fetching video cards:', error);
      return [];
    }
  },

  /**
   * Generate search query for recipes based on user preferences
   * Add variety to avoid cache staleness
   */
  generateRecipeSearchQuery(userPreferences?: UserPreferences): string {
    const defaultQueries = [
      'quick dinner recipes',
      'healthy breakfast',
      'easy lunch ideas',
      'comfort food',
      'vegetarian meals',
      'simple recipes',
      'family dinner ideas',
      'weeknight meals',
      'healthy recipes',
      'easy cooking'
    ];

    if (!userPreferences?.cuisinePreferences?.length) {
      // Rotate through queries to get variety
      const index = Math.floor(Date.now() / (60 * 60 * 1000)) % defaultQueries.length;
      return defaultQueries[index];
    }

    // Use user's preferred cuisines
    const cuisine = userPreferences.cuisinePreferences[
      Math.floor(Math.random() * userPreferences.cuisinePreferences.length)
    ];
    
    // Add variety to query
    const queryTypes = ['recipes', 'dishes', 'meals', 'food ideas'];
    const queryType = queryTypes[Math.floor(Date.now() / (60 * 60 * 1000)) % queryTypes.length];
    
    return `${cuisine} ${queryType}`;
  },

  /**
   * Generate search query for videos based on user preferences
   * Add timestamp to ensure cache variety
   */
  generateVideoSearchQuery(userPreferences?: UserPreferences): string {
    const defaultQueries = [
      'quick cooking tips',
      'food preparation techniques',
      'cooking hacks',
      'recipe tutorial',
      'kitchen skills',
      'cooking techniques',
      'chef tips',
      'food hacks',
      'cooking secrets',
      'culinary tips'
    ];

    if (!userPreferences?.cuisinePreferences?.length) {
      // Rotate through different queries to avoid cache
      const index = Math.floor(Date.now() / (60 * 60 * 1000)) % defaultQueries.length;
      return defaultQueries[index];
    }

    // Use user's preferred cuisines for cooking videos
    const cuisine = userPreferences.cuisinePreferences[
      Math.floor(Math.random() * userPreferences.cuisinePreferences.length)
    ];
    
    // Add variety to avoid same videos
    const queryTypes = ['cooking tutorial', 'recipe guide', 'cooking tips', 'how to cook'];
    const queryType = queryTypes[Math.floor(Date.now() / (60 * 60 * 1000)) % queryTypes.length];
    
    return `${cuisine} ${queryType}`;
  },

  /**
   * Shuffle feed cards for natural experience while maintaining some structure
   */
  /**
   * Phase 2: Enhanced shuffle with diversity enforcement
   * Prevents consecutive cards of same type for natural feed experience
   */
  shuffleFeedCards(cards: FeedCard[]): FeedCard[] {
    if (cards.length <= 1) return [...cards];

    const startTime = Date.now();
    console.log('🎲 Starting diversity-enforced shuffle for', cards.length, 'cards');

    // Group cards by type for strategic placement
    const cardsByType = new Map<string, FeedCard[]>();
    cards.forEach(card => {
      const type = card.type;
      if (!cardsByType.has(type)) {
        cardsByType.set(type, []);
      }
      cardsByType.get(type)!.push(card);
    });

    // Shuffle each type independently first
    cardsByType.forEach((typeCards, type) => {
      this.fisherYatesShuffle(typeCards);
      console.log(`  📦 ${type}: ${typeCards.length} cards shuffled`);
    });

    // Create diverse sequence using round-robin with smart spacing
    const result: FeedCard[] = [];
    const typeIterators = new Map<string, number>();
    const typeNames = Array.from(cardsByType.keys());
    
    // Initialize iterators
    typeNames.forEach(type => typeIterators.set(type, 0));

    // Distribute cards with diversity enforcement
    while (result.length < cards.length) {
      let placed = false;
      
      // Try each type in random order
      const shuffledTypes = this.fisherYatesShuffle([...typeNames]);
      
      for (const type of shuffledTypes) {
        const typeCards = cardsByType.get(type)!;
        const iterator = typeIterators.get(type)!;
        
        // Check if we have cards of this type left
        if (iterator >= typeCards.length) continue;
        
        // Check diversity constraint: avoid consecutive same types
        const lastCard = result[result.length - 1];
        if (lastCard && lastCard.type === type && result.length > 0) {
          // Try to find different type if we're not at the end
          if (this.hasOtherTypesAvailable(cardsByType, typeIterators, type)) {
            continue;
          }
        }
        
        // Place the card
        result.push(typeCards[iterator]);
        typeIterators.set(type, iterator + 1);
        placed = true;
        break;
      }
      
      // Fallback: if no card could be placed due to constraints, 
      // place any available card to avoid infinite loop
      if (!placed) {
        for (const type of typeNames) {
          const typeCards = cardsByType.get(type)!;
          const iterator = typeIterators.get(type)!;
          
          if (iterator < typeCards.length) {
            result.push(typeCards[iterator]);
            typeIterators.set(type, iterator + 1);
            break;
          }
        }
      }
    }

    const shuffleTime = Date.now() - startTime;
    
    // Analyze diversity quality
    const consecutivePairs = this.analyzeConsecutivePairs(result);
    console.log(`🎯 Diversity shuffle completed in ${shuffleTime}ms:`, {
      totalCards: result.length,
      consecutiveSameType: consecutivePairs.consecutive,
      diversityScore: `${consecutivePairs.diversityScore.toFixed(1)}%`,
      typeDistribution: this.getTypeDistribution(result)
    });

    return result;
  },

  /**
   * Basic Fisher-Yates shuffle for arrays
   */
  fisherYatesShuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },

  /**
   * Check if other card types are still available
   */
  hasOtherTypesAvailable(
    cardsByType: Map<string, FeedCard[]>, 
    typeIterators: Map<string, number>, 
    excludeType: string
  ): boolean {
    for (const [type, cards] of cardsByType.entries()) {
      if (type !== excludeType) {
        const iterator = typeIterators.get(type) || 0;
        if (iterator < cards.length) return true;
      }
    }
    return false;
  },

  /**
   * Analyze consecutive pairs for diversity quality metrics
   */
  analyzeConsecutivePairs(cards: FeedCard[]): { consecutive: number, diversityScore: number } {
    let consecutive = 0;
    for (let i = 1; i < cards.length; i++) {
      if (cards[i].type === cards[i-1].type) {
        consecutive++;
      }
    }
    const diversityScore = ((cards.length - 1 - consecutive) / (cards.length - 1)) * 100;
    return { consecutive, diversityScore };
  },

  /**
   * Get type distribution for logging
   */
  getTypeDistribution(cards: FeedCard[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    cards.forEach(card => {
      distribution[card.type] = (distribution[card.type] || 0) + 1;
    });
    return distribution;
  },

  /**
   * Track swipe events for analytics and preference learning
   */
  async trackSwipeEvent(event: SwipeEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_swipe_history')
        .insert({
          user_id: event.userId,
          card_type: event.cardType,
          content_id: event.contentId,
          swipe_direction: event.swipeDirection,
          swipe_action: event.swipeAction,
          session_id: event.sessionId || 'unknown'
        });

      if (error) {
        console.error('❌ Failed to track swipe event:', error);
      } else {
        console.log('📊 Swipe event tracked:', event);
      }
    } catch (error) {
      console.error('💥 Error tracking swipe event:', error);
    }
  }
};

// Utility Functions
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function mapPlaceTypesToCuisine(types: string[]): string {
  const cuisineMap: Record<string, string> = {
    'chinese_restaurant': 'Chinese',
    'italian_restaurant': 'Italian',
    'mexican_restaurant': 'Mexican',
    'japanese_restaurant': 'Japanese',
    'indian_restaurant': 'Indian',
    'french_restaurant': 'French',
    'thai_restaurant': 'Thai',
    'american_restaurant': 'American',
    'mediterranean_restaurant': 'Mediterranean',
    'seafood_restaurant': 'Seafood'
  };

  for (const type of types) {
    if (cuisineMap[type]) {
      return cuisineMap[type];
    }
  }

  return 'International';
}

function mapPriceLevel(priceLevel?: number): string {
  switch (priceLevel) {
    case 1: return '$';
    case 2: return '$$';
    case 3: return '$$$';
    case 4: return '$$$$';
    default: return '$$';
  }
}

// Removed generateGooglePhotosUrl - now using proper getPlaceHeroImage from googlePlacesImages service

function generateRestaurantFallbackImage(cuisine: string): string {
  const fallbackImages: Record<string, string> = {
    'Chinese': 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=800&q=80',
    'Italian': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&q=80',
    'Mexican': 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800&q=80',
    'Japanese': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
    'Indian': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
    'International': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'
  };

  return fallbackImages[cuisine] || fallbackImages['International'];
}

function generateRecipeFallbackImage(_title: string): string {
  return 'https://images.unsplash.com/photo-1556909114-4431c4d79786?w=800&q=80';
}

function determineDifficulty(readyInMinutes: number, spoonacularScore: number): 'Easy' | 'Medium' | 'Hard' {
  if (readyInMinutes <= 20 && spoonacularScore >= 70) return 'Easy';
  if (readyInMinutes <= 45 && spoonacularScore >= 50) return 'Medium';
  return 'Hard';
}

function cleanHtmlSummary(summary: string): string {
  return summary
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, '') // Remove HTML entities
    .slice(0, 100) + '...';
}

function generateRecipeTags(_title: string): string[] {
  const commonTags = ['Quick', 'Healthy', 'Easy', 'Comfort Food', 'Family Friendly'];
  return commonTags.slice(0, Math.floor(Math.random() * 3) + 1);
}

function extractVideoTags(_title: string, _description: string): string[] {
  const commonTags = ['Cooking', 'Tutorial', 'Quick Tips', 'Kitchen Skills', 'Food Prep'];
  return commonTags.slice(0, Math.floor(Math.random() * 3) + 1);
}