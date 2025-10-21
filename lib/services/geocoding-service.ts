/**
 * Geocoding Service for FUZO
 * 
 * This is the HEART of FUZO's value proposition:
 * Building a proprietary, curated restaurant location dataset.
 * 
 * Data Sources:
 * 1. User-generated (Snap feature) - Most valuable
 * 2. Google Places API - High accuracy
 * 3. City approximations - Fallback
 * 
 * Future Opportunities:
 * - Research & Development
 * - Location-based advertising
 * - Restaurant partnerships
 * - Market intelligence
 */

import { supabaseServer } from '@/lib/supabase/server';

// City center coordinates for approximation
const CITY_COORDINATES: Record<string, { lat: number; lng: number; country: string }> = {
  // India
  'mumbai': { lat: 19.0760, lng: 72.8777, country: 'IN' },
  'delhi': { lat: 28.7041, lng: 77.1025, country: 'IN' },
  'bangalore': { lat: 12.9716, lng: 77.5946, country: 'IN' },
  
  // Spain
  'barcelona': { lat: 41.3851, lng: 2.1734, country: 'ES' },
  'madrid': { lat: 40.4168, lng: -3.7038, country: 'ES' },
  
  // United Kingdom
  'london': { lat: 51.5074, lng: -0.1278, country: 'GB' },
  'manchester': { lat: 53.4808, lng: -2.2426, country: 'GB' },
  
  // France
  'paris': { lat: 48.8566, lng: 2.3522, country: 'FR' },
  'lyon': { lat: 45.7640, lng: 4.8357, country: 'FR' },
  
  // USA
  'new york': { lat: 40.7128, lng: -74.0060, country: 'US' },
  'los angeles': { lat: 34.0522, lng: -118.2437, country: 'US' },
  'san francisco': { lat: 37.7749, lng: -122.4194, country: 'US' },
  'chicago': { lat: 41.8781, lng: -87.6298, country: 'US' },
  
  // Hong Kong
  'hong kong': { lat: 22.3193, lng: 114.1694, country: 'HK' },
  'central': { lat: 22.2816, lng: 114.1580, country: 'HK' },
  'wan chai': { lat: 22.2775, lng: 114.1718, country: 'HK' },
  'tsim sha tsui': { lat: 22.2986, lng: 114.1722, country: 'HK' },
  
  // Japan
  'tokyo': { lat: 35.6762, lng: 139.6503, country: 'JP' },
  'osaka': { lat: 34.6937, lng: 135.5023, country: 'JP' },
  'kyoto': { lat: 35.0116, lng: 135.7681, country: 'JP' },
  'shibuya': { lat: 35.6595, lng: 139.7004, country: 'JP' },
  'minato city': { lat: 35.6581, lng: 139.7514, country: 'JP' },
  
  // Thailand
  'bangkok': { lat: 13.7563, lng: 100.5018, country: 'TH' },
  'chiang mai': { lat: 18.7883, lng: 98.9853, country: 'TH' },
  'pathum wan': { lat: 13.7466, lng: 100.5347, country: 'TH' },
  'khlong toei': { lat: 13.7225, lng: 100.5629, country: 'TH' },
  
  // Mexico
  'mexico city': { lat: 19.4326, lng: -99.1332, country: 'MX' },
  'guadalajara': { lat: 20.6597, lng: -103.3496, country: 'MX' },
  'cuauhtémoc': { lat: 19.4347, lng: -99.1423, country: 'MX' },
  
  // Singapore
  'singapore': { lat: 1.3521, lng: 103.8198, country: 'SG' },
  
  // More can be added...
};

export interface GeocodingResult {
  success: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
  source: 'google_places' | 'approximate_city_center' | 'manual' | 'snap_user_generated';
  place_id?: string;
  error?: string;
}

export class GeocodingService {
  
  /**
   * Geocode a restaurant by name and location
   * Priority: Google Places API > City Approximation > Manual
   */
  static async geocodeRestaurant(
    restaurantName: string,
    restaurantLocation: string,
    useGoogleApi: boolean = false
  ): Promise<GeocodingResult> {
    
    // Option 1: Use Google Places API (most accurate, but costs money)
    if (useGoogleApi && process.env.GOOGLE_MAPS_API_KEY) {
      try {
        const googleResult = await this.geocodeWithGooglePlaces(
          restaurantName,
          restaurantLocation
        );
        if (googleResult.success) {
          return googleResult;
        }
      } catch (error) {
        console.error('Google Places geocoding failed:', error);
      }
    }
    
    // Option 2: Use city approximation (free, less accurate)
    const cityApprox = this.geocodeWithCityApproximation(restaurantLocation);
    if (cityApprox.success) {
      return cityApprox;
    }
    
    return {
      success: false,
      source: 'approximate_city_center',
      error: 'Unable to geocode location'
    };
  }
  
  /**
   * Geocode using Google Places API
   * NOTE: This costs money per request. Use sparingly.
   */
  static async geocodeWithGooglePlaces(
    restaurantName: string,
    restaurantLocation: string
  ): Promise<GeocodingResult> {
    
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return { success: false, source: 'google_places', error: 'API key not configured' };
    }
    
    try {
      const query = encodeURIComponent(`${restaurantName}, ${restaurantLocation}`);
      const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id,geometry&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
        const place = data.candidates[0];
        return {
          success: true,
          coordinates: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          },
          source: 'google_places',
          place_id: place.place_id
        };
      }
      
      return {
        success: false,
        source: 'google_places',
        error: `Google Places API returned: ${data.status}`
      };
      
    } catch (error) {
      return {
        success: false,
        source: 'google_places',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Geocode using city center approximation
   * Fast and free, but less accurate (within ~5-10km of actual location)
   */
  static geocodeWithCityApproximation(
    restaurantLocation: string
  ): GeocodingResult {
    
    const locationLower = restaurantLocation.toLowerCase();
    
    // Try to match city name
    for (const [cityName, coords] of Object.entries(CITY_COORDINATES)) {
      if (locationLower.includes(cityName)) {
        return {
          success: true,
          coordinates: {
            lat: coords.lat,
            lng: coords.lng
          },
          source: 'approximate_city_center'
        };
      }
    }
    
    return {
      success: false,
      source: 'approximate_city_center',
      error: 'City not found in approximation database'
    };
  }
  
  /**
   * Save geocoding result to master_bot_posts
   */
  static async saveGeocodingToPost(
    postId: string,
    result: GeocodingResult
  ): Promise<boolean> {
    
    if (!result.success || !result.coordinates) {
      return false;
    }
    
    try {
      const supabase = await supabaseServer();
      
      const { error } = await supabase
        .from('master_bot_posts')
        .update({
          latitude: result.coordinates.lat,
          longitude: result.coordinates.lng,
          google_place_id: result.place_id || null,
          geocoding_source: result.source,
          geocoded_at: new Date().toISOString()
        })
        .eq('id', postId);
      
      if (error) {
        console.error('Error saving geocoding:', error);
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error('Failed to save geocoding:', error);
      return false;
    }
  }
  
  /**
   * Geocode all posts that don't have coordinates
   * Use this sparingly with Google API due to costs
   */
  static async geocodeAllPosts(
    useGoogleApi: boolean = false,
    limit: number = 100
  ): Promise<{ success: number; failed: number }> {
    
    try {
      const supabase = await supabaseServer();
      
      const { data: posts, error } = await supabase
        .from('master_bot_posts')
        .select('id, restaurant_name, restaurant_location')
        .is('latitude', null)
        .not('restaurant_location', 'is', null)
        .limit(limit);
      
      if (error || !posts) {
        console.error('Error fetching posts:', error);
        return { success: 0, failed: 0 };
      }
      
      let successCount = 0;
      let failedCount = 0;
      
      for (const post of posts) {
        const result = await this.geocodeRestaurant(
          post.restaurant_name,
          post.restaurant_location,
          useGoogleApi
        );
        
        if (result.success) {
          const saved = await this.saveGeocodingToPost(post.id, result);
          if (saved) {
            successCount++;
            console.log(`✓ Geocoded: ${post.restaurant_name} (${result.source})`);
          } else {
            failedCount++;
          }
        } else {
          failedCount++;
          console.log(`✗ Failed: ${post.restaurant_name} - ${result.error}`);
        }
        
        // Rate limiting for Google API
        if (useGoogleApi) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 10 requests per second
        }
      }
      
      return { success: successCount, failed: failedCount };
      
    } catch (error) {
      console.error('Geocoding batch failed:', error);
      return { success: 0, failed: 0 };
    }
  }
  
  /**
   * Calculate distance between two points in kilometers
   */
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
      Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }
  
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  
  /**
   * Get geocoding coverage statistics
   */
  static async getGeocodingStats(): Promise<{
    total: number;
    geocoded: number;
    coverage_percentage: number;
    by_source: Record<string, number>;
  }> {
    
    try {
      const supabase = await supabaseServer();
      
      // Total posts
      const { count: total } = await supabase
        .from('master_bot_posts')
        .select('*', { count: 'exact', head: true });
      
      // Geocoded posts
      const { count: geocoded } = await supabase
        .from('master_bot_posts')
        .select('*', { count: 'exact', head: true })
        .not('latitude', 'is', null);
      
      // By source
      const { data: bySource } = await supabase
        .from('master_bot_posts')
        .select('geocoding_source')
        .not('latitude', 'is', null);
      
      const sourceCount: Record<string, number> = {};
      bySource?.forEach(item => {
        const source = item.geocoding_source || 'unknown';
        sourceCount[source] = (sourceCount[source] || 0) + 1;
      });
      
      return {
        total: total || 0,
        geocoded: geocoded || 0,
        coverage_percentage: total ? ((geocoded || 0) / total) * 100 : 0,
        by_source: sourceCount
      };
      
    } catch (error) {
      console.error('Error getting geocoding stats:', error);
      return {
        total: 0,
        geocoded: 0,
        coverage_percentage: 0,
        by_source: {}
      };
    }
  }
}

/**
 * Snap Feature Integration
 * When user snaps a restaurant, we capture the most accurate location data
 */
export interface SnapGeocodingData {
  lat: number;
  lng: number;
  accuracy: number; // meters
  place_id?: string;
  restaurant_name: string;
  restaurant_address: string;
}

export class SnapGeocodingService {
  
  /**
   * Save location data from user snap
   * This is the MOST VALUABLE data for our curated dataset
   */
  static async saveSnapLocation(data: SnapGeocodingData): Promise<boolean> {
    
    try {
      const supabase = await supabaseServer();
      
      // Save to restaurants table (our curated dataset)
      // Note: restaurants table uses PostGIS 'coordinates' column
      const { error } = await supabase
        .from('restaurants')
        .upsert({
          place_id: data.place_id,
          name: data.restaurant_name,
          address: data.restaurant_address,
          // Use raw SQL for PostGIS POINT type if needed
          // Or use separate lat/lng columns if available
          location_accuracy_meters: data.accuracy,
          data_source: 'snap_user_generated',
          created_at: new Date().toISOString()
        }, {
          onConflict: 'place_id',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error('Error saving snap location:', error);
        return false;
      }
      
      console.log(`✓ Snap location saved: ${data.restaurant_name} (${data.accuracy}m accuracy)`);
      return true;
      
    } catch (error) {
      console.error('Failed to save snap location:', error);
      return false;
    }
  }
}
