/**
 * Google Directions API Service
 * Provides routing and navigation features for the Scout map
 */

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export type TravelMode = 'DRIVING' | 'WALKING' | 'TRANSIT' | 'BICYCLING';

export interface RouteStep {
  instruction: string;
  distance: {
    text: string;
    value: number; // meters
  };
  duration: {
    text: string;
    value: number; // seconds
  };
  startLocation: {
    lat: number;
    lng: number;
  };
  endLocation: {
    lat: number;
    lng: number;
  };
  maneuver?: string;
  polyline: string;
}

export interface Route {
  summary: string;
  legs: {
    distance: {
      text: string;
      value: number;
    };
    duration: {
      text: string;
      value: number;
    };
    startAddress: string;
    endAddress: string;
    steps: RouteStep[];
  }[];
  overviewPolyline: string;
  bounds: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  warnings: string[];
}

export interface DirectionsResponse {
  routes: Route[];
  status: string;
  errorMessage?: string;
}

/**
 * Decode Google's encoded polyline format to lat/lng coordinates
 * Algorithm from: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    // Decode latitude
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    // Decode longitude
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

/**
 * Get directions between two points
 */
export async function getDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: TravelMode = 'DRIVING',
  alternatives = false
): Promise<DirectionsResponse> {
  if (!API_KEY) {
    console.warn('Google Maps API key not configured');
    return {
      routes: [],
      status: 'REQUEST_DENIED',
      errorMessage: 'API key not configured'
    };
  }

  try {
    // Use backend service for directions API
    const { backendService } = await import('./backendService');
    
    const params = {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode: mode.toLowerCase(),
      alternatives: alternatives.toString()
    };

    console.log('🗺️ Requesting directions:', params);

    const response = await backendService.getDirections(params);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Directions API error');
    }

    const data = response.data;

    if (data.status !== 'OK') {
      console.error('Directions API error:', data.status, data.error_message);
      return {
        routes: [],
        status: data.status,
        errorMessage: data.error_message
      };
    }

    console.log('✅ Directions received:', data.routes.length, 'route(s)');

    // Transform the response to our format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const routes: Route[] = data.routes.map((route: Record<string, any>) => ({
      summary: route.summary || '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      legs: route.legs.map((leg: Record<string, any>) => ({
        distance: leg.distance,
        duration: leg.duration,
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        steps: leg.steps.map((step: Record<string, any>) => ({
          instruction: step.html_instructions?.replace(/<[^>]*>/g, '') || '',
          distance: step.distance,
          duration: step.duration,
          startLocation: {
            lat: step.start_location.lat,
            lng: step.start_location.lng
          },
          endLocation: {
            lat: step.end_location.lat,
            lng: step.end_location.lng
          },
          maneuver: step.maneuver,
          polyline: step.polyline?.points || ''
        }))
      })),
      overviewPolyline: route.overview_polyline?.points || '',
      bounds: route.bounds,
      warnings: route.warnings || []
    }));

    return {
      routes,
      status: data.status
    };
  } catch (error) {
    console.error('Error fetching directions:', error);
    return {
      routes: [],
      status: 'UNKNOWN_ERROR',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Calculate estimated travel time based on distance
 * Fallback when Directions API is unavailable
 */
export function estimateTravelTime(distanceKm: number, mode: TravelMode): string {
  const speeds = {
    DRIVING: 40, // km/h average in city
    WALKING: 5,  // km/h
    TRANSIT: 25, // km/h average
    BICYCLING: 15 // km/h
  };

  const speedKmh = speeds[mode];
  const hours = distanceKm / speedKmh;
  const minutes = Math.round(hours * 60);

  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}min` : `${hrs}h`;
  }
}

/**
 * Get icon for travel mode
 */
export function getTravelModeIcon(mode: TravelMode): string {
  const icons = {
    DRIVING: '🚗',
    WALKING: '🚶',
    TRANSIT: '🚌',
    BICYCLING: '🚴'
  };
  return icons[mode];
}

/**
 * Get icon for maneuver type
 */
export function getManeuverIcon(maneuver?: string): string {
  if (!maneuver) return '➡️';
  
  const icons: Record<string, string> = {
    'turn-left': '⬅️',
    'turn-right': '➡️',
    'turn-slight-left': '↖️',
    'turn-slight-right': '↗️',
    'turn-sharp-left': '⬅️',
    'turn-sharp-right': '➡️',
    'uturn-left': '↩️',
    'uturn-right': '↪️',
    'straight': '⬆️',
    'ramp-left': '↖️',
    'ramp-right': '↗️',
    'merge': '⤴️',
    'fork-left': '↖️',
    'fork-right': '↗️',
    'ferry': '⛴️',
    'roundabout-left': '↺',
    'roundabout-right': '↻'
  };

  return icons[maneuver] || '➡️';
}

export const GoogleDirectionsService = {
  getDirections,
  decodePolyline,
  estimateTravelTime,
  getTravelModeIcon,
  getManeuverIcon
};

export default GoogleDirectionsService;
