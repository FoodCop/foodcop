/**
 * Map Utilities
 * Helper functions for Google Maps integration
 */

export interface MapMarker {
  id: string;
  position: google.maps.LatLngLiteral;
  title: string;
  icon?: google.maps.Icon | google.maps.Symbol | string;
  data?: unknown;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Creates a custom marker icon with specified color
 */
export function createCustomMarkerIcon(
  color: string = '#ef4444',
  scale: number = 1
): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
    scale: 8 * scale,
  };
}

/**
 * Creates a user location marker icon
 */
export function createUserLocationIcon(): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: '#3b82f6',
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 3,
    scale: 10,
  };
}

/**
 * Creates a restaurant marker icon
 */
export function createRestaurantMarkerIcon(isSelected: boolean = false): google.maps.Icon {
  const color = isSelected ? 'red' : 'orange';
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
        <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 24 16 24s16-12 16-24C32 7.2 24.8 0 16 0z" fill="${color === 'red' ? '#ef4444' : '#f97316'}"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>
    `)}`,
    scaledSize: new google.maps.Size(32, 40),
    anchor: new google.maps.Point(16, 40),
  };
}

/**
 * Fits map bounds to include all markers
 */
export function fitMapBounds(
  map: google.maps.Map,
  markers: MapMarker[],
  padding: number = 50
): void {
  if (markers.length === 0) return;

  const bounds = new google.maps.LatLngBounds();
  markers.forEach(marker => {
    bounds.extend(marker.position);
  });

  map.fitBounds(bounds, padding);
}

/**
 * Calculates the center point of multiple coordinates
 */
export function calculateCenter(positions: google.maps.LatLngLiteral[]): google.maps.LatLngLiteral {
  if (positions.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const sum = positions.reduce(
    (acc, pos) => ({
      lat: acc.lat + pos.lat,
      lng: acc.lng + pos.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / positions.length,
    lng: sum.lng / positions.length,
  };
}

/**
 * Decodes a polyline string into an array of LatLng coordinates
 */
export function decodePolyline(encoded: string): google.maps.LatLngLiteral[] {
  const poly: google.maps.LatLngLiteral[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return poly;
}

/**
 * Gets map bounds as an object
 */
export function getMapBounds(map: google.maps.Map): MapBounds | null {
  const bounds = map.getBounds();
  if (!bounds) return null;

  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  return {
    north: ne.lat(),
    south: sw.lat(),
    east: ne.lng(),
    west: sw.lng(),
  };
}

/**
 * Calculates zoom level to fit a radius in meters
 */
export function getZoomForRadius(radiusMeters: number): number {
  // Approximate zoom levels for different radii
  // Earth's circumference at equator ≈ 40,075,017 meters
  const EARTH_CIRCUMFERENCE = 40075017;
  const zoom = Math.log2(EARTH_CIRCUMFERENCE / (radiusMeters * 2)) - 8;
  return Math.max(1, Math.min(20, Math.round(zoom)));
}

/**
 * Formats distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Creates a bounds object from center and radius
 */
export function createBoundsFromRadius(
  center: google.maps.LatLngLiteral,
  radiusMeters: number
): google.maps.LatLngBounds {
  // Approximate degrees per meter (varies by latitude)
  const metersPerDegree = 111320; // at equator
  const deltaLat = radiusMeters / metersPerDegree;
  const deltaLng = radiusMeters / (metersPerDegree * Math.cos((center.lat * Math.PI) / 180));

  return new google.maps.LatLngBounds(
    { lat: center.lat - deltaLat, lng: center.lng - deltaLng },
    { lat: center.lat + deltaLat, lng: center.lng + deltaLng }
  );
}
