/**
 * GEOSPATIAL PLACES SERVICE
 * Ported from legacy/fuzoapp/src/services/placesService.ts
 * All requests go through /api/places/[action] (a direct Next.js Route
 * Handler using the server-side Google Maps key), not a Supabase Edge
 * Function - the legacy SUPABASE_URL/ANON_KEY/EDGE_URL constants pointing at
 * a "make-server-5976446e" edge function were dead code (never referenced
 * below), left over from the port and removed.
 */

/** Routes API travel modes offered in FUZO's Directions panel. */
export type TravelMode = 'DRIVE' | 'TWO_WHEELER' | 'WALK';

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
  /** Why Google was refused: 'sign_in' | 'user_limit' | 'daily_limit' | 'unavailable' (lib/google/limits). */
  code?: string;
}

// The same question in the same tab within 10 minutes reuses the answer, e.g.
// going Home -> Explore -> Home. Kept in memory only and never saved.
const REUSE_MS = 10 * 60 * 1000;
const answers = new Map<string, { at: number; result: Promise<ServiceResult<unknown>> }>();

function reused<T>(key: string, ask: () => Promise<ServiceResult<T>>): Promise<ServiceResult<T>> {
  const known = answers.get(key);
  if (known && Date.now() - known.at < REUSE_MS) return known.result as Promise<ServiceResult<T>>;
  const result = ask().then((res) => {
    if (!res.success) answers.delete(key); // a failed call may work next time
    return res;
  });
  answers.set(key, { at: Date.now(), result });
  if (answers.size > 100) answers.delete(answers.keys().next().value as string);
  return result;
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
        code: data?.code,
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
  async searchNearby(latitude: number, longitude: number, radius = 5000): Promise<ServiceResult<{ results: ScoutPlaceRaw[]; status?: string; error_message?: string; next_page_token?: string }>> {
    return reused(`nearby:${latitude.toFixed(3)},${longitude.toFixed(3)},${radius}`, () =>
      makeRequest('/places/nearby', { latitude, longitude, radius }),
    );
  },

  /** The next page of a nearby / text search, when the user asks for more (Google's next_page_token; ~2s before it's valid). */
  async nextPage(kind: 'nearby' | 'textsearch', pagetoken: string): Promise<ServiceResult<{ results: ScoutPlaceRaw[]; status?: string; next_page_token?: string }>> {
    return makeRequest(`/places/${kind}`, { pagetoken });
  },

  async searchByText(query: string, latitude: number, longitude: number, radius = 50000): Promise<ServiceResult<{ results: ScoutPlaceRaw[]; status?: string; error_message?: string; next_page_token?: string }>> {
    return reused(`text:${query.trim().toLowerCase()}:${latitude.toFixed(3)},${longitude.toFixed(3)},${radius}`, () =>
      makeRequest('/places/textsearch', { query, location: { lat: latitude, lng: longitude }, radius }),
    );
  },

  /** Places close to a route line (Directions' "Food along the way"). */
  async searchAlongRoute(polyline: string): Promise<ServiceResult<{ results: ScoutPlaceRaw[]; status?: string }>> {
    return reused(`along:${polyline}`, () => makeRequest('/places/search-along-route', { polyline }));
  },


  async getDirections(
    origin: string | { lat: number; lng: number },
    destination: string | { lat: number; lng: number },
    travelMode: TravelMode = 'DRIVE',
  ): Promise<ServiceResult<{ routes: any[]; status: string }>> {
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
      travelMode,
      computeAlternativeRoutes: false,
      // Step texts follow the user's language (the API otherwise guesses from the route's region).
      languageCode: typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en',
    };

    return makeRequest('/directions', payload);
  },

  async getPlaceDetails(placeId: string): Promise<ServiceResult<{ result?: ScoutPlaceRaw; status?: string }>> {
    return reused(`details:${placeId}`, () => makeRequest('/places/details', { place_id: placeId }));
  },
};
