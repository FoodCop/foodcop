/**
 * GEOSPATIAL PLACES SERVICE
 * Ported from legacy/fuzoapp/src/services/placesService.ts
 * All requests go through /api/places/[action] (a direct Next.js Route
 * Handler using the server-side Google Maps key), not a Supabase Edge
 * Function - the legacy SUPABASE_URL/ANON_KEY/EDGE_URL constants pointing at
 * a "make-server-5976446e" edge function were dead code (never referenced
 * below), left over from the port and removed.
 */

export interface ScoutPlaceRaw {
  place_id?: string;
  id?: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  rating?: number;
  reviews?: Array<{
    author_name?: string;
    rating?: number;
    text?: string;
    time?: number;
    relative_time_description?: string;
  }>;
  photos?: Array<{
    photo_reference?: string;
    html_attributions?: string[];
  }>;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  current_opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  price_level?: number;
  editorial_summary?: { overview?: string };
  dine_in?: boolean;
  takeout?: boolean;
  delivery?: boolean;
  reservable?: boolean;
  plus_code?: { global_code?: string; compound_code?: string };
  user_ratings_total?: number;
  geometry?: {
    location?: { lat?: number; lng?: number };
  };
}

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function makeRequest<T>(path: string, payload: unknown): Promise<ServiceResult<T>> {
  try {
    const response = await fetch(`/api${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || `Request failed (${response.status})`,
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export const PlacesService = {
  async searchNearby(latitude: number, longitude: number, radius = 5000): Promise<ServiceResult<{ results: ScoutPlaceRaw[]; status?: string; error_message?: string }>> {
    return makeRequest('/places/nearby', {
      latitude,
      longitude,
      radius,
      type: 'restaurant',
    });
  },

  async searchByText(query: string, latitude: number, longitude: number, radius = 50000): Promise<ServiceResult<{ results: ScoutPlaceRaw[]; status?: string; error_message?: string }>> {
    return makeRequest('/places/textsearch', {
      query,
      location: { lat: latitude, lng: longitude },
      radius,
    });
  },

  async searchAlongRoute(polyline: string, query: string, origin?: { lat: number; lng: number }, destination?: { lat: number; lng: number }): Promise<ServiceResult<{ results: ScoutPlaceRaw[]; status?: string }>> {
    return makeRequest('/places/search-along-route', {
      polyline,
      query,
      origin,
      destination
    });
  },

  async getDirections(origin: string | { lat: number; lng: number }, destination: string | { lat: number; lng: number }): Promise<ServiceResult<{ routes: any[]; status: string }>> {
    const parseWaypoint = (wp: string | { lat: number; lng: number }) => {
      if (typeof wp === 'object') {
        return { location: { latLng: { latitude: wp.lat, longitude: wp.lng } } };
      }
      if (wp.startsWith('place_id:')) {
        return { placeId: wp.replace('place_id:', '') };
      }
      return { address: wp };
    };

    const payload = {
      origin: parseWaypoint(origin),
      destination: parseWaypoint(destination),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: false
      }
    };

    return makeRequest('/directions', payload);
  },

  async getPlaceDetails(placeId: string): Promise<ServiceResult<{ result?: ScoutPlaceRaw; status?: string }>> {
    return makeRequest('/places/details', {
      place_id: placeId,
    });
  },
};
