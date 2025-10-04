// Google Directions API integration for route planning
import { LngLatLike } from 'maplibre-gl';

export interface RouteWaypoint {
  location: {
    lat: number;
    lng: number;
  };
  address?: string;
  name?: string;
}

export interface RouteOptions {
  origin: RouteWaypoint;
  destination: RouteWaypoint;
  waypoints?: RouteWaypoint[];
  travelMode: 'driving' | 'walking' | 'bicycling' | 'transit';
  avoid?: ('tolls' | 'highways' | 'ferries')[];
  alternatives?: boolean;
}

export interface RouteStep {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  end_location: {
    lat: number;
    lng: number;
  };
  html_instructions: string;
  maneuver?: string;
  polyline: {
    points: string;
  };
  start_location: {
    lat: number;
    lng: number;
  };
  travel_mode: string;
}

export interface RouteLeg {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  end_address: string;
  end_location: {
    lat: number;
    lng: number;
  };
  start_address: string;
  start_location: {
    lat: number;
    lng: number;
  };
  steps: RouteStep[];
}

export interface Route {
  bounds: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  copyrights: string;
  legs: RouteLeg[];
  overview_polyline: {
    points: string;
  };
  summary: string;
  warnings: string[];
  waypoint_order: number[];
}

export interface DirectionsResult {
  routes: Route[];
  status: string;
  error_message?: string;
}

// Decode Google polyline to coordinates
export function decodePolyline(polyline: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < polyline.length) {
    let byte = 0;
    let shift = 0;
    let result = 0;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
}

// Get directions from Google Directions API
export async function getDirections(options: RouteOptions): Promise<DirectionsResult> {
  const { origin, destination, waypoints, travelMode, avoid, alternatives } = options;
  
  const params = new URLSearchParams({
    origin: `${origin.location.lat},${origin.location.lng}`,
    destination: `${destination.location.lat},${destination.location.lng}`,
    mode: travelMode,
    key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  if (waypoints && waypoints.length > 0) {
    const waypointStr = waypoints
      .map(wp => `${wp.location.lat},${wp.location.lng}`)
      .join('|');
    params.append('waypoints', waypointStr);
  }

  if (avoid && avoid.length > 0) {
    params.append('avoid', avoid.join('|'));
  }

  if (alternatives) {
    params.append('alternatives', 'true');
  }

  try {
    const response = await fetch(`/api/directions?${params.toString()}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get directions');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching directions:', error);
    throw error;
  }
}

// Convert route to GeoJSON for MapLibre
export function routeToGeoJSON(route: Route): GeoJSON.Feature<GeoJSON.LineString> {
  const coordinates = decodePolyline(route.overview_polyline.points);
  
  return {
    type: 'Feature',
    properties: {
      duration: route.legs.reduce((total, leg) => total + leg.duration.value, 0),
      distance: route.legs.reduce((total, leg) => total + leg.distance.value, 0),
      summary: route.summary,
    },
    geometry: {
      type: 'LineString',
      coordinates,
    },
  };
}

// Get route bounds for map fitting
export function getRouteBounds(route: Route): [[number, number], [number, number]] {
  const { bounds } = route;
  return [
    [bounds.southwest.lng, bounds.southwest.lat],
    [bounds.northeast.lng, bounds.northeast.lat],
  ];
}

// Format duration for display
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Format distance for display
export function formatRouteDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

// Clean HTML instructions for text display
export function cleanInstructions(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

// Travel mode icons
export const TRAVEL_MODE_ICONS = {
  driving: '🚗',
  walking: '🚶',
  bicycling: '🚴',
  transit: '🚌',
} as const;

// Travel mode labels
export const TRAVEL_MODE_LABELS = {
  driving: 'Driving',
  walking: 'Walking',
  bicycling: 'Bicycling',
  transit: 'Transit',
} as const;