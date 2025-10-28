// Geocoding and location service types
export interface GeocodingParams {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  success: boolean;
  address: string;
  fullResult?: GoogleGeocodingResult;
  fallback?: boolean;
  error?: string;
}

export interface GoogleGeocodingResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    location_type: string;
    viewport: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
  };
  place_id: string;
  types: string[];
  address_components: AddressComponent[];
}

export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface GoogleGeocodingResponse {
  results: GoogleGeocodingResult[];
  status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
  error_message?: string;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface AddressInfo {
  formatted_address: string;
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  administrative_area_level_2?: string;
  country?: string;
  postal_code?: string;
}