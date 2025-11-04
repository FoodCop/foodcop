import { supabase } from './supabase';

// FUZO Backend Service - Uses Supabase Edge Functions for API calls
// This service works perfectly in production environment

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BASE_URL = `${SUPABASE_URL}/functions/v1/make-server-5976446e`;

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
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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

  // Google Places - Search nearby restaurants
  async searchNearbyPlaces(location: { lat: number; lng: number }, radius: number = 5000, type: string = 'restaurant'): Promise<BackendResponse> {
    return this.makeRequest('/places/nearby', {
      method: 'POST',
      body: JSON.stringify({ 
        latitude: location.lat,
        longitude: location.lng,
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

  // Google Routes API v2 - Get route directions (modern API)
  async getDirections(params: {
    origin: string;
    destination: string;
    mode: string;
    alternatives: string;
  }): Promise<BackendResponse> {
    // Convert old Directions API format to Routes API v2 format
    const [originLat, originLng] = params.origin.split(',').map(Number);
    const [destLat, destLng] = params.destination.split(',').map(Number);
    
    const routesApiRequest = {
      origin: {
        location: {
          latLng: {
            latitude: originLat,
            longitude: originLng
          }
        }
      },
      destination: {
        location: {
          latLng: {
            latitude: destLat,
            longitude: destLng
          }
        }
      },
      travelMode: params.mode.toUpperCase(),
      routingPreference: params.mode.toUpperCase() === 'DRIVE' ? 'TRAFFIC_AWARE' : 'TRAFFIC_UNAWARE',
      computeAlternativeRoutes: params.alternatives === 'true',
      languageCode: 'en-US',
      units: 'METRIC'
    };
    
    return this.makeRequest('/directions', {
      method: 'POST',
      body: JSON.stringify(routesApiRequest),
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
    price_level: place.price_level || 2,
    photos: place.photos ? place.photos.slice(0, 3).map((photo: any) => ({
      photoReference: photo.photo_reference,
      width: photo.width,
      height: photo.height,
    })) : [],
    cuisine: extractCuisineFromTypes(place.types || []),
    lat: location.lat,
    lng: location.lng,
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