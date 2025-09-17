import { 
  API_CONFIG, 
  isGoogleAPIAvailable, 
  buildGooglePlacesURL, 
  buildPlaceDetailsURL,
  buildDistanceMatrixURL,
  buildDirectionsURL,
  buildPhotoURL,
  GOOGLE_PLACES_CONFIG 
} from '../config/apiConfig';
import { FEATURES } from '../../utils/env';

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

class LocationService {
  private currentLocation: Location | null = null;
  private lastApiCheck: number = 0;
  private apiCheckInterval: number = 30000; // Check API availability every 30 seconds

  // Get user's current location
  async getCurrentLocation(): Promise<Location> {
    console.log('📍 LocationService: Getting current location...');
    console.log('🔍 Cached location exists:', !!this.currentLocation);
    
    if (this.currentLocation) {
      console.log('✅ Using cached location:', this.currentLocation);
      return this.currentLocation;
    }

    // Check for Figma Make environment first
    const isFigmaMake = typeof window !== 'undefined' && window.location.hostname.includes('figma') || 
                       (typeof window !== 'undefined' && window.parent !== window); // iframe detection
    
    if (isFigmaMake) {
      console.log('🎨 Figma Make detected - geolocation blocked by iframe permissions policy');
      console.log('✅ Using default location for preview:', API_CONFIG.DEFAULT_LOCATION);
      this.currentLocation = API_CONFIG.DEFAULT_LOCATION;
      return API_CONFIG.DEFAULT_LOCATION;
    }

    return new Promise((resolve, reject) => {
      console.log('🌐 Geolocation API check:', {
        available: !!navigator.geolocation,
        userAgent: navigator.userAgent,
        permissions: 'permissions' in navigator ? 'Available' : 'Not available',
        isFigmaMake
      });
      
      if (!navigator.geolocation) {
        console.log('⚠️ Geolocation not supported, using default location');
        this.currentLocation = API_CONFIG.DEFAULT_LOCATION;
        resolve(API_CONFIG.DEFAULT_LOCATION);
        return;
      }

      console.log('🎯 Requesting geolocation with options:', {
        enableHighAccuracy: true,
        timeout: 5000, // Reduced timeout for preview environments
        maximumAge: 300000
      });
      
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
          let errorMessage = 'Location access denied';
          let isPermissionsPolicyError = false;
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied - using default location';
              isPermissionsPolicyError = error.message?.includes('permissions policy') || 
                                       error.message?.includes('iframe') ||
                                       isFigmaMake;
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = `Geolocation error: ${error.message || 'Unknown error'}`;
          }
          
          if (isPermissionsPolicyError) {
            console.log('ℹ️ Geolocation blocked by permissions policy (normal in iframe/preview):', {
              environment: 'Figma Make Preview',
              reason: 'Security policy blocks geolocation in iframe environments',
              fallback: 'Using San Francisco as default location'
            });
          } else {
            console.warn('❌ Geolocation error:', {
              code: error.code,
              message: error.message,
              description: errorMessage,
              PERMISSION_DENIED: error.PERMISSION_DENIED,
              POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
              TIMEOUT: error.TIMEOUT
            });
          }
          
          console.log('🔄 Falling back to default location:', API_CONFIG.DEFAULT_LOCATION);
          
          // Cache the default location to avoid repeated attempts
          this.currentLocation = API_CONFIG.DEFAULT_LOCATION;
          resolve(API_CONFIG.DEFAULT_LOCATION);
        },
        {
          enableHighAccuracy: false, // Use less accurate but faster location for preview
          timeout: 5000, // Shorter timeout for preview environments
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Search nearby restaurants
  async searchNearbyRestaurants(location: Location, radius: number = 5000): Promise<Restaurant[]> {
    console.log('🔍 LocationService: Searching nearby restaurants...');
    console.log('📍 Search parameters:', { location, radius });
    
    // Check if we should retry API availability check
    const now = Date.now();
    if (now - this.lastApiCheck > this.apiCheckInterval) {
      this.lastApiCheck = now;
      console.log('🔄 Checking API availability (periodic check)...');
    }
    
    console.log('🔧 Google Maps feature enabled:', FEATURES.GOOGLE_MAPS);
    console.log('🔧 Google API available:', isGoogleAPIAvailable());
    
    if (FEATURES.GOOGLE_MAPS && isGoogleAPIAvailable()) {
      console.log('✅ Using Google Places API');
      return this.searchGooglePlaces(location, radius);
    } else {
      console.log('⚠️ Using mock restaurant data - Google Maps not configured');
      if (!FEATURES.GOOGLE_MAPS) {
        console.log('💡 To enable Google Maps: Upload VITE_GOOGLE_MAPS_API_KEY in Figma Make secrets');
        console.log('💡 After uploading, refresh the page to detect the new API key');
      }
      return this.getMockRestaurants(location);
    }
  }

  // Search restaurants by query
  async searchRestaurants(query: string, location: Location): Promise<Restaurant[]> {
    if (FEATURES.GOOGLE_MAPS && isGoogleAPIAvailable()) {
      return this.searchGooglePlacesByText(query, location);
    } else {
      console.log('⚠️ Using mock search results - Google Maps not configured');
      return this.getMockRestaurantsByQuery(query);
    }
  }

  // Get detailed restaurant information using Places Service
  async getRestaurantDetails(placeId: string): Promise<Restaurant | null> {
    return new Promise((resolve) => {
      try {
        if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.places) {
          console.warn('Google Maps Places API not loaded');
          resolve(null);
          return;
        }

        const mapDiv = document.createElement('div');
        const map = new google.maps.Map(mapDiv, {
          center: { lat: 0, lng: 0 },
          zoom: 15
        });

        const service = new google.maps.places.PlacesService(map);
        
        const request = {
          placeId: placeId,
          fields: [
            'place_id',
            'name',
            'formatted_address',
            'geometry',
            'rating',
            'price_level',
            'photos',
            'opening_hours',
            'formatted_phone_number',
            'website',
            'reviews',
            'types'
          ]
        };

        service.getDetails(request, (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve(this.formatGooglePlaceDetails(place));
          } else {
            console.warn('Place Details error:', status);
            resolve(null);
          }
        });
      } catch (error) {
        console.error('Google Place Details API error:', error);
        resolve(null);
      }
    });
  }

  // Get route information between two points
  async getRouteInfo(origin: Location, destination: Location): Promise<RouteInfo | null> {
    try {
      if (typeof window === 'undefined' || !window.google || !window.google.maps) {
        console.warn('Google Maps API not loaded, using estimated values');
        return this.getMockRouteInfo(origin, destination);
      }

      // Use Distance Matrix Service (client-side, no CORS issues)
      const service = new google.maps.DistanceMatrixService();
      
      return new Promise((resolve) => {
        service.getDistanceMatrix({
          origins: [new google.maps.LatLng(origin.lat, origin.lng)],
          destinations: [new google.maps.LatLng(destination.lat, destination.lng)],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.IMPERIAL,
          avoidHighways: false,
          avoidTolls: false
        }, (response, status) => {
          if (status === google.maps.DistanceMatrixStatus.OK && response) {
            const element = response.rows[0].elements[0];
            if (element.status === google.maps.DistanceMatrixElementStatus.OK) {
              resolve({
                distance: {
                  text: element.distance.text,
                  value: element.distance.value
                },
                duration: {
                  text: element.duration.text,
                  value: element.duration.value
                }
              });
            } else {
              console.warn('Distance Matrix element error:', element.status);
              resolve(this.getMockRouteInfo(origin, destination));
            }
          } else {
            console.warn('Distance Matrix Service error:', status);
            resolve(this.getMockRouteInfo(origin, destination));
          }
        });
      });
    } catch (error) {
      console.error('Distance Matrix API error:', error);
      return this.getMockRouteInfo(origin, destination);
    }
  }

  // Generate mock route info based on coordinates
  private getMockRouteInfo(origin: Location, destination: Location): RouteInfo {
    const distance = this.calculateDistance(origin, destination);
    const distanceMiles = distance * 0.621371; // Convert km to miles
    const estimatedDriveTime = Math.max(5, Math.round(distanceMiles * 2.5)); // Rough estimate
    
    return {
      distance: {
        text: `${distanceMiles.toFixed(1)} mi`,
        value: Math.round(distanceMiles * 1609.34) // Convert to meters
      },
      duration: {
        text: `${estimatedDriveTime} mins`,
        value: estimatedDriveTime * 60 // Convert to seconds
      }
    };
  }

  // Get directions between two points
  async getDirections(origin: Location, destination: Location): Promise<any> {
    if (!isGoogleAPIAvailable()) {
      return null;
    }

    try {
      const originStr = `${origin.lat},${origin.lng}`;
      const destinationStr = `${destination.lat},${destination.lng}`;
      
      const url = buildDirectionsURL(originStr, destinationStr, {
        mode: 'driving',
        units: 'imperial'
      });

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Directions API error: ${data.status}`);
      }

      return data;
    } catch (error) {
      console.error('Directions API error:', error);
      return null;
    }
  }

  // Google Places API implementation using Places Service (no CORS issues)
  private async searchGooglePlaces(location: Location, radius: number): Promise<Restaurant[]> {
    console.log('🗺️ LocationService: Starting Google Places search...');
    
    return new Promise((resolve) => {
      try {
        // Check if we're in a browser environment with Google Maps loaded
        console.log('🔍 Environment check:', {
          windowExists: typeof window !== 'undefined',
          googleExists: typeof window !== 'undefined' && !!window.google,
          mapsExists: typeof window !== 'undefined' && !!(window.google && window.google.maps),
          placesExists: typeof window !== 'undefined' && !!(window.google && window.google.maps && window.google.maps.places),
          placesServiceExists: typeof window !== 'undefined' && !!(window.google && window.google.maps && window.google.maps.places && window.google.maps.places.PlacesService)
        });
        
        if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.places) {
          console.warn('❌ Google Maps Places API not loaded, using mock data');
          resolve(this.getMockRestaurants(location));
          return;
        }

        // Create a map element for the Places service (required)
        console.log('📝 Creating map div for Places service...');
        const mapDiv = document.createElement('div');
        const map = new google.maps.Map(mapDiv, {
          center: location,
          zoom: 15
        });
        console.log('✅ Map created successfully');

        console.log('🔧 Initializing Places service...');
        const service = new google.maps.places.PlacesService(map);
        console.log('✅ Places service initialized');
        
        const request = {
          location: new google.maps.LatLng(location.lat, location.lng),
          radius: radius,
          type: 'restaurant'
        };
        
        console.log('📊 Places search request:', request);

        console.log('🚀 Executing Places nearbySearch...');
        service.nearbySearch(request, (results, status) => {
          console.log('📡 Places Service Response received:', { 
            status, 
            statusText: this.getPlacesStatusText(status),
            resultCount: results?.length || 0,
            timestamp: new Date().toISOString()
          });
          
          if (results && results.length > 0) {
            console.log('📋 First few results preview:', results.slice(0, 3).map(r => ({
              name: r.name,
              rating: r.rating,
              place_id: r.place_id,
              types: r.types
            })));
          }
          
          if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            console.log('✅ Processing successful Places API response');
            try {
              const restaurants = results
                .slice(0, 10) // Limit results
                .map((place, index) => {
                  console.log(`🏪 Formatting restaurant ${index + 1}:`, place.name);
                  return this.formatGooglePlace(place, location);
                });
              console.log('✅ Successfully formatted restaurants:', restaurants.length);
              console.log('📊 Restaurant summary:', restaurants.map(r => ({ name: r.name, rating: r.rating, distance: r.distance })));
              resolve(restaurants);
            } catch (formatError) {
              console.error('❌ Error formatting places:', formatError);
              resolve(this.getMockRestaurants(location));
            }
          } else {
            console.warn('❌ Places Service error or no results:', {
              status,
              statusText: this.getPlacesStatusText(status),
              resultCount: results?.length || 0,
              possibleCauses: this.getDiagnosticSuggestions(status)
            });
            resolve(this.getMockRestaurants(location));
          }
        });
      } catch (error: any) {
        console.error('❌ Google Places API error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        resolve(this.getMockRestaurants(location));
      }
    });
  }

  // Helper function to get readable status text
  private getPlacesStatusText(status: any): string {
    const statusMap: Record<string, string> = {
      'OK': 'Request successful',
      'ZERO_RESULTS': 'No results found',
      'OVER_QUERY_LIMIT': 'Query limit exceeded',
      'REQUEST_DENIED': 'Request denied - check API key and billing',
      'INVALID_REQUEST': 'Invalid request parameters',
      'UNKNOWN_ERROR': 'Unknown server error'
    };
    
    return statusMap[status] || `Unknown status: ${status}`;
  }

  // Helper function to get diagnostic suggestions
  private getDiagnosticSuggestions(status: any): string[] {
    const suggestions: Record<string, string[]> = {
      'REQUEST_DENIED': [
        'Check if Places API is enabled in Google Cloud Console',
        'Verify billing is set up for the project',
        'Confirm API key has Places API permissions',
        'Check if domain restrictions allow your domain'
      ],
      'OVER_QUERY_LIMIT': [
        'Daily or per-second quotas exceeded',
        'Check usage in Google Cloud Console',
        'Consider implementing request caching',
        'Upgrade billing plan if needed'
      ],
      'ZERO_RESULTS': [
        'No restaurants found in the specified radius',
        'Try increasing the search radius',
        'Check if location coordinates are valid',
        'Verify the location has restaurants nearby'
      ],
      'INVALID_REQUEST': [
        'Check request parameters are valid',
        'Verify location coordinates format',
        'Ensure radius is within allowed range'
      ]
    };
    
    return suggestions[status] || ['Unknown error - check console logs'];
  }

  private async searchGooglePlacesByText(query: string, location: Location): Promise<Restaurant[]> {
    return new Promise((resolve) => {
      try {
        if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.places) {
          console.warn('Google Maps Places API not loaded, using mock data');
          resolve(this.getMockRestaurantsByQuery(query));
          return;
        }

        const mapDiv = document.createElement('div');
        const map = new google.maps.Map(mapDiv, {
          center: location,
          zoom: 15
        });

        const service = new google.maps.places.PlacesService(map);
        
        const request = {
          query: `${query} restaurant`,
          location: new google.maps.LatLng(location.lat, location.lng),
          radius: GOOGLE_PLACES_CONFIG.radius
        };

        service.textSearch(request, (results, status) => {
          console.log('Text Search Response:', { query, status, results: results?.length });
          
          if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            const restaurants = results
              .slice(0, 10)
              .map((place) => this.formatGooglePlace(place, location));
            resolve(restaurants);
          } else {
            console.warn('Places Text Search error or no results:', {
              query,
              status,
              statusText: this.getPlacesStatusText(status),
              resultCount: results?.length || 0
            });
            resolve(this.getMockRestaurantsByQuery(query));
          }
        });
      } catch (error) {
        console.error('Google Places text search error:', error);
        resolve(this.getMockRestaurantsByQuery(query));
      }
    });
  }

  private formatGooglePlace(place: any, userLocation: Location): Restaurant {
    const placeLocation: Location = {
      lat: place.geometry?.location?.lat || (typeof place.geometry?.location?.lat === 'function' ? place.geometry.location.lat() : 0),
      lng: place.geometry?.location?.lng || (typeof place.geometry?.location?.lng === 'function' ? place.geometry.location.lng() : 0)
    };

    return {
      id: place.place_id || place.id,
      name: place.name || 'Unknown Restaurant',
      address: place.vicinity || place.formatted_address || 'Address not available',
      rating: place.rating || 0,
      priceLevel: place.price_level || 2,
      photos: place.photos ? place.photos.slice(0, 3).map((photo: any) => {
        // Use photo.getUrl() method for Places API photos
        try {
          if (typeof photo.getUrl === 'function') {
            return photo.getUrl({ maxWidth: 400, maxHeight: 300 });
          } else if (photo.photo_reference) {
            return buildPhotoURL(photo.photo_reference, 400);
          }
        } catch (error) {
          console.warn('Error getting photo URL:', error);
        }
        return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'; // Fallback
      }) : ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'],
      cuisine: this.extractCuisineFromTypes(place.types || []),
      location: placeLocation,
      distance: this.calculateDistance(userLocation, placeLocation),
      isOpen: place.opening_hours?.open_now,
      placeId: place.place_id,
      phoneNumber: place.formatted_phone_number,
      website: place.website
    };
  }

  private formatGooglePlaceDetails(place: any): Restaurant {
    const placeLocation: Location = {
      lat: place.geometry?.location?.lat || (typeof place.geometry?.location?.lat === 'function' ? place.geometry.location.lat() : 0),
      lng: place.geometry?.location?.lng || (typeof place.geometry?.location?.lng === 'function' ? place.geometry.location.lng() : 0)
    };

    return {
      id: place.place_id || place.id,
      name: place.name || 'Unknown Restaurant',
      address: place.formatted_address || 'Address not available',
      rating: place.rating || 0,
      priceLevel: place.price_level || 2,
      photos: place.photos ? place.photos.slice(0, 6).map((photo: any) => {
        try {
          if (typeof photo.getUrl === 'function') {
            return photo.getUrl({ maxWidth: 600, maxHeight: 400 });
          } else if (photo.photo_reference) {
            return buildPhotoURL(photo.photo_reference, 600);
          }
        } catch (error) {
          console.warn('Error getting detailed photo URL:', error);
        }
        return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600';
      }) : ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600'],
      cuisine: this.extractCuisineFromTypes(place.types || []),
      location: placeLocation,
      distance: 0, // Will be calculated later if needed
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

  // Mock data for development
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

  // Calculate distance between two points
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

export const locationService = new LocationService();