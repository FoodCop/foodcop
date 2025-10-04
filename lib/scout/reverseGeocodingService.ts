// Reverse geocoding service for converting coordinates to addresses
// Uses Google Geocoding API through our backend

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: string;
}

export interface AddressResult {
  formatted_address: string;
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
  success: boolean;
  error?: string;
}

export const reverseGeocodingService = {
  /**
   * Convert coordinates to human-readable address
   */
  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<AddressResult> {
    try {
      console.log(`🔍 Reverse geocoding: ${latitude}, ${longitude}`);
      
      const response = await fetch(`/api/debug/google-maps?lat=${latitude}&lng=${longitude}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Geocoding failed');
      }
      
      // Extract address from the response structure
      const formattedAddress = data.location?.formatted_address || 
                              data.formatted_address || 
                              data.locationName || 
                              'Address not available';
      
      console.log('✅ Reverse geocoding successful:', formattedAddress);
      
      return {
        formatted_address: formattedAddress,
        address_components: data.location?.address_components || data.address_components || [],
        success: true
      };
      
    } catch (error) {
      console.error('❌ Reverse geocoding failed:', error);
      
      return {
        formatted_address: 'Address lookup failed',
        address_components: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Extract specific components from address result
   */
  extractAddressComponents(addressResult: AddressResult) {
    const components = addressResult.address_components || [];
    
    const getComponent = (types: string[]) => {
      const component = components.find(comp => 
        types.some(type => comp.types.includes(type))
      );
      return component?.long_name || '';
    };
    
    return {
      street_number: getComponent(['street_number']),
      route: getComponent(['route']),
      neighborhood: getComponent(['neighborhood', 'sublocality']),
      locality: getComponent(['locality']),
      administrative_area_level_1: getComponent(['administrative_area_level_1']),
      administrative_area_level_2: getComponent(['administrative_area_level_2']),
      country: getComponent(['country']),
      postal_code: getComponent(['postal_code'])
    };
  },

  /**
   * Format address components into a concise display format
   */
  formatAddressForDisplay(addressResult: AddressResult): string {
    const components = this.extractAddressComponents(addressResult);
    
    // Create a concise address format
    const parts = [];
    
    // Add street info if available
    if (components.street_number && components.route) {
      parts.push(`${components.street_number} ${components.route}`);
    } else if (components.route) {
      parts.push(components.route);
    }
    
    // Add neighborhood/area
    if (components.neighborhood) {
      parts.push(components.neighborhood);
    }
    
    // Add city
    if (components.locality) {
      parts.push(components.locality);
    }
    
    // Add state
    if (components.administrative_area_level_1) {
      parts.push(components.administrative_area_level_1);
    }
    
    return parts.length > 0 ? parts.join(', ') : addressResult.formatted_address;
  }
};