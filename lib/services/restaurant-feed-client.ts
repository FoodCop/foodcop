import { supabaseBrowser } from '@/lib/supabase/client';
import { RestaurantCard, FeedFilters, LocationData, DistanceCalculation } from '@/types/restaurant-feed';

/**
 * Restaurant Feed Service - Client Side
 * Handles fetching and managing restaurant recommendations for the feed (client components)
 */
export class RestaurantFeedClientService {
  
  /**
   * Get restaurant feed posts from Master Bots (client-side)
   * Returns cards ready for Tinder-style swiping
   */
  static async getRestaurantFeed(
    limit: number = 30, 
    filters?: FeedFilters,
    userLocation?: LocationData
  ): Promise<RestaurantCard[]> {
    try {
      const supabase = supabaseBrowser();
      
      const { data, error } = await supabase
        .from('public_master_bot_posts')
        .select('*')
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
        bot_username: post.bot_username,
        bot_display_name: post.bot_display_name,
        bot_avatar_url: post.bot_avatar_url,
        
        title: post.title,
        content: post.content,
        content_type: post.content_type || 'review',
        personality_trait: post.personality_trait || 'food enthusiasm',
        
        engagement_likes: post.engagement_likes || 0,
        engagement_comments: post.engagement_comments || 0,
        engagement_shares: post.engagement_shares || 0,
        
        tags: post.tags || [],
        created_at: post.created_at,
        
        // Future geolocation features
        coordinates: undefined,
        distance_from_user: undefined,
        place_id: post.restaurant_id
      })) as RestaurantCard[];
      
    } catch (error) {
      console.error('Failed to fetch restaurant feed:', error);
      return [];
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
          source: 'master_bot_feed'
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
      
      const { error } = await supabase
        .rpc('increment_post_likes', { post_id: postId });

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