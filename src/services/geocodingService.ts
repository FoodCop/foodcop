import type { 
  GeocodingParams, 
  GeocodingResult, 
  GoogleGeocodingResponse, 
  LocationCoordinates 
} from '../types/geocoding';

/**
 * Geocoding service for Vite application
 * Provides reverse geocoding using Google Maps API with fallback handling
 */
export class GeocodingService {
  private static readonly API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  private static readonly BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

  /**
   * Reverse geocode coordinates to address
   */
  static async reverseGeocode(params: GeocodingParams): Promise<GeocodingResult> {
    try {
      const { lat, lng } = params;

      // Validate coordinates
      if (!lat || !lng) {
        throw new Error('Latitude and longitude are required');
      }

      if (lat < -90 || lat > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }

      if (lng < -180 || lng > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }

      // If no API key, return fallback response
      if (!this.API_KEY) {
        console.warn('Google Maps API key not found, using coordinate fallback');
        return {
          success: true,
          address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          fallback: true
        };
      }

      console.log('🌍 Reverse geocoding coordinates:', { lat, lng });

      // Make request to Google Geocoding API
      const url = `${this.BASE_URL}?latlng=${lat},${lng}&key=${this.API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GoogleGeocodingResponse = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        let address = result.formatted_address;
        
        // Try to find a more specific address (restaurant, business, etc.)
        const establishment = data.results.find((r) => 
          r.types.includes('establishment') || 
          r.types.includes('restaurant') ||
          r.types.includes('food') ||
          r.types.includes('meal_takeaway') ||
          r.types.includes('meal_delivery')
        );
        
        if (establishment) {
          address = establishment.formatted_address;
          console.log('🍽️ Found establishment:', establishment.formatted_address);
        }

        console.log('✅ Geocoding successful:', address);
        return {
          success: true,
          address,
          fullResult: result
        };
      } else if (data.status === 'ZERO_RESULTS') {
        console.log('📍 No results found, using coordinate fallback');
        return {
          success: true,
          address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          fallback: true
        };
      } else {
        console.error('Geocoding API error:', data.status, data.error_message);
        
        // Handle specific error cases
        if (data.status === 'OVER_QUERY_LIMIT') {
          throw new Error('Geocoding quota exceeded. Please try again later.');
        } else if (data.status === 'REQUEST_DENIED') {
          throw new Error('Geocoding request denied. Please check API key.');
        } else {
          throw new Error(`Geocoding failed: ${data.status}`);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      
      // Return fallback coordinates on error
      return {
        success: false,
        address: `${params.lat.toFixed(4)}, ${params.lng.toFixed(4)}`,
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown geocoding error'
      };
    }
  }

  /**
   * Forward geocode address to coordinates (opposite of reverse geocoding)
   */
  static async forwardGeocode(address: string): Promise<GeocodingResult & { coordinates?: LocationCoordinates }> {
    try {
      if (!address || address.trim().length === 0) {
        throw new Error('Address is required');
      }

      if (!this.API_KEY) {
        throw new Error('Google Maps API key not found');
      }

      console.log('📍 Forward geocoding address:', address);

      const encodedAddress = encodeURIComponent(address.trim());
      const url = `${this.BASE_URL}?address=${encodedAddress}&key=${this.API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GoogleGeocodingResponse = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const coordinates = {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng
        };

        console.log('✅ Forward geocoding successful:', result.formatted_address, coordinates);
        return {
          success: true,
          address: result.formatted_address,
          fullResult: result,
          coordinates
        };
      } else if (data.status === 'ZERO_RESULTS') {
        throw new Error('No results found for the provided address');
      } else {
        console.error('Forward geocoding API error:', data.status, data.error_message);
        
        if (data.status === 'OVER_QUERY_LIMIT') {
          throw new Error('Geocoding quota exceeded. Please try again later.');
        } else if (data.status === 'REQUEST_DENIED') {
          throw new Error('Geocoding request denied. Please check API key.');
        } else {
          throw new Error(`Forward geocoding failed: ${data.status}`);
        }
      }
    } catch (error) {
      console.error('Forward geocoding error:', error);
      return {
        success: false,
        address: '',
        error: error instanceof Error ? error.message : 'Unknown forward geocoding error'
      };
    }
  }

  /**
   * Get current user location using browser geolocation API
   */
  static async getCurrentLocation(): Promise<LocationCoordinates | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser');
        resolve(null);
        return;
      }

      console.log('📱 Getting current location...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          console.log('✅ Current location obtained:', coordinates);
          resolve(coordinates);
        },
        (error) => {
          console.error('Geolocation error:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // Cache for 1 minute
        }
      );
    });
  }

  /**
   * Get current location and reverse geocode to address
   */
  static async getCurrentLocationAddress(): Promise<GeocodingResult> {
    try {
      const coordinates = await this.getCurrentLocation();
      
      if (!coordinates) {
        throw new Error('Could not obtain current location');
      }

      return await this.reverseGeocode({
        lat: coordinates.latitude,
        lng: coordinates.longitude
      });
    } catch (error) {
      console.error('Error getting current location address:', error);
      return {
        success: false,
        address: '',
        error: error instanceof Error ? error.message : 'Could not get current location'
      };
    }
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  static calculateDistance(
    coord1: LocationCoordinates, 
    coord2: LocationCoordinates
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLng = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) * 
      Math.cos(this.toRadians(coord2.latitude)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check if API key is available
   */
  static isApiKeyAvailable(): boolean {
    return !!this.API_KEY;
  }

  /**
   * Validate coordinates
   */
  static validateCoordinates(lat: number, lng: number): boolean {
    return (
      typeof lat === 'number' && 
      typeof lng === 'number' &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180 &&
      !isNaN(lat) && !isNaN(lng)
    );
  }
}