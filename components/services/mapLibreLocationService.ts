import { backendService } from './backendService';

export interface LocationData {
  lat: number;
  lng: number;
  name: string;
  address: string;
  rating?: number;
  types: string[];
  place_id: string;
}

export interface MapLibreLocationService {
  searchNearbyPlaces(
    center: { lat: number; lng: number },
    radius: number,
    type: string
  ): Promise<LocationData[]>;
  
  getPlaceDetails(placeId: string): Promise<LocationData | null>;
  
  geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null>;
  
  reverseGeocode(lat: number, lng: number): Promise<string | null>;
}

class MapLibreLocationServiceImpl implements MapLibreLocationService {
  async searchNearbyPlaces(
    center: { lat: number; lng: number },
    radius: number,
    type: string = 'restaurant'
  ): Promise<LocationData[]> {
    try {
      console.log(`🔍 Searching for ${type}s near ${center.lat}, ${center.lng} within ${radius}m`);
      
      // Try backend service first
      const response = await backendService.searchNearbyPlaces(center, radius, type);
      
      if (response.success && response.data?.results) {
        console.log(`✅ Found ${response.data.results.length} places via backend`);
        return response.data.results.map(this.formatGooglePlace);
      }
      
      // Fallback to mock data
      console.log('📍 Using mock location data for MapLibre');
      return this.generateMockPlaces(center, type);
      
    } catch (error) {
      console.warn('Error searching places:', error);
      return this.generateMockPlaces(center, type);
    }
  }

  async getPlaceDetails(placeId: string): Promise<LocationData | null> {
    try {
      const response = await backendService.getPlaceDetails(placeId);
      
      if (response.success && response.data) {
        return this.formatGooglePlace(response.data);
      }
      
      return null;
    } catch (error) {
      console.warn('Error getting place details:', error);
      return null;
    }
  }

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await backendService.geocodeAddress(address);
      
      if (response.success && response.data?.results?.[0]) {
        const location = response.data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      }
      
      return null;
    } catch (error) {
      console.warn('Error geocoding address:', error);
      return null;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const response = await backendService.reverseGeocode(lat, lng);
      
      if (response.success && response.data?.results?.[0]) {
        return response.data.results[0].formatted_address;
      }
      
      return null;
    } catch (error) {
      console.warn('Error reverse geocoding:', error);
      return null;
    }
  }

  private formatGooglePlace(place: any): LocationData {
    return {
      lat: place.geometry?.location?.lat || place.lat,
      lng: place.geometry?.location?.lng || place.lng,
      name: place.name || 'Unknown Place',
      address: place.formatted_address || place.vicinity || 'Unknown Address',
      rating: place.rating,
      types: place.types || [],
      place_id: place.place_id || `mock_${Date.now()}_${Math.random()}`
    };
  }

  private generateMockPlaces(center: { lat: number; lng: number }, type: string): LocationData[] {
    const mockPlaces: LocationData[] = [];
    const placeTypes = {
      restaurant: [
        'Italian Bistro', 'Sushi House', 'Burger Joint', 'Thai Palace', 'Pizza Corner',
        'Mexican Grill', 'French Café', 'Indian Spice', 'Chinese Dragon', 'Greek Taverna'
      ],
      cafe: [
        'Coffee Bean', 'Daily Grind', 'Espresso Bar', 'Morning Brew', 'Café Luna',
        'Steam & Beans', 'Roast House', 'Bean There', 'Caffeine Fix', 'Brew Master'
      ],
      store: [
        'Corner Market', 'City Store', 'Quick Shop', 'Daily Needs', 'Local Mart',
        'Convenience Plus', 'Express Store', 'Neighborhood Shop', 'Easy Mart', 'Fast Stop'
      ]
    };

    const names = placeTypes[type as keyof typeof placeTypes] || placeTypes.restaurant;
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * 2 * Math.PI;
      const distance = 0.002 + (Math.random() * 0.008); // Random distance within ~1km
      
      const lat = center.lat + (distance * Math.cos(angle));
      const lng = center.lng + (distance * Math.sin(angle));
      
      mockPlaces.push({
        lat,
        lng,
        name: names[i % names.length],
        address: `${100 + i * 50} Demo Street`,
        rating: 3.5 + (Math.random() * 1.5), // 3.5 to 5.0
        types: [type, 'establishment'],
        place_id: `mock_${type}_${i}_${Date.now()}`
      });
    }
    
    return mockPlaces;
  }
}

// Export singleton instance
export const mapLibreLocationService = new MapLibreLocationServiceImpl();