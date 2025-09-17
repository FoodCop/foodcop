import { backendService, formatGooglePlaceResult } from './backendService';
import { API_CONFIG } from '../config/apiConfig';

export interface Location {
  lat: number;
  lng: number;
  city?: string;
  country?: string;
}

export interface GoogleReview {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export interface RouteInfo {
  distance: {
    text: string;
    value: number; // in meters
  };
  duration: {
    text: string;
    value: number; // in seconds
  };
  steps?: any[];
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  rating: number;
  priceLevel: number;
  photos: string[];
  cuisine: string[];
  location: Location;
  distance?: number;
  isOpen?: boolean;
  phoneNumber?: string;
  website?: string;
  placeId?: string;
  reviews?: GoogleReview[];
  openingHours?: string[];
}

class LocationServiceBackend {
  private currentLocation: Location | null = null;
  private serviceAvailability: any = null;
  private lastAvailabilityCheck: number = 0;
  private availabilityCheckInterval: number = 60000; // Check every minute

  // Get user's current location
  async getCurrentLocation(): Promise<Location> {
    console.log('📍 LocationServiceBackend: Getting current location...');
    console.log('🔍 Cached location exists:', !!this.currentLocation);
    
    if (this.currentLocation) {
      console.log('✅ Using cached location:', this.currentLocation);
      return this.currentLocation;
    }

    // Check for Figma Make environment first
    const isFigmaMake = typeof window !== 'undefined' && (
      window.location.hostname.includes('figma') || 
      window.parent !== window
    );
    
    if (isFigmaMake) {
      console.log('🎨 Figma Make detected - using default location for optimal preview experience');
      console.log('✅ Using San Francisco as default location:', API_CONFIG.DEFAULT_LOCATION);
      this.currentLocation = API_CONFIG.DEFAULT_LOCATION;
      return API_CONFIG.DEFAULT_LOCATION;
    }

    return new Promise((resolve) => {
      console.log('🌐 Geolocation API check:', {
        available: !!navigator.geolocation,
        userAgent: navigator.userAgent,
        isFigmaMake
      });
      
      if (!navigator.geolocation) {
        console.log('⚠️ Geolocation not supported, using default location');
        this.currentLocation = API_CONFIG.DEFAULT_LOCATION;
        resolve(API_CONFIG.DEFAULT_LOCATION);
        return;
      }

      console.log('🎯 Requesting geolocation...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('✅ Geolocation success:', {
            location,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toISOString()
          });
          this.currentLocation = location;
          resolve(location);
        },
        (error) => {
          console.log('ℹ️ Geolocation not available (normal in preview environments):', {
            code: error.code,
            message: error.message,
            fallback: 'Using default San Francisco location'
          });
          
          // Cache the default location to avoid repeated attempts
          this.currentLocation = API_CONFIG.DEFAULT_LOCATION;
          resolve(API_CONFIG.DEFAULT_LOCATION);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Check service availability periodically
  private async checkServiceAvailability(): Promise<void> {
    const now = Date.now();
    if (now - this.lastAvailabilityCheck < this.availabilityCheckInterval && this.serviceAvailability) {
      return;
    }

    this.lastAvailabilityCheck = now;
    this.serviceAvailability = await backendService.checkServiceAvailability();
    
    console.log('🔧 Service availability check:', this.serviceAvailability);
  }

  // Search nearby restaurants using backend service
  async searchNearbyRestaurants(location: Location, radius: number = 5000): Promise<Restaurant[]> {
    console.log('🔍 LocationServiceBackend: Searching nearby restaurants...');
    console.log('📍 Search parameters:', { location, radius });
    
    // Check service availability
    await this.checkServiceAvailability();
    
    if (!this.serviceAvailability?.backend) {
      console.warn('❌ Backend service not available, using mock data');
      return this.getMockRestaurants(location);
    }

    if (!this.serviceAvailability?.googleMaps) {
      console.log('⚠️ Google Maps not configured in backend, using mock data');
      console.log('💡 To enable Google Maps: Configure GOOGLE_MAPS_API_KEY in Supabase edge function');
      return this.getMockRestaurants(location);
    }

    try {
      console.log('✅ Using backend Google Places API');
      const response = await backendService.searchNearbyPlaces(location, radius);
      
      if (!response.success) {
        console.error('❌ Backend Places search failed:', response.error);
        return this.getMockRestaurants(location);
      }

      const data = response.data;
      
      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        console.warn('⚠️ No results from Places API:', data.status);
        return this.getMockRestaurants(location);
      }

      console.log('✅ Successfully fetched restaurants from backend:', data.results.length);
      
      const restaurants = data.results
        .slice(0, 10) // Limit results
        .map((place: any) => this.formatBackendPlace(place, location));
      
      // Resolve photo URLs for restaurants with photos
      await this.resolvePhotoUrls(restaurants);
      
      console.log('📊 Restaurant summary:', restaurants.map(r => ({ 
        name: r.name, 
        rating: r.rating, 
        distance: r.distance?.toFixed(1) + 'km' 
      })));
      
      return restaurants;

    } catch (error) {
      console.error('❌ Backend search error:', error);
      return this.getMockRestaurants(location);
    }
  }

  // Search restaurants by query using backend service
  async searchRestaurants(query: string, location: Location): Promise<Restaurant[]> {
    console.log('🔍 LocationServiceBackend: Text search for restaurants...');
    
    await this.checkServiceAvailability();
    
    if (!this.serviceAvailability?.backend || !this.serviceAvailability?.googleMaps) {
      console.log('⚠️ Backend/Google Maps not available, using mock search');
      return this.getMockRestaurantsByQuery(query);
    }

    try {
      const response = await backendService.searchPlacesByText(query, location);
      
      if (!response.success) {
        console.error('❌ Backend text search failed:', response.error);
        return this.getMockRestaurantsByQuery(query);
      }

      const data = response.data;
      
      if (data.status !== 'OK' || !data.results) {
        console.warn('⚠️ No text search results:', data.status);
        return this.getMockRestaurantsByQuery(query);
      }

      console.log('✅ Text search results from backend:', data.results.length);
      
      const restaurants = data.results
        .slice(0, 10)
        .map((place: any) => this.formatBackendPlace(place, location));
      
      await this.resolvePhotoUrls(restaurants);
      
      return restaurants;

    } catch (error) {
      console.error('❌ Backend text search error:', error);
      return this.getMockRestaurantsByQuery(query);
    }
  }

  // Get detailed restaurant information using backend
  async getRestaurantDetails(placeId: string): Promise<Restaurant | null> {
    await this.checkServiceAvailability();
    
    if (!this.serviceAvailability?.backend || !this.serviceAvailability?.googleMaps) {
      console.warn('❌ Backend service not available for place details');
      return null;
    }

    try {
      const response = await backendService.getPlaceDetails(placeId);
      
      if (!response.success) {
        console.error('❌ Backend place details failed:', response.error);
        return null;
      }

      const data = response.data;
      
      if (data.status !== 'OK' || !data.result) {
        console.warn('⚠️ No place details found:', data.status);
        return null;
      }

      console.log('✅ Place details from backend:', data.result.name);
      
      const restaurant = this.formatBackendPlaceDetails(data.result);
      await this.resolvePhotoUrls([restaurant]);
      
      return restaurant;

    } catch (error) {
      console.error('❌ Backend place details error:', error);
      return null;
    }
  }

  // Get route information using backend service
  async getRouteInfo(origin: Location, destination: Location): Promise<RouteInfo | null> {
    await this.checkServiceAvailability();
    
    if (!this.serviceAvailability?.backend || !this.serviceAvailability?.googleMaps) {
      console.log('⚠️ Backend service not available, using estimated route');
      return this.getMockRouteInfo(origin, destination);
    }

    try {
      const originStr = `${origin.lat},${origin.lng}`;
      const destinationStr = `${destination.lat},${destination.lng}`;
      
      const response = await backendService.getDistanceMatrix(
        [originStr], 
        [destinationStr], 
        'driving', 
        'imperial'
      );
      
      if (!response.success) {
        console.error('❌ Backend distance matrix failed:', response.error);
        return this.getMockRouteInfo(origin, destination);
      }

      const data = response.data;
      
      if (data.status !== 'OK' || !data.rows || !data.rows[0] || !data.rows[0].elements[0]) {
        console.warn('⚠️ No route data:', data.status);
        return this.getMockRouteInfo(origin, destination);
      }

      const element = data.rows[0].elements[0];
      
      if (element.status !== 'OK') {
        console.warn('⚠️ Route element error:', element.status);
        return this.getMockRouteInfo(origin, destination);
      }

      console.log('✅ Route info from backend');
      
      return {
        distance: {
          text: element.distance.text,
          value: element.distance.value
        },
        duration: {
          text: element.duration.text,
          value: element.duration.value
        }
      };

    } catch (error) {
      console.error('❌ Backend route info error:', error);
      return this.getMockRouteInfo(origin, destination);
    }
  }

  // Format backend place result for frontend compatibility
  private formatBackendPlace(place: any, userLocation: Location): Restaurant {
    return {
      id: place.place_id || place.id || Math.random().toString(36),
      name: place.name || 'Unknown Restaurant',
      address: place.vicinity || place.formatted_address || 'Address not available',
      rating: place.rating || 0,
      priceLevel: place.price_level || 2,
      photos: place.photos ? place.photos.slice(0, 3).map((photo: any) => photo.photo_reference || '') : [],
      cuisine: this.extractCuisineFromTypes(place.types || []),
      location: {
        lat: place.geometry?.location?.lat || 0,
        lng: place.geometry?.location?.lng || 0
      },
      distance: this.calculateDistance(userLocation, {
        lat: place.geometry?.location?.lat || 0,
        lng: place.geometry?.location?.lng || 0
      }),
      isOpen: place.opening_hours?.open_now,
      placeId: place.place_id,
      phoneNumber: place.formatted_phone_number,
      website: place.website
    };
  }

  // Format detailed place result
  private formatBackendPlaceDetails(place: any): Restaurant {
    return {
      id: place.place_id || place.id || Math.random().toString(36),
      name: place.name || 'Unknown Restaurant',
      address: place.formatted_address || 'Address not available',
      rating: place.rating || 0,
      priceLevel: place.price_level || 2,
      photos: place.photos ? place.photos.slice(0, 6).map((photo: any) => photo.photo_reference || '') : [],
      cuisine: this.extractCuisineFromTypes(place.types || []),
      location: {
        lat: place.geometry?.location?.lat || 0,
        lng: place.geometry?.location?.lng || 0
      },
      distance: 0,
      isOpen: place.opening_hours?.open_now,
      placeId: place.place_id,
      phoneNumber: place.formatted_phone_number,
      website: place.website,
      reviews: place.reviews?.slice(0, 5).map((review: any) => ({
        author_name: review.author_name,
        author_url: review.author_url,
        language: review.language,
        profile_photo_url: review.profile_photo_url,
        rating: review.rating,
        relative_time_description: review.relative_time_description,
        text: review.text,
        time: review.time
      })) || [],
      openingHours: place.opening_hours?.weekday_text || []
    };
  }

  // Resolve photo URLs for restaurants
  private async resolvePhotoUrls(restaurants: Restaurant[]): Promise<void> {
    for (const restaurant of restaurants) {
      if (restaurant.photos && restaurant.photos.length > 0) {
        const resolvedPhotos: string[] = [];
        
        for (const photoRef of restaurant.photos) {
          if (photoRef && !photoRef.startsWith('http')) {
            try {
              const response = await backendService.getPhotoUrl(photoRef, 400);
              if (response.success && response.data?.photo_url) {
                resolvedPhotos.push(response.data.photo_url);
              } else {
                // Fallback to Unsplash
                resolvedPhotos.push('https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400');
              }
            } catch (error) {
              console.warn('Photo URL resolution failed:', error);
              resolvedPhotos.push('https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400');
            }
          } else {
            resolvedPhotos.push(photoRef || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400');
          }
        }
        
        restaurant.photos = resolvedPhotos;
      } else {
        restaurant.photos = ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'];
      }
    }
  }

  // Extract cuisine from Google Place types
  private extractCuisineFromTypes(types: string[]): string[] {
    const cuisineMap: Record<string, string> = {
      'italian_restaurant': 'Italian',
      'chinese_restaurant': 'Chinese',
      'japanese_restaurant': 'Japanese',
      'mexican_restaurant': 'Mexican',
      'indian_restaurant': 'Indian',
      'thai_restaurant': 'Thai',
      'french_restaurant': 'French',
      'american_restaurant': 'American',
      'mediterranean_restaurant': 'Mediterranean',
      'seafood_restaurant': 'Seafood',
      'steakhouse': 'Steakhouse',
      'pizza_restaurant': 'Pizza',
      'cafe': 'Cafe',
      'fast_food_restaurant': 'Fast Food'
    };

    const cuisines = types
      .map(type => cuisineMap[type])
      .filter(Boolean);

    return cuisines.length > 0 ? cuisines : ['Restaurant'];
  }

  // Mock data methods (same as original)
  private getMockRestaurants(location: Location): Restaurant[] {
    return [
      {
        id: 'mock_1',
        name: 'Ramen Takeshi',
        address: '123 Noodle St, Downtown',
        rating: 4.8,
        priceLevel: 2,
        photos: ['https://images.unsplash.com/photo-1677011454858-8ecb6d4e6ce0?w=400'],
        cuisine: ['Japanese', 'Ramen'],
        location: { lat: location.lat + 0.01, lng: location.lng + 0.01 },
        distance: 0.8,
        isOpen: true,
        phoneNumber: '+1 (555) 123-4567',
        website: 'https://ramentakeshi.com'
      },
      {
        id: 'mock_2',
        name: 'Verde Pizza',
        address: '456 Italian Way, Little Italy',
        rating: 4.6,
        priceLevel: 3,
        photos: ['https://images.unsplash.com/photo-1672856398893-2fb52d807874?w=400'],
        cuisine: ['Italian', 'Pizza'],
        location: { lat: location.lat - 0.02, lng: location.lng + 0.015 },
        distance: 1.2,
        isOpen: true,
        phoneNumber: '+1 (555) 987-6543',
        website: 'https://verdepizza.com'
      },
      {
        id: 'mock_3',
        name: 'Seoul Kitchen',
        address: '789 K-Town Blvd, Koreatown',
        rating: 4.7,
        priceLevel: 2,
        photos: ['https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400'],
        cuisine: ['Korean', 'BBQ'],
        location: { lat: location.lat + 0.005, lng: location.lng - 0.02 },
        distance: 1.5,
        isOpen: false,
        phoneNumber: '+1 (555) 456-7890',
        website: 'https://seoulkitchen.com'
      },
      {
        id: 'mock_4',
        name: 'Green Bowl',
        address: '321 Health St, Mission District',
        rating: 4.5,
        priceLevel: 1,
        photos: ['https://images.unsplash.com/photo-1643750182373-b4a55a8c2801?w=400'],
        cuisine: ['Healthy', 'Bowls', 'Vegetarian'],
        location: { lat: location.lat - 0.01, lng: location.lng - 0.01 },
        distance: 0.6,
        isOpen: true,
        phoneNumber: '+1 (555) 321-0987'
      }
    ];
  }

  private getMockRestaurantsByQuery(query: string): Restaurant[] {
    const allMockRestaurants = this.getMockRestaurants(API_CONFIG.DEFAULT_LOCATION);
    const lowerQuery = query.toLowerCase();
    
    return allMockRestaurants.filter(restaurant => 
      restaurant.name.toLowerCase().includes(lowerQuery) ||
      restaurant.cuisine.some(c => c.toLowerCase().includes(lowerQuery)) ||
      restaurant.address.toLowerCase().includes(lowerQuery)
    );
  }

  private getMockRouteInfo(origin: Location, destination: Location): RouteInfo {
    const distance = this.calculateDistance(origin, destination);
    const distanceMiles = distance * 0.621371;
    const estimatedDriveTime = Math.max(5, Math.round(distanceMiles * 2.5));
    
    return {
      distance: {
        text: `${distanceMiles.toFixed(1)} mi`,
        value: Math.round(distanceMiles * 1609.34)
      },
      duration: {
        text: `${estimatedDriveTime} mins`,
        value: estimatedDriveTime * 60
      }
    };
  }

  private calculateDistance(point1: Location, point2: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const locationServiceBackend = new LocationServiceBackend();