/**
 * Google Directions API Service
 * Provides routing and navigation features for the Scout map
 * Routes requests through backend to avoid CORS issues
 */

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
 * Get directions between two points using Google Maps JavaScript API DirectionsService
 * This avoids CORS issues as it uses the client-side API
 */
export async function getDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: TravelMode = 'DRIVING',
  alternatives = false
): Promise<DirectionsResponse> {
  try {
    console.log('🗺️ Requesting directions via Google Maps JS API:', {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode
    });

    // Wait for Google Maps to be loaded
    if (!window.google?.maps?.DirectionsService) {
      console.warn('⚠️ Google Maps not loaded, using estimated route');
      const estimatedDistance = calculateStraightLineDistance(origin, destination);
      const estimatedTime = estimateTravelTime(estimatedDistance, mode);
      return createEstimatedRoute(origin, destination, estimatedDistance, estimatedTime, mode);
    }

    const directionsService = new google.maps.DirectionsService();
    
    // Map our TravelMode to Google's TravelMode
    const googleTravelMode: google.maps.TravelMode = {
      'DRIVING': google.maps.TravelMode.DRIVING,
      'WALKING': google.maps.TravelMode.WALKING,
      'BICYCLING': google.maps.TravelMode.BICYCLING,
      'TRANSIT': google.maps.TravelMode.TRANSIT,
    }[mode] || google.maps.TravelMode.DRIVING;

    const result = await directionsService.route({
      origin: new google.maps.LatLng(origin.lat, origin.lng),
      destination: new google.maps.LatLng(destination.lat, destination.lng),
      travelMode: googleTravelMode,
      provideRouteAlternatives: alternatives,
    });

    if (result.routes && result.routes.length > 0) {
      console.log('✅ Directions received from Google Maps JS API:', result.routes.length, 'route(s)');
      return processGoogleMapsJsResponse(result);
    }
    
    // Fallback to estimated route
    console.warn('⚠️ No routes returned, using estimated route');
    const estimatedDistance = calculateStraightLineDistance(origin, destination);
    const estimatedTime = estimateTravelTime(estimatedDistance, mode);
    return createEstimatedRoute(origin, destination, estimatedDistance, estimatedTime, mode);
  } catch (error) {
    console.error('Error fetching directions:', error);
    
    // Fallback to estimated route on error
    const estimatedDistance = calculateStraightLineDistance(origin, destination);
    const estimatedTime = estimateTravelTime(estimatedDistance, mode);
    return createEstimatedRoute(origin, destination, estimatedDistance, estimatedTime, mode);
  }
}

/**
 * Process Google Maps JavaScript API DirectionsResult
 */
function processGoogleMapsJsResponse(result: google.maps.DirectionsResult): DirectionsResponse {
  const routes: Route[] = result.routes.map((route) => {
    const leg = route.legs[0]; // Primary leg
    
    return {
      summary: route.summary || '',
      legs: route.legs.map((leg) => ({
        distance: {
          text: leg.distance?.text || '',
          value: leg.distance?.value || 0
        },
        duration: {
          text: leg.duration?.text || '',
          value: leg.duration?.value || 0
        },
        startAddress: leg.start_address || '',
        endAddress: leg.end_address || '',
        steps: leg.steps.map((step) => ({
          instruction: step.instructions || '',
          distance: {
            text: step.distance?.text || '',
            value: step.distance?.value || 0
          },
          duration: {
            text: step.duration?.text || '',
            value: step.duration?.value || 0
          },
          startLocation: {
            lat: step.start_location?.lat() || 0,
            lng: step.start_location?.lng() || 0
          },
          endLocation: {
            lat: step.end_location?.lat() || 0,
            lng: step.end_location?.lng() || 0
          },
          maneuver: step.maneuver,
          polyline: step.polyline?.points || ''
        }))
      })),
      overviewPolyline: route.overview_polyline?.points || '',
      bounds: {
        northeast: {
          lat: route.bounds?.getNorthEast()?.lat() || 0,
          lng: route.bounds?.getNorthEast()?.lng() || 0
        },
        southwest: {
          lat: route.bounds?.getSouthWest()?.lat() || 0,
          lng: route.bounds?.getSouthWest()?.lng() || 0
        }
      },
      warnings: route.warnings || []
    };
  });

  return {
    routes,
    status: 'OK'
  };
}

/**
 * Calculate straight-line distance between two points (Haversine formula)
 */
function calculateStraightLineDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
 * Create an estimated route when Directions API is unavailable
 */
function createEstimatedRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  distanceKm: number,
  estimatedTime: string,
  mode: TravelMode
): DirectionsResponse {
  const distanceMeters = Math.round(distanceKm * 1000);
  const durationSeconds = Math.round((distanceKm / (mode === 'WALKING' ? 5 : mode === 'BICYCLING' ? 15 : 40)) * 3600);

  // Create a simple straight-line polyline
  const points: [number, number][] = [[origin.lat, origin.lng], [destination.lat, destination.lng]];
  const polyline = encodePolyline(points);

  return {
    routes: [{
      summary: 'Estimated route',
      legs: [{
        distance: {
          text: `${distanceKm.toFixed(1)} km`,
          value: distanceMeters
        },
        duration: {
          text: estimatedTime,
          value: durationSeconds
        },
        startAddress: `${origin.lat.toFixed(6)}, ${origin.lng.toFixed(6)}`,
        endAddress: `${destination.lat.toFixed(6)}, ${destination.lng.toFixed(6)}`,
        steps: [{
          instruction: `Head towards destination (${mode.toLowerCase()})`,
          distance: {
            text: `${distanceKm.toFixed(1)} km`,
            value: distanceMeters
          },
          duration: {
            text: estimatedTime,
            value: durationSeconds
          },
          startLocation: origin,
          endLocation: destination,
          polyline: polyline
        }]
      }],
      overviewPolyline: polyline,
      bounds: {
        northeast: {
          lat: Math.max(origin.lat, destination.lat),
          lng: Math.max(origin.lng, destination.lng)
        },
        southwest: {
          lat: Math.min(origin.lat, destination.lat),
          lng: Math.min(origin.lng, destination.lng)
        }
      },
      warnings: ['This is an estimated route. Backend /directions endpoint needed for accurate routing.']
    }],
    status: 'OK'
  };
}

/**
 * Simple polyline encoding for two points
 */
function encodePolyline(points: [number, number][]): string {
  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const [lat, lng] of points) {
    const latE5 = Math.round(lat * 1e5);
    const lngE5 = Math.round(lng * 1e5);
    
    encoded += encodeValue(latE5 - prevLat);
    encoded += encodeValue(lngE5 - prevLng);
    
    prevLat = latE5;
    prevLng = lngE5;
  }

  return encoded;
}

function encodeValue(value: number): string {
  let encoded = '';
  value = value < 0 ? ~(value << 1) : value << 1;
  
  while (value >= 0x20) {
    encoded += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
    value >>= 5;
  }
  
  encoded += String.fromCharCode(value + 63);
  return encoded;
}

/**
 * Process directions response from Google API
 * Handles both Routes API v2 and legacy Directions API formats
 */
function processDirectionsResponse(data: Record<string, unknown>): DirectionsResponse {
  // Routes API v2 doesn't have a status field in the same way
  // Check for routes array first
  const hasRoutes = data.routes && Array.isArray(data.routes) && (data.routes as unknown[]).length > 0;
  
  if (!hasRoutes && data.status && data.status !== 'OK') {
    console.error('Directions API error:', data.status, (data as Record<string, string>).error_message);
    return {
      routes: [],
      status: data.status as string,
      errorMessage: (data as Record<string, string>).error_message
    };
  }

  const apiData = data as { routes: Record<string, unknown>[]; status?: string };
  console.log('✅ Directions received:', apiData.routes.length, 'route(s)');

  // Transform the response to our format
  const routes: Route[] = apiData.routes.map((route: Record<string, unknown>) => {
    const routeData = route as {
      summary?: string;
      legs?: unknown[];
      // Routes API v2 format
      polyline?: { encodedPolyline?: string };
      // Old Directions API format
      overview_polyline?: { points?: string };
      bounds?: {
        northeast?: { lat?: number; lng?: number };
        southwest?: { lat?: number; lng?: number };
      };
      copyrights?: string;
      warnings?: string[];
    };
    
    const legs = (routeData.legs || []) as Record<string, unknown>[];
    
    return {
      summary: routeData.summary || '',
      legs: legs.map((leg: Record<string, unknown>) => {
        const legData = leg as {
          distance?: { text?: string; value?: number };
          duration?: { text?: string; value?: number };
          start_address?: string;
          end_address?: string;
          steps?: unknown[];
        };
        
        const steps = (legData.steps || []) as Record<string, unknown>[];
        
        return {
          distance: {
            text: legData.distance?.text || '',
            value: legData.distance?.value || 0
          },
          duration: {
            text: legData.duration?.text || '',
            value: legData.duration?.value || 0
          },
          startAddress: legData.start_address || '',
          endAddress: legData.end_address || '',
          steps: steps.map((step: Record<string, unknown>) => {
            const stepData = step as {
              distance?: { text?: string; value?: number };
              duration?: { text?: string; value?: number };
              start_location?: { lat?: number; lng?: number };
              end_location?: { lat?: number; lng?: number };
              html_instructions?: string;
              maneuver?: string;
              travel_mode?: string;
              polyline?: { points?: string };
            };
            
            return {
              instruction: stepData.html_instructions || '',
              distance: {
                text: stepData.distance?.text || '',
                value: stepData.distance?.value || 0
              },
              duration: {
                text: stepData.duration?.text || '',
                value: stepData.duration?.value || 0
              },
              startLocation: {
                lat: stepData.start_location?.lat || 0,
                lng: stepData.start_location?.lng || 0
              },
              endLocation: {
                lat: stepData.end_location?.lat || 0,
                lng: stepData.end_location?.lng || 0
              },
              maneuver: stepData.maneuver,
              polyline: stepData.polyline?.points || ''
            };
          })
        };
      }),
      // Support both Routes API v2 (polyline.encodedPolyline) and old Directions API (overview_polyline.points)
      overviewPolyline: routeData.polyline?.encodedPolyline || routeData.overview_polyline?.points || '',
      bounds: {
        northeast: {
          lat: routeData.bounds?.northeast?.lat || 0,
          lng: routeData.bounds?.northeast?.lng || 0
        },
        southwest: {
          lat: routeData.bounds?.southwest?.lat || 0,
          lng: routeData.bounds?.southwest?.lng || 0
        }
      },
      warnings: routeData.warnings || []
    };
  });

  return {
    routes,
    status: apiData.status
  };
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
