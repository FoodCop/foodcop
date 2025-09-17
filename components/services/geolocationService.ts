import { backendService } from './backendService';
import { API_CONFIG } from '../config/apiConfig';

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy?: number;
  city?: string;
  region?: string;
  country?: string;
  method: 'browser' | 'ip_geolocation' | 'default';
  timestamp: string;
  fallback?: boolean;
}

export interface NearbyRestaurantsResult {
  restaurants: any[];
  location: {
    latitude: number;
    longitude: number;
  };
  searchRadius: number;
  totalResults: number;
  method: string;
  timestamp: string;
}

class GeolocationService {
  private currentLocation: GeolocationResult | null = null;
  private locationCacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastLocationTime: number = 0;

  /**
   * Get the user's current location using multiple methods:
   * 1. Browser geolocation API (most accurate)
   * 2. IP-based geolocation via backend (fallback)
   * 3. Default location (final fallback)
   */
  async getCurrentLocation(useCache: boolean = true): Promise<GeolocationResult> {
    console.log('📍 GeolocationService: Getting current location...');
    console.log('🔧 Debug info:', {
      useCache,
      hasCachedLocation: !!this.currentLocation,
      cacheValid: this.isLocationCacheValid(),
      cacheAge: this.currentLocation ? Date.now() - this.lastLocationTime : 'no cache',
      environment: {
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        userAgent: navigator.userAgent.substring(0, 100)
      }
    });
    
    // Return cached location if valid and recent
    if (useCache && this.currentLocation && this.isLocationCacheValid()) {
      console.log('✅ Using cached location:', {
        method: this.currentLocation.method,
        city: this.currentLocation.city,
        coords: `${this.currentLocation.latitude}, ${this.currentLocation.longitude}`
      });
      return this.currentLocation;
    }

    console.log('🎯 Starting location detection sequence...');

    // Try browser geolocation first
    try {
      console.log('🌐 Step 1: Attempting browser geolocation...');
      const browserLocation = await this.getBrowserLocation();
      if (browserLocation) {
        this.currentLocation = browserLocation;
        this.lastLocationTime = Date.now();
        console.log('✅ Step 1 SUCCESS: Browser geolocation:', {
          city: 'GPS Location',
          coords: `${browserLocation.latitude}, ${browserLocation.longitude}`,
          accuracy: browserLocation.accuracy
        });
        return browserLocation;
      } else {
        console.log('⚠️ Step 1 FAILED: Browser geolocation unavailable');
      }
    } catch (error) {
      console.log('❌ Step 1 ERROR: Browser geolocation exception:', error);
    }

    // Try IP-based geolocation as fallback
    try {
      console.log('🌐 Step 2: Attempting IP-based geolocation...');
      const ipLocation = await this.getIPBasedLocation();
      if (ipLocation && ipLocation.latitude !== 0 && ipLocation.longitude !== 0) {
        this.currentLocation = ipLocation;
        this.lastLocationTime = Date.now();
        console.log('✅ Step 2 SUCCESS: IP geolocation:', {
          city: `${ipLocation.city}, ${ipLocation.region}`,
          coords: `${ipLocation.latitude}, ${ipLocation.longitude}`,
          method: ipLocation.method
        });
        return ipLocation;
      } else {
        console.log('⚠️ Step 2 FAILED: IP geolocation returned invalid coordinates');
      }
    } catch (error) {
      console.log('❌ Step 2 ERROR: IP geolocation exception:', error);
    }

    // Final fallback to default location
    console.log('🏁 Step 3: Using default location fallback...');
    const defaultLocation: GeolocationResult = {
      latitude: API_CONFIG.DEFAULT_LOCATION.lat,
      longitude: API_CONFIG.DEFAULT_LOCATION.lng,
      city: 'San Francisco',
      region: 'California',
      country: 'United States',
      method: 'default',
      timestamp: new Date().toISOString(),
      fallback: true
    };

    this.currentLocation = defaultLocation;
    this.lastLocationTime = Date.now();
    console.log('📍 Step 3 COMPLETE: Using default location (San Francisco)');
    console.log('💡 To get your actual location:');
    console.log('   1. Enable browser location permissions');
    console.log('   2. Ensure you\'re on HTTPS (or localhost)');
    console.log('   3. Check if you\'re behind a VPN or proxy');
    
    return defaultLocation;
  }

  /**
   * Manual location testing function for debugging
   */
  async testLocationServices(): Promise<{
    browser: GeolocationResult | null;
    ip: GeolocationResult | null;
    backendAvailable: boolean;
  }> {
    console.log('🧪 Testing all location services...');
    
    const results = {
      browser: null as GeolocationResult | null,
      ip: null as GeolocationResult | null,
      backendAvailable: false
    };

    // Test browser geolocation
    try {
      results.browser = await this.getBrowserLocation();
      console.log('🌐 Browser test result:', results.browser ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      console.log('🌐 Browser test error:', error);
    }

    // Test IP geolocation
    try {
      results.ip = await this.getIPBasedLocation();
      console.log('🌍 IP test result:', results.ip ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      console.log('🌍 IP test error:', error);
    }

    // Test backend availability
    try {
      const backendResponse = await backendService.healthCheck();
      results.backendAvailable = backendResponse.success;
      console.log('🔗 Backend test result:', results.backendAvailable ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      console.log('🔗 Backend test error:', error);
    }

    console.log('🧪 Location services test complete:', results);
    return results;
  }

  /**
   * Get nearby restaurants based on current location
   */
  async getNearbyRestaurants(
    radius: number = 5000,
    forceRefreshLocation: boolean = false
  ): Promise<NearbyRestaurantsResult> {
    console.log('🔍 GeolocationService: Getting nearby restaurants...');
    
    // Get current location
    const location = await this.getCurrentLocation(!forceRefreshLocation);
    
    try {
      // Call the backend geolocation endpoint
      const response = await backendService.getNearbyRestaurantsByLocation(
        location.latitude,
        location.longitude,
        radius
      );

      if (!response.success) {
        throw new Error(response.error || 'Backend request failed');
      }

      const data = response.data;
      
      console.log('✅ Nearby restaurants found:', {
        count: data.results?.length || 0,
        location: data.search_location,
        radius: data.search_radius
      });

      return {
        restaurants: data.results || [],
        location: {
          latitude: data.search_location?.lat || data.location?.lat || location.latitude,
          longitude: data.search_location?.lng || data.location?.lng || location.longitude
        },
        searchRadius: data.search_radius || data.radius || radius,
        totalResults: data.results?.length || 0,
        method: 'google_places',
        timestamp: data.timestamp || new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Failed to get nearby restaurants:', error);
      
      // Return mock data as fallback
      return this.getMockNearbyRestaurants(location);
    }
  }

  /**
   * Search restaurants by location and query
   */
  async searchRestaurantsByLocation(
    query: string,
    radius: number = 25000
  ): Promise<NearbyRestaurantsResult> {
    console.log('🔍 GeolocationService: Searching restaurants by location and query...');
    
    const location = await this.getCurrentLocation();
    
    try {
      // Use the existing text search endpoint but with current location
      const response = await backendService.searchPlacesByText(query, {
        lat: location.latitude,
        lng: location.longitude
      });

      if (!response.success) {
        throw new Error(response.error || 'Search failed');
      }

      const data = response.data;
      
      console.log('✅ Location-based search results:', {
        query,
        count: data.results?.length || 0,
        location: { lat: location.latitude, lng: location.longitude }
      });

      return {
        restaurants: data.results || [],
        location: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        searchRadius: radius,
        totalResults: data.results?.length || 0,
        method: 'text_search_with_location',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Location-based search failed:', error);
      return this.getMockNearbyRestaurants(location);
    }
  }

  /**
   * Get user's location using browser geolocation API
   */
  private getBrowserLocation(): Promise<GeolocationResult | null> {
    return new Promise((resolve) => {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        console.log('🚫 Browser geolocation not supported');
        resolve(null);
        return;
      }

      // Check if we're in a secure context (required for geolocation in modern browsers)
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      console.log('🔒 Secure context check:', { 
        protocol: window.location.protocol, 
        hostname: window.location.hostname, 
        isSecure 
      });

      // Check if we're in Figma Make environment
      const isFigmaMake = window.location.hostname.includes('figma') || 
                          window.parent !== window || 
                          window.location.hostname.includes('webcontainer');
      
      console.log('🎨 Environment check:', {
        hostname: window.location.hostname,
        isFigmaMake,
        parentWindow: window.parent !== window,
        userAgent: navigator.userAgent.substring(0, 100)
      });

      if (isFigmaMake) {
        console.log('⚠️ Figma Make detected - browser geolocation may not work in iframe environment');
      }

      console.log('🌐 Requesting browser geolocation with enhanced debugging...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result: GeolocationResult = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            method: 'browser',
            timestamp: new Date().toISOString()
          };
          
          console.log('✅ Browser geolocation success:', {
            coords: `${result.latitude}, ${result.longitude}`,
            accuracy: `${result.accuracy}m`,
            timestamp: result.timestamp
          });
          
          resolve(result);
        },
        (error) => {
          let errorMessage = 'Unknown geolocation error';
          let recommendation = '';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              recommendation = 'Click the location icon in your browser address bar to allow location access';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              recommendation = 'GPS/network location services may be disabled';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              recommendation = 'Try again or check your network connection';
              break;
          }
          
          console.log('⚠️ Browser geolocation failed:', {
            code: error.code,
            message: errorMessage,
            recommendation,
            isFigmaMake,
            isSecure
          });
          
          resolve(null);
        },
        {
          enableHighAccuracy: false, // Use false for better compatibility in web environments
          timeout: 15000, // Increased timeout to 15 seconds
          maximumAge: 10 * 60 * 1000 // Accept cached position up to 10 minutes old
        }
      );
    });
  }

  /**
   * Get location using IP-based geolocation via backend
   */
  private async getIPBasedLocation(): Promise<GeolocationResult | null> {
    try {
      console.log('🌐 Attempting IP-based geolocation via Supabase backend...');
      
      // Make request through backend service
      const response = await backendService.getIPGeolocation();

      if (!response.success) {
        console.warn('⚠️ Backend IP geolocation failed:', response.error);
        
        // Try direct fallback to a different IP service
        return await this.tryDirectIPGeolocation();
      }

      const data = response.data;
      
      // Validate the response data
      if (!data.latitude || !data.longitude) {
        console.warn('⚠️ Invalid IP geolocation response:', data);
        return await this.tryDirectIPGeolocation();
      }
      
      const result: GeolocationResult = {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        city: data.city,
        region: data.region,
        country: data.country,
        method: 'ip_geolocation',
        timestamp: new Date().toISOString(),
        fallback: data.fallback || false
      };

      console.log('✅ Backend IP geolocation success:', {
        location: `${data.city}, ${data.region}, ${data.country}`,
        coords: `${result.latitude}, ${result.longitude}`,
        backendMethod: data.method || 'backend_ip'
      });

      return result;

    } catch (error) {
      console.error('❌ Backend IP geolocation error:', error);
      
      // Try direct IP geolocation as backup
      return await this.tryDirectIPGeolocation();
    }
  }

  /**
   * Direct IP geolocation attempt as backup
   */
  private async tryDirectIPGeolocation(): Promise<GeolocationResult | null> {
    try {
      console.log('🔄 Trying direct IP geolocation as backup...');
      
      // Use a different free IP geolocation service
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: {
          'User-Agent': 'FUZO-App/1.0'
        }
      });

      if (!response.ok) {
        console.warn('⚠️ Direct IP geolocation service unavailable');
        return null;
      }

      const data = await response.json();
      
      if (data.error) {
        console.warn('⚠️ Direct IP geolocation error:', data.reason);
        return null;
      }

      if (!data.latitude || !data.longitude) {
        console.warn('⚠️ Invalid direct IP geolocation data:', data);
        return null;
      }

      const result: GeolocationResult = {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        city: data.city,
        region: data.region,
        country: data.country_name,
        method: 'ip_geolocation',
        timestamp: new Date().toISOString(),
        fallback: false
      };

      console.log('✅ Direct IP geolocation success:', {
        location: `${data.city}, ${data.region}, ${data.country_name}`,
        coords: `${result.latitude}, ${result.longitude}`,
        service: 'ipapi.co'
      });

      return result;

    } catch (error) {
      console.error('❌ Direct IP geolocation failed:', error);
      return null;
    }
  }

  /**
   * Check if cached location is still valid
   */
  private isLocationCacheValid(): boolean {
    return Date.now() - this.lastLocationTime < this.locationCacheExpiry;
  }

  /**
   * Clear location cache (useful for testing or when user requests fresh location)
   */
  clearLocationCache(): void {
    console.log('🗑️ Clearing location cache');
    this.currentLocation = null;
    this.lastLocationTime = 0;
  }

  /**
   * Get mock nearby restaurants as fallback
   */
  private getMockNearbyRestaurants(location: GeolocationResult): NearbyRestaurantsResult {
    console.log('🎭 Using mock restaurant data');
    
    const mockRestaurants = [
      {
        place_id: 'mock_nearby_1',
        name: 'Local Bistro',
        vicinity: 'Near your location',
        rating: 4.5,
        price_level: 2,
        geometry: {
          location: {
            lat: location.latitude + 0.005,
            lng: location.longitude + 0.005
          }
        },
        photos: [{ photo_reference: 'mock_photo_1' }],
        types: ['restaurant', 'food', 'establishment'],
        opening_hours: { open_now: true },
        distance_km: 0.5,
        distance_text: '500m'
      },
      {
        place_id: 'mock_nearby_2',
        name: 'Coffee Corner',
        vicinity: 'Downtown area',
        rating: 4.3,
        price_level: 1,
        geometry: {
          location: {
            lat: location.latitude - 0.003,
            lng: location.longitude + 0.008
          }
        },
        photos: [{ photo_reference: 'mock_photo_2' }],
        types: ['cafe', 'food', 'establishment'],
        opening_hours: { open_now: true },
        distance_km: 0.8,
        distance_text: '800m'
      },
      {
        place_id: 'mock_nearby_3',
        name: 'Spice Garden',
        vicinity: 'Cultural district',
        rating: 4.7,
        price_level: 3,
        geometry: {
          location: {
            lat: location.latitude + 0.002,
            lng: location.longitude - 0.007
          }
        },
        photos: [{ photo_reference: 'mock_photo_3' }],
        types: ['restaurant', 'indian_restaurant', 'food'],
        opening_hours: { open_now: false },
        distance_km: 1.2,
        distance_text: '1.2km'
      }
    ];

    return {
      restaurants: mockRestaurants,
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      searchRadius: 5000,
      totalResults: mockRestaurants.length,
      method: 'mock_data',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get location info for display purposes
   */
  getLocationDisplayInfo(): string {
    if (!this.currentLocation) {
      return 'Location not available';
    }

    const { city, region, country, method } = this.currentLocation;
    
    if (city && region) {
      return `${city}, ${region}`;
    } else if (country) {
      return country;
    } else {
      return `${this.currentLocation.latitude.toFixed(3)}, ${this.currentLocation.longitude.toFixed(3)}`;
    }
  }

  /**
   * Get location method for debugging
   */
  getLocationMethod(): string {
    return this.currentLocation?.method || 'unknown';
  }
}

export const geolocationService = new GeolocationService();