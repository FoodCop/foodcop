import { supabaseBrowser } from '@/lib/supabase/client';
import { RestaurantCard, FeedFilters, LocationData, DistanceCalculation } from '@/types/restaurant-feed';

/**
 * Restaurant Feed Service - Client Side
 * Handles fetching and managing restaurant recommendations for the feed (client components)
 * Updated: October 17, 2025 - Personalized feed with lazy loading
 */
export class RestaurantFeedClientService {
  
  /**
   * Get personalized restaurant feed using smart filtering and lazy loading
   * NEW: Uses get_personalized_feed() database function
   */
  static async getPersonalizedFeed(
    userId: string,
    limit: number = 10,
    offset: number = 0,
    userLocation?: LocationData,
    maxDistanceKm: number = 500
  ): Promise<RestaurantCard[]> {
    try {
      const supabase = supabaseBrowser();
      
      const { data, error } = await supabase.rpc('get_personalized_feed', {
        p_user_id: userId,
        p_limit: limit,
        p_offset: offset,
        p_user_lat: userLocation?.lat || null,
        p_user_lng: userLocation?.lng || null,
        p_max_distance_km: maxDistanceKm
      });

      if (error) {
        console.error('Error fetching personalized feed:', error);
        throw error;
      }

      return (data || []).map((post: any) => ({
        id: post.post_id,
        restaurant_name: post.restaurant_name,
        restaurant_location: post.restaurant_location,
        restaurant_rating: parseFloat(post.restaurant_rating || '0'),
        restaurant_price_range: post.restaurant_price_range,
        restaurant_cuisine: post.restaurant_cuisine,
        image_url: post.image_url || '/placeholder-restaurant.jpg',
        
        bot_id: post.master_bot_id,
        bot_username: post.bot_username,
        bot_display_name: post.bot_display_name,
        bot_avatar_url: post.bot_avatar_url,
        
        title: post.title,
        content: post.content,
        content_type: post.content_type,
        personality_trait: post.personality_trait,
        
        engagement_likes: post.engagement_likes,
        engagement_comments: post.engagement_comments,
        engagement_shares: post.engagement_shares,
        
        tags: post.tags || [],
        created_at: post.created_at,
        
        coordinates: post.distance_km ? {
          lat: 0, // We don't expose exact coords in feed for privacy
          lng: 0
        } : undefined,
        distance_from_user: post.distance_km ? `${post.distance_km.toFixed(1)} km` : undefined,
        place_id: post.restaurant_id,
        relevance_score: post.relevance_score
      })) as RestaurantCard[];
      
    } catch (error) {
      console.error('Failed to fetch personalized feed:', error);
      return [];
    }
  }

  /**
   * LEGACY: Get restaurant feed posts from Master Bots (client-side)
   * Keep for backward compatibility
   */
  static async getRestaurantFeed(
    limit: number = 30, 
    filters?: FeedFilters,
    userLocation?: LocationData
  ): Promise<RestaurantCard[]> {
    try {
      const supabase = supabaseBrowser();
      
      const { data, error } = await supabase
        .from('master_bot_posts')
        .select('*, users!master_bot_id(username, display_name, avatar_url)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching restaurant feed:', error);
        throw error;
      }

      // Transform the data to RestaurantCard format
      return (data || []).map((post: any) => ({
        id: post.id,
        restaurant_name: post.restaurant_name || 'Unknown Restaurant',
        restaurant_location: post.restaurant_location || 'Unknown Location',
        restaurant_rating: parseFloat(post.restaurant_rating || '0'),
        restaurant_price_range: post.restaurant_price_range || '$',
        restaurant_cuisine: post.restaurant_cuisine || 'Restaurant',
        image_url: post.image_url || '/placeholder-restaurant.jpg',
        
        bot_id: post.master_bot_id,
        bot_username: post.users?.username,
        bot_display_name: post.users?.display_name,
        bot_avatar_url: post.users?.avatar_url,
        
        title: post.title,
        content: post.content,
        content_type: post.content_type || 'review',
        personality_trait: post.personality_trait || 'food enthusiasm',
        
        engagement_likes: post.engagement_likes || 0,
        engagement_comments: post.engagement_comments || 0,
        engagement_shares: post.engagement_shares || 0,
        
        tags: post.tags || [],
        created_at: post.created_at,
        
        coordinates: post.latitude && post.longitude ? {
          lat: parseFloat(post.latitude),
          lng: parseFloat(post.longitude)
        } : undefined,
        distance_from_user: undefined,
        place_id: post.restaurant_id
      })) as RestaurantCard[];
      
    } catch (error) {
      console.error('Failed to fetch restaurant feed:', error);
      return [];
    }
  }

  /**
   * Record user swipe action
   * NEW: Tracks swipe history to prevent showing already-seen cards
   */
  static async recordSwipe(
    userId: string,
    restaurantCardId: string,
    direction: 'left' | 'right'
  ): Promise<boolean> {
    try {
      const supabase = supabaseBrowser();
      
      const { error } = await supabase
        .from('user_swipe_history')
        .insert({
          user_id: userId,
          restaurant_card_id: restaurantCardId,
          swipe_direction: direction
        });

      if (error) {
        // Ignore duplicate key errors (user already swiped on this card)
        if (error.code === '23505') {
          return true;
        }
        console.error('Error recording swipe:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to record swipe:', error);
      return false;
    }
  }

  /**
   * Save a restaurant to user's favorites (client-side)
   */
  static async saveRestaurant(userId: string, restaurantCardId: string): Promise<boolean> {
    try {
      const supabase = supabaseBrowser();
      
      const { error } = await supabase
        .from('saved_items')
        .insert({
          user_id: userId,
          item_id: restaurantCardId,
          item_type: 'restaurant',
          metadata: { source: 'master_bot_feed' }  // Store source in metadata instead
        });

      if (error) {
        console.error('Error saving restaurant:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to save restaurant:', error);
      return false;
    }
  }

  /**
   * Like a Master Bot post (engagement tracking) - client-side
   */
  static async likePost(postId: string): Promise<boolean> {
    try {
      const supabase = supabaseBrowser();
      
      // Use the correct function name and parameters
      const { error } = await supabase
        .rpc('increment_engagement', { 
          post_id: postId, 
          engagement_type: 'likes' 
        });

      if (error) {
        console.error('Error liking post:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to like post:', error);
      return false;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  static calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): DistanceCalculation {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance_km = R * c;

    let distance_display: string;
    if (distance_km < 1) {
      distance_display = `${Math.round(distance_km * 1000)}m`;
    } else if (distance_km < 10) {
      distance_display = `${distance_km.toFixed(1)} km`;
    } else {
      distance_display = `${Math.round(distance_km)} km`;
    }

    return {
      distance_km,
      distance_display,
      travel_time_walking: this.estimateTravelTime(distance_km, 'walking'),
      travel_time_driving: this.estimateTravelTime(distance_km, 'driving')
    };
  }

  /**
   * Estimate travel time based on distance and mode
   */
  private static estimateTravelTime(distance_km: number, mode: 'walking' | 'driving'): string {
    let speed_kmh: number;
    
    switch (mode) {
      case 'walking':
        speed_kmh = 5; // Average walking speed
        break;
      case 'driving':
        speed_kmh = 30; // Average city driving speed
        break;
      default:
        speed_kmh = 5;
    }
    
    const time_hours = distance_km / speed_kmh;
    const time_minutes = Math.round(time_hours * 60);
    
    if (time_minutes < 60) {
      return `${time_minutes} min`;
    } else {
      const hours = Math.floor(time_minutes / 60);
      const minutes = time_minutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }

  /**
   * Filter restaurants by location and other criteria (client-side)
   */
  static async getFilteredRestaurantFeed(
    filters: FeedFilters,
    userLocation?: LocationData,
    limit: number = 30
  ): Promise<RestaurantCard[]> {
    const restaurants = await this.getRestaurantFeed(limit * 2); // Get more to filter

    let filtered = restaurants;

    // Filter by cuisine types
    if (filters.cuisine_types && filters.cuisine_types.length > 0) {
      filtered = filtered.filter(r => 
        filters.cuisine_types!.some(cuisine => 
          r.restaurant_cuisine.toLowerCase().includes(cuisine.toLowerCase())
        )
      );
    }

    // Filter by price range
    if (filters.price_ranges && filters.price_ranges.length > 0) {
      filtered = filtered.filter(r => 
        filters.price_ranges!.includes(r.restaurant_price_range)
      );
    }

    // Filter by rating
    if (filters.rating_min) {
      filtered = filtered.filter(r => r.restaurant_rating >= filters.rating_min!);
    }

    // Filter by bot preferences
    if (filters.bot_preferences && filters.bot_preferences.length > 0) {
      filtered = filtered.filter(r => 
        filters.bot_preferences!.includes(r.bot_username)
      );
    }

    // Add distance calculations if user location is provided
    if (userLocation && filters.location) {
      filtered = filtered.map(restaurant => {
        // For now, use random coordinates as we don't have real restaurant coordinates
        // TODO: Integrate with Google Places API to get real coordinates
        const restaurantLat = userLocation.lat + (Math.random() - 0.5) * 0.1;
        const restaurantLng = userLocation.lng + (Math.random() - 0.5) * 0.1;
        
        const distance = this.calculateDistance(
          userLocation.lat,
          userLocation.lng,
          restaurantLat,
          restaurantLng
        );

        return {
          ...restaurant,
          coordinates: { lat: restaurantLat, lng: restaurantLng },
          distance_from_user: distance.distance_display
        };
      });

      // Filter by distance if specified
      if (filters.distance_max) {
        filtered = filtered.filter(r => {
          if (r.coordinates && userLocation) {
            const distance = this.calculateDistance(
              userLocation.lat,
              userLocation.lng,
              r.coordinates.lat,
              r.coordinates.lng
            );
            return distance.distance_km <= filters.distance_max!;
          }
          return true;
        });
      }

      // Sort by distance
      filtered.sort((a, b) => {
        if (!a.coordinates || !b.coordinates || !userLocation) return 0;
        
        const distanceA = this.calculateDistance(
          userLocation.lat, userLocation.lng, 
          a.coordinates.lat, a.coordinates.lng
        );
        const distanceB = this.calculateDistance(
          userLocation.lat, userLocation.lng, 
          b.coordinates.lat, b.coordinates.lng
        );
        
        return distanceA.distance_km - distanceB.distance_km;
      });
    }

    return filtered.slice(0, limit);
  }
}