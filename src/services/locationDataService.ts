import type { MasterSetLocation, LocationQueryParams, LocationCoordinates } from '../types/location';

// Cache for loaded location data
let cachedLocations: MasterSetLocation[] | null = null;
let cacheCity: string | null = null;

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Location Data Service
 * Loads and queries restaurant data from local JSON files
 * Future: Will migrate to R2 storage
 */
export const LocationDataService = {
  /**
   * Load location data from JSON file
   * Currently loads from local /data folder
   * @param city - City identifier (e.g., 'barcelona', 'madrid')
   */
  async loadLocations(city: string = 'barcelona'): Promise<MasterSetLocation[]> {
    // Return cached data if available for same city
    if (cachedLocations && cacheCity === city) {
      console.log(`📍 Using cached locations for ${city} (${cachedLocations.length} items)`);
      return cachedLocations;
    }

    try {
      // Map city to file name
      const fileMap: Record<string, string> = {
        barcelona: 'MasterSet_barcelona.json',
        hongkong: 'MasterSet_hongkong.json',
        mumbai: 'MasterSet_mumbai.json',
        singapore: 'MasterSet_singapore.json',
        bangkok: 'MasterSet_bangkok.json',
        mexicocity: 'MasterSet_mexicocity.json',
        london: 'MasterSet_london.json',
        tokyo: 'MasterSet_tokyo.json',
        paris: 'MasterSet_paris.json',
        newyork: 'MasterSet_newyork.json',
      };

      const fileName = fileMap[city.toLowerCase()] || 'MasterSet_barcelona.json';
      const url = `/data/${fileName}`;

      console.log(`📍 Loading locations from ${url}...`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to load location data: ${response.status}`);
      }

      const data: MasterSetLocation[] = await response.json();
      
      // Cache the loaded data
      cachedLocations = data;
      cacheCity = city;

      console.log(`✅ Loaded ${data.length} locations for ${city}`);
      return data;
    } catch (error) {
      console.error('❌ Error loading location data:', error);
      return [];
    }
  },

  /**
   * Query locations with filtering
   */
  async queryLocations(params: LocationQueryParams = {}): Promise<MasterSetLocation[]> {
    const {
      city = 'barcelona',
      categories,
      minRating,
      maxPrice,
      neighborhood,
      limit = 20,
      offset = 0,
      nearLocation,
      radiusKm = 10,
    } = params;

    let locations = await this.loadLocations(city);

    // Filter by categories
    if (categories && categories.length > 0) {
      locations = locations.filter((loc) =>
        loc.categories.some((cat) =>
          categories.some((c) => cat.toLowerCase().includes(c.toLowerCase()))
        )
      );
    }

    // Filter by minimum rating
    if (minRating !== undefined) {
      locations = locations.filter((loc) => loc.totalScore >= minRating);
    }

    // Filter by max price
    if (maxPrice) {
      const maxPriceLevel = maxPrice.length; // '$' = 1, '$$' = 2, etc.
      locations = locations.filter((loc) => (loc.price?.length || 2) <= maxPriceLevel);
    }

    // Filter by neighborhood
    if (neighborhood) {
      locations = locations.filter((loc) =>
        loc.neighborhood?.toLowerCase().includes(neighborhood.toLowerCase())
      );
    }

    // Filter by proximity to location
    if (nearLocation) {
      locations = locations
        .map((loc) => ({
          ...loc,
          _distance: calculateDistanceKm(
            nearLocation.lat,
            nearLocation.lng,
            loc.location.lat,
            loc.location.lng
          ),
        }))
        .filter((loc) => loc._distance <= radiusKm)
        .sort((a, b) => a._distance - b._distance);
    }

    // Filter out closed locations
    locations = locations.filter(
      (loc) => !loc.permanentlyClosed && !loc.temporarilyClosed
    );

    // Apply pagination
    return locations.slice(offset, offset + limit);
  },

  /**
   * Get a random sample of locations
   */
  async getRandomLocations(
    count: number = 10,
    city: string = 'barcelona'
  ): Promise<MasterSetLocation[]> {
    const locations = await this.loadLocations(city);
    
    // Filter out closed locations
    const openLocations = locations.filter(
      (loc) => !loc.permanentlyClosed && !loc.temporarilyClosed
    );

    // Shuffle and take count
    const shuffled = [...openLocations].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },

  /**
   * Get locations near a coordinate
   */
  async getNearbyLocations(
    location: LocationCoordinates,
    radiusKm: number = 5,
    limit: number = 20,
    city: string = 'barcelona'
  ): Promise<(MasterSetLocation & { distance: number })[]> {
    const locations = await this.loadLocations(city);

    return locations
      .filter((loc) => !loc.permanentlyClosed && !loc.temporarilyClosed)
      .map((loc) => ({
        ...loc,
        distance: calculateDistanceKm(
          location.lat,
          location.lng,
          loc.location.lat,
          loc.location.lng
        ),
      }))
      .filter((loc) => loc.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  },

  /**
   * Get a single location by placeId
   */
  async getLocationById(
    placeId: string,
    city: string = 'barcelona'
  ): Promise<MasterSetLocation | null> {
    const locations = await this.loadLocations(city);
    return locations.find((loc) => loc.placeId === placeId) || null;
  },

  /**
   * Search locations by name or description
   */
  async searchLocations(
    query: string,
    limit: number = 20,
    city: string = 'barcelona'
  ): Promise<MasterSetLocation[]> {
    const locations = await this.loadLocations(city);
    const lowerQuery = query.toLowerCase();

    return locations
      .filter(
        (loc) =>
          !loc.permanentlyClosed &&
          !loc.temporarilyClosed &&
          (loc.title.toLowerCase().includes(lowerQuery) ||
            loc.description?.toLowerCase().includes(lowerQuery) ||
            loc.categoryName?.toLowerCase().includes(lowerQuery) ||
            loc.categories.some((cat) => cat.toLowerCase().includes(lowerQuery)))
      )
      .slice(0, limit);
  },

  /**
   * Get unique categories from loaded data
   */
  async getCategories(city: string = 'barcelona'): Promise<string[]> {
    const locations = await this.loadLocations(city);
    const categorySet = new Set<string>();

    locations.forEach((loc) => {
      loc.categories.forEach((cat) => categorySet.add(cat));
    });

    return Array.from(categorySet).sort();
  },

  /**
   * Get unique neighborhoods from loaded data
   */
  async getNeighborhoods(city: string = 'barcelona'): Promise<string[]> {
    const locations = await this.loadLocations(city);
    const neighborhoodSet = new Set<string>();

    locations.forEach((loc) => {
      if (loc.neighborhood) {
        neighborhoodSet.add(loc.neighborhood);
      }
    });

    return Array.from(neighborhoodSet).sort();
  },

  /**
   * Clear the cache (useful when switching cities)
   */
  clearCache(): void {
    cachedLocations = null;
    cacheCity = null;
    console.log('🗑️ Location cache cleared');
  },

  /**
   * Get available cities
   * Future: This will query R2 for available datasets
   */
  getAvailableCities(): string[] {
    return [
      'barcelona',
      'hongkong',
      'mumbai',
      'singapore',
      'bangkok',
      'mexicocity',
      'london',
      'tokyo',
      'paris',
      'newyork',
    ];
  },
};

export default LocationDataService;

