import { GeocodingService } from './geocodingService';
import type { GoogleGeocodingResult } from '../types/geocoding';

/**
 * Location data extracted from geocoding
 */
export interface LocationData {
  city?: string;
  state?: string;
  country?: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
}

/**
 * Geolocation service for user location detection and parsing
 */
export class GeolocationService {
  /**
   * Get current location with city, state, country
   */
  static async getCurrentLocationData(): Promise<LocationData | null> {
    try {
      // Get coordinates from browser
      const coordinates = await GeocodingService.getCurrentLocation();
      
      if (!coordinates) {
        console.error('Could not obtain geolocation coordinates');
        return null;
      }

      // Reverse geocode to get address details
      const result = await GeocodingService.reverseGeocode({
        lat: coordinates.latitude,
        lng: coordinates.longitude
      });

      if (!result.success || !result.fullResult) {
        console.error('Reverse geocoding failed');
        return null;
      }

      // Parse location components
      const locationData = this.parseLocationComponents(result.fullResult);

      return {
        ...locationData,
        formatted_address: result.address,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      };
    } catch (error) {
      console.error('Error getting current location data:', error);
      return null;
    }
  }

  /**
   * Parse city, state, country from Google Geocoding result
   */
  private static parseLocationComponents(geocodeResult: GoogleGeocodingResult): {
    city?: string;
    state?: string;
    country?: string;
  } {
    const components = geocodeResult.address_components;
    let city: string | undefined;
    let state: string | undefined;
    let country: string | undefined;

    for (const component of components) {
      const types = component.types;

      // City - try multiple type variations (use first match)
      if (!city && (types.includes('locality') || 
                     types.includes('sublocality') || 
                     types.includes('postal_town') || 
                     types.includes('administrative_area_level_2'))) {
        city = component.long_name;
      }

      // State/Province
      if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }

      // Country
      if (types.includes('country')) {
        country = component.long_name;
      }
    }

    console.log('📍 Parsed location:', { city, state, country });

    return { city, state, country };
  }

  /**
   * Request user permission and get location
   * Returns null if permission denied or error
   */
  static async requestLocationPermission(): Promise<LocationData | null> {
    try {
      if (!navigator.geolocation) {
        console.error('Geolocation not supported by browser');
        return null;
      }

      return await this.getCurrentLocationData();
    } catch (error) {
      console.error('Location permission error:', error);
      return null;
    }
  }

  /**
   * Parse a manually entered city name to get location data
   */
  static async parseManualLocation(cityName: string): Promise<LocationData | null> {
    try {
      if (!cityName || cityName.trim().length === 0) {
        return null;
      }

      const result = await GeocodingService.forwardGeocode(cityName.trim());

      if (!result.success || !result.fullResult || !result.coordinates) {
        return null;
      }

      const locationData = this.parseLocationComponents(result.fullResult);

      return {
        ...locationData,
        formatted_address: result.address,
        latitude: result.coordinates.latitude,
        longitude: result.coordinates.longitude
      };
    } catch (error) {
      console.error('Error parsing manual location:', error);
      return null;
    }
  }

  /**
   * Check if geolocation is available in browser
   */
  static isGeolocationAvailable(): boolean {
    return 'geolocation' in navigator;
  }
}
