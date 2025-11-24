import { supabase } from './supabase';
import { backendService } from './backendService';
import type { SavedItem } from '../types/plate';

// Dashboard data types
export interface DashboardCrew {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  username?: string;
}

export interface DashboardRecipe {
  id: string;
  name: string;
  time: string;
  image: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardRestaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  distance: string;
  image: string;
  place_id?: string;
  lat?: number;
  lng?: number;
}

export interface DashboardMasterBotPost {
  id: string;
  masterbot_name: string;
  masterbot_avatar: string;
  title: string;
  content: string;
  image_url: string;
  restaurant_name?: string;
  restaurant_cuisine?: string;
  tags?: string[];
  engagement_likes: number;
}

export interface UserPreferences {
  dietary_preferences?: string[];
  cuisine_preferences?: string[];
}

export interface DashboardData {
  crew: DashboardCrew[];
  savedRecipes: DashboardRecipe[];
  restaurantRecommendations: DashboardRestaurant[];
  masterbotPosts: DashboardMasterBotPost[];
}

/**
 * Dashboard Service - Fetches all dashboard data with intelligent filtering
 */
export class DashboardService {
  /**
   * Fetch user's crew (accepted friends)
   */
  static async fetchCrew(userId: string): Promise<DashboardCrew[]> {
    try {
      console.log('🔍 Fetching crew for user:', userId);

      // Get accepted friend requests where user is either requester or requested
      const { data: friendships, error } = await supabase
        .from('friend_requests')
        .select(`
          id,
          requester_id,
          requested_id,
          requester:users!friend_requests_requester_id_fkey(id, display_name, first_name, last_name, username, avatar_url, email),
          requested:users!friend_requests_requested_id_fkey(id, display_name, first_name, last_name, username, avatar_url, email)
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},requested_id.eq.${userId}`)
        .limit(6);

      if (error) {
        console.error('❌ Error fetching crew:', error);
        return [];
      }

      // Map friends to DashboardCrew format
      const crew: DashboardCrew[] = (friendships || []).map((friendship: any) => {
        // Get the friend (not the current user)
        const friend = friendship.requester_id === userId 
          ? friendship.requested 
          : friendship.requester;

        if (!friend) return null;

        const displayName = friend.display_name || 
                          friend.first_name || 
                          friend.username || 
                          friend.email?.split('@')[0] || 
                          'Friend';
        
        const initials = displayName
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return {
          id: friend.id,
          name: displayName,
          avatar: friend.avatar_url || '',
          initials,
          username: friend.username
        };
      }).filter(Boolean) as DashboardCrew[];

      console.log('✅ Fetched crew:', crew.length);
      return crew;
    } catch (error) {
      console.error('❌ Unexpected error fetching crew:', error);
      return [];
    }
  }

  /**
   * Fetch user's saved recipes (limit 4 for dashboard)
   */
  static async fetchSavedRecipes(userId: string): Promise<DashboardRecipe[]> {
    try {
      console.log('🔍 Fetching saved recipes for user:', userId);

      const { data: savedItems, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', 'recipe')
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) {
        console.error('❌ Error fetching saved recipes:', error);
        return [];
      }

      const recipes: DashboardRecipe[] = (savedItems || []).map((item: SavedItem) => {
        const metadata = item.metadata || {};
        const title = (metadata.title as string) || (metadata.name as string) || 'Untitled Recipe';
        const minutes = metadata.readyInMinutes as number | undefined;
        const imageUrl = (metadata.image as string) || (metadata.image_url as string) || '/placeholder-recipe.jpg';
        
        return {
          id: item.item_id,
          name: title,
          time: minutes ? `${minutes} min` : 'N/A',
          image: imageUrl,
          metadata
        };
      });

      console.log('✅ Fetched saved recipes:', recipes.length);
      return recipes;
    } catch (error) {
      console.error('❌ Unexpected error fetching saved recipes:', error);
      return [];
    }
  }

  /**
   * Fetch user preferences from profile
   */
  static async fetchUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('dietary_preferences, cuisine_preferences')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching preferences:', error);
        return {};
      }

      return {
        dietary_preferences: user?.dietary_preferences || [],
        cuisine_preferences: user?.cuisine_preferences || []
      };
    } catch (error) {
      console.error('❌ Unexpected error fetching preferences:', error);
      return {};
    }
  }

  /**
   * Fetch restaurant recommendations based on user location and preferences
   * Uses OpenAI-powered filtering via backend
   */
  static async fetchRestaurantRecommendations(
    userLocation: { lat: number; lng: number },
    preferences: UserPreferences
  ): Promise<DashboardRestaurant[]> {
    try {
      console.log('🔍 Fetching restaurant recommendations:', { userLocation, preferences });

      // Fetch nearby restaurants from Google Places
      const response = await backendService.searchNearbyPlaces(
        userLocation,
        5000, // 5km radius
        'restaurant'
      );

      if (!response.success || !response.data?.results) {
        console.error('❌ Failed to fetch restaurants:', response.error);
        return [];
      }

      let restaurants: DashboardRestaurant[] = response.data.results
        .map((place: any) => ({
          id: place.place_id,
          name: place.name,
          cuisine: place.types?.[0]?.replace('_', ' ') || 'Restaurant',
          rating: place.rating || 0,
          distance: this.calculateDistance(
            userLocation.lat,
            userLocation.lng,
            place.geometry.location.lat,
            place.geometry.location.lng
          ),
          image: place.photos?.[0] 
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
            : '/placeholder-restaurant.jpg',
          place_id: place.place_id,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        }))
        .filter((r: DashboardRestaurant) => r.rating >= 4.0); // Only show highly rated

      // Filter by cuisine preferences if available
      if (preferences.cuisine_preferences && preferences.cuisine_preferences.length > 0) {
        const preferredCuisines = preferences.cuisine_preferences.map(c => c.toLowerCase());
        restaurants = restaurants.filter(r => {
          const restaurantCuisine = r.cuisine.toLowerCase();
          return preferredCuisines.some(pref => restaurantCuisine.includes(pref));
        });
      }

      // Shuffle restaurants on first load
      const { shuffleArray, hasRecipesBeenShuffled, markRecipesAsShuffled } = await import('../utils/preferenceMapper');
      if (!hasRecipesBeenShuffled()) {
        restaurants = shuffleArray(restaurants);
        markRecipesAsShuffled();
      }

      // Limit to 6 for dashboard after filtering and shuffling
      restaurants = restaurants.slice(0, 6);

      console.log('✅ Fetched restaurant recommendations:', restaurants.length);
      return restaurants;
    } catch (error) {
      console.error('❌ Unexpected error fetching restaurants:', error);
      return [];
    }
  }

  /**
   * Fetch MasterBot posts for dashboard
   * Shows diverse, engaging content
   */
  static async fetchMasterBotPosts(limit: number = 4): Promise<DashboardMasterBotPost[]> {
    try {
      console.log('🔍 Fetching MasterBot posts, limit:', limit);

      const { data: posts, error } = await supabase
        .from('master_bot_posts')
        .select(`
          id,
          title,
          content,
          image_url,
          restaurant_name,
          restaurant_cuisine,
          tags,
          engagement_likes,
          master_bot_id,
          masterbot:users!master_bot_posts_master_bot_id_fkey(display_name, avatar_url)
        `)
        .eq('is_published', true)
        .not('image_url', 'is', null)
        .order('engagement_likes', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching MasterBot posts:', error);
        return [];
      }

      let masterbotPosts: DashboardMasterBotPost[] = (posts || []).map((post: any) => ({
        id: post.id,
        masterbot_name: post.masterbot?.display_name || 'Food Bot',
        masterbot_avatar: post.masterbot?.avatar_url || '',
        title: post.title,
        content: post.content,
        image_url: post.image_url,
        restaurant_name: post.restaurant_name,
        restaurant_cuisine: post.restaurant_cuisine,
        tags: post.tags || [],
        engagement_likes: post.engagement_likes || 0
      }));

      // Shuffle masterbot posts on first load
      const { shuffleArray, hasRecipesBeenShuffled, markRecipesAsShuffled } = await import('../utils/preferenceMapper');
      if (!hasRecipesBeenShuffled()) {
        masterbotPosts = shuffleArray(masterbotPosts);
        markRecipesAsShuffled();
      }

      console.log('✅ Fetched MasterBot posts:', masterbotPosts.length);
      return masterbotPosts;
    } catch (error) {
      console.error('❌ Unexpected error fetching MasterBot posts:', error);
      return [];
    }
  }

  /**
   * Fetch all dashboard data at once
   */
  static async fetchDashboardData(
    userId: string,
    userLocation?: { lat: number; lng: number }
  ): Promise<DashboardData> {
    try {
      console.log('🚀 Fetching complete dashboard data for user:', userId);

      // Fetch user preferences first
      const preferences = await this.fetchUserPreferences(userId);

      // Fetch all data in parallel
      const [crew, savedRecipes, masterbotPosts, restaurantRecommendations] = await Promise.all([
        this.fetchCrew(userId),
        this.fetchSavedRecipes(userId),
        this.fetchMasterBotPosts(4),
        userLocation 
          ? this.fetchRestaurantRecommendations(userLocation, preferences)
          : Promise.resolve([])
      ]);

      console.log('✅ Dashboard data fetched successfully');

      return {
        crew,
        savedRecipes,
        restaurantRecommendations,
        masterbotPosts
      };
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      return {
        crew: [],
        savedRecipes: [],
        restaurantRecommendations: [],
        masterbotPosts: []
      };
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): string {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export default DashboardService;
