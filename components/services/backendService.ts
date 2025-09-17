import { projectId, publicAnonKey } from '../../utils/supabase/info';

// FUZO Backend Service - Uses Supabase Edge Functions for API calls
// This service works perfectly in Figma Make's sandbox environment

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-5976446e`;

interface BackendResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

class BackendService {
  private async makeRequest<T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<BackendResponse<T>> {
    try {
      console.log(`🔗 Backend API Request: ${endpoint}`);
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          ...options.headers,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ Backend API Error [${response.status}]:`, data);
        
        // Handle specific error cases
        if (response.status === 404) {
          return {
            success: false,
            error: `Endpoint not found: ${endpoint}. The backend service may need to be deployed or updated.`,
            status: response.status,
          };
        } else if (response.status === 502 || response.status === 503) {
          return {
            success: false,
            error: `Backend service unavailable. Please try again later.`,
            status: response.status,
          };
        }
        
        return {
          success: false,
          error: data.error || `Request failed with status ${response.status}`,
          status: response.status,
        };
      }

      console.log(`✅ Backend API Success: ${endpoint}`, { 
        status: response.status,
        dataSize: JSON.stringify(data).length 
      });
      
      return {
        success: true,
        data,
        status: response.status,
      };
    } catch (error: any) {
      console.error(`❌ Backend Service Error (${endpoint}):`, error);
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  // Health check - test if backend is available
  async healthCheck(): Promise<BackendResponse> {
    return this.makeRequest('/health');
  }

  // AI Assistant - Chat with Tako
  async chatWithTako(message: string, conversation: any[] = []): Promise<BackendResponse> {
    return this.makeRequest('/tako-chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversation }),
    });
  }

  // AI Assistant - Store conversation
  async storeTakoConversation(userId: string, conversation: any[]): Promise<BackendResponse> {
    return this.makeRequest('/tako-conversation', {
      method: 'POST',
      body: JSON.stringify({ userId, conversation }),
    });
  }

  // AI Assistant - Get conversation history
  async getTakoConversation(userId: string): Promise<BackendResponse> {
    return this.makeRequest(`/tako-conversation/${userId}`);
  }

  // Google Places - Search nearby restaurants
  async searchNearbyPlaces(location: { lat: number; lng: number }, radius: number = 5000, type: string = 'restaurant'): Promise<BackendResponse> {
    return this.makeRequest('/places/nearby', {
      method: 'POST',
      body: JSON.stringify({ 
        location, 
        radius, 
        type 
      }),
    });
  }

  // Google Places - Text search for restaurants
  async searchPlacesByText(query: string, location?: { lat: number; lng: number }): Promise<BackendResponse> {
    return this.makeRequest('/places/textsearch', {
      method: 'POST',
      body: JSON.stringify({ 
        query, 
        location,
        radius: 50000 
      }),
    });
  }

  // Google Places - Get place details
  async getPlaceDetails(placeId: string): Promise<BackendResponse> {
    return this.makeRequest(`/places/details/${placeId}`);
  }

  // Google Places - Get photo URL
  async getPhotoUrl(photoReference: string, maxWidth: number = 400, maxHeight?: number): Promise<BackendResponse> {
    const params = new URLSearchParams({
      maxwidth: maxWidth.toString(),
    });
    
    if (maxHeight) {
      params.append('maxheight', maxHeight.toString());
    }
    
    try {
      const response = await this.makeRequest(`/places/photo/${photoReference}?${params.toString()}`);
      
      // If successful, the backend should return a JSON object with photoUrl
      if (response.success && response.data?.photoUrl) {
        return {
          success: true,
          data: {
            photoUrl: response.data.photoUrl,
            directUrl: true // Flag to indicate this is ready to use
          },
          status: response.status
        };
      }
      
      return response;
    } catch (error: any) {
      console.warn(`📸 Photo fetch failed for reference: ${photoReference.substring(0, 20)}...`, error);
      
      // Return a fallback response
      return {
        success: false,
        error: 'Photo not available',
        status: 404
      };
    }
  }

  // Google Maps - Distance Matrix (for routing)
  async getDistanceMatrix(
    origins: string[], 
    destinations: string[], 
    mode: string = 'driving',
    units: string = 'imperial'
  ): Promise<BackendResponse> {
    return this.makeRequest('/maps/distance', {
      method: 'POST',
      body: JSON.stringify({ 
        origins, 
        destinations, 
        mode, 
        units 
      }),
    });
  }

  // Static Maps API (for generating map images) - with graceful error handling
  async generateStaticMap(
    center: { lat: number; lng: number },
    zoom: number = 14,
    size: string = '800x600',
    markers: Array<{ lat: number; lng: number; color?: string; label?: string }> = []
  ): Promise<BackendResponse> {
    const response = await this.makeRequest('/maps/static', {
      method: 'POST',
      body: JSON.stringify({ 
        center, 
        zoom, 
        size, 
        markers 
      }),
    });

    // Handle specific static maps API errors gracefully
    if (!response.success) {
      if (response.status === 403) {
        console.warn('🗺️ Static Maps API not enabled or billing not set up - this is expected if you only have frontend Google Maps configured');
        return {
          success: false,
          error: 'Static Maps API not available',
          details: 'Frontend interactive maps are available instead',
          fallback: true,
          status: 403
        };
      } else if (response.status === 400) {
        console.warn('🗺️ Invalid Static Maps API request - check API key configuration');
        return {
          success: false,
          error: 'Invalid static maps request',
          details: 'API key may not have proper permissions',
          fallback: true,
          status: 400
        };
      } else {
        console.warn(`🗺️ Static Maps API error (${response.status}) - falling back to interactive maps`);
        return {
          success: false,
          error: response.error || 'Static maps generation failed',
          details: 'Interactive maps are available as fallback',
          fallback: true,
          status: response.status
        };
      }
    }

    return response;
  }

  // Google Geocoding - Geocode address
  async geocodeAddress(address: string): Promise<BackendResponse> {
    return this.makeRequest('/geocoding/geocode', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  }

  // Google Geocoding - Reverse geocode coordinates
  async reverseGeocode(lat: number, lng: number): Promise<BackendResponse> {
    return this.makeRequest('/geocoding/reverse', {
      method: 'POST',
      body: JSON.stringify({ lat, lng }),
    });
  }

  // Recipe Search
  async searchRecipes(
    query?: string,
    cuisine?: string,
    diet?: string,
    intolerances?: string,
    number: number = 12
  ): Promise<BackendResponse> {
    return this.makeRequest('/recipes/search', {
      method: 'POST',
      body: JSON.stringify({ 
        query, 
        cuisine, 
        diet, 
        intolerances, 
        number 
      }),
    });
  }

  // Geolocation - Get nearby restaurants based on current location
  async getNearbyRestaurantsByLocation(
    latitude: number,
    longitude: number,
    radius: number = 5000
  ): Promise<BackendResponse> {
    return this.makeRequest('/geolocation/nearby', {
      method: 'POST',
      body: JSON.stringify({
        latitude,
        longitude,
        radius,
        type: 'restaurant',
        useDeviceLocation: true
      })
    });
  }

  // Get IP-based geolocation
  async getIPGeolocation(): Promise<BackendResponse> {
    return this.makeRequest('/geolocation/ip', {
      method: 'GET'
    });
  }

  // Utility method to check service availability
  async checkServiceAvailability(): Promise<{
    backend: boolean;
    openai: boolean;
    googleMaps: boolean;
    timestamp: string;
  }> {
    try {
      const response = await this.healthCheck();
      
      if (response.success && response.data) {
        return {
          backend: true,
          openai: response.data.services?.openai_configured || false,
          googleMaps: response.data.services?.google_maps_configured || false,
          timestamp: response.data.timestamp || new Date().toISOString(),
        };
      }
      
      return {
        backend: false,
        openai: false,
        googleMaps: false,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Service availability check failed:', error);
      return {
        backend: false,
        openai: false,
        googleMaps: false,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Singleton instance
export const backendService = new BackendService();

// Helper function to format Google Places results for frontend compatibility
export function formatGooglePlaceResult(place: any, userLocation?: { lat: number; lng: number }) {
  const location = {
    lat: place.geometry?.location?.lat || 0,
    lng: place.geometry?.location?.lng || 0,
  };

  // Calculate distance if user location provided
  let distance = 0;
  if (userLocation) {
    distance = calculateDistance(userLocation, location);
  }

  return {
    id: place.place_id || place.id,
    name: place.name || 'Unknown Restaurant',
    address: place.vicinity || place.formatted_address || 'Address not available',
    rating: place.rating || 0,
    priceLevel: place.price_level || 2,
    photos: place.photos ? place.photos.slice(0, 3).map((photo: any) => ({
      photoReference: photo.photo_reference,
      width: photo.width,
      height: photo.height,
      // We'll resolve the actual URL later to avoid the JSON parsing error
      needsResolving: true
    })) : [],
    cuisine: extractCuisineFromTypes(place.types || []),
    location,
    distance,
    isOpen: place.opening_hours?.open_now,
    placeId: place.place_id,
    phoneNumber: place.formatted_phone_number,
    website: place.website,
  };
}

// Helper function to calculate distance between two points
function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Helper function to extract cuisine types
function extractCuisineFromTypes(types: string[]): string[] {
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

// Helper function to safely resolve a photo URL
export async function resolvePhotoUrl(photoReference: string, maxWidth: number = 400): Promise<string | null> {
  try {
    console.log('📸 Resolving photo URL for reference:', photoReference.substring(0, 20) + '...');
    
    const response = await backendService.getPhotoUrl(photoReference, maxWidth);
    
    if (response.success && response.data?.photoUrl) {
      console.log('✅ Photo URL resolved successfully');
      return response.data.photoUrl;
    } else {
      console.warn('⚠️ Failed to resolve photo URL:', response.error);
      return null;
    }
  } catch (error) {
    console.warn('❌ Error resolving photo URL:', error);
    return null;
  }
}

// Helper function to get a fallback image URL
export function getFallbackImageUrl(restaurantName: string, type: string = 'restaurant'): string {
  // Use Unsplash as a fallback for restaurant images
  const query = encodeURIComponent(`${type} food ${restaurantName.split(' ')[0]}`);
  return `https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop&q=80`;
}