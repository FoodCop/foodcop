export interface LocationData {
  lat: number;
  lng: number;
  name: string;
  address: string;
  rating: number;
  types: string[];
  place_id: string;
}

class MapLibreLocationServiceImpl {
  /**
   * Search for places using MapLibre and external APIs
   */
  async searchPlaces(
    query: string,
    center: { lat: number; lng: number },
    type: string = "restaurant"
  ): Promise<LocationData[]> {
    console.log("🔍 MapLibre search places:", { query, center, type });

    try {
      // Try to use a real geocoding service first
      const results = await this.searchWithGeocodingAPI(query, center, type);
      if (results.length > 0) {
        return results;
      }
    } catch (error) {
      console.warn(
        "⚠️ Geocoding API failed, falling back to empty results:",
        error
      );
    }

    // Return empty results instead of mock data
    console.log("📭 No places found for query:", query);
    return [];
  }

  /**
   * Search using a real geocoding API (e.g., Mapbox, OpenCage, etc.)
   */
  private async searchWithGeocodingAPI(
    query: string,
    center: { lat: number; lng: number },
    type: string
  ): Promise<LocationData[]> {
    // This would integrate with a real geocoding service
    // For now, return empty array to avoid mock data
    console.log("🌐 Geocoding API not implemented yet");
    return [];
  }

  /**
   * Get nearby places using MapLibre
   */
  async getNearbyPlaces(
    center: { lat: number; lng: number },
    type: string = "restaurant",
    radius: number = 1000
  ): Promise<LocationData[]> {
    console.log("📍 MapLibre nearby places:", { center, type, radius });

    try {
      // Try to use a real places API
      const results = await this.searchWithPlacesAPI(center, type, radius);
      if (results.length > 0) {
        return results;
      }
    } catch (error) {
      console.warn(
        "⚠️ Places API failed, falling back to empty results:",
        error
      );
    }

    // Return empty results instead of mock data
    console.log("📭 No nearby places found");
    return [];
  }

  /**
   * Search using a real places API
   */
  private async searchWithPlacesAPI(
    center: { lat: number; lng: number },
    type: string,
    radius: number
  ): Promise<LocationData[]> {
    // This would integrate with a real places service
    // For now, return empty array to avoid mock data
    console.log("🌐 Places API not implemented yet");
    return [];
  }
}

// Export singleton instance
export const mapLibreLocationService = new MapLibreLocationServiceImpl();
