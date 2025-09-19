import { API_CONFIG } from "../config/apiConfig";

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy?: number;
  city?: string;
  region?: string;
  country?: string;
  method: "browser" | "ip_geolocation" | "default";
  timestamp: string;
  fallback?: boolean;
}

export interface NearbyRestaurantsResult {
  restaurants: any[];
  location: {
    latitude: number;
    longitude: number;
  };
  searchRadius: number;
  totalResults: number;
  method: string;
  timestamp: string;
}

class GeolocationService {
  private currentLocation: GeolocationResult | null = null;
  private locationCacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastLocationTime: number = 0;

  /**
   * Get the user's current location using multiple methods:
   * 1. Browser geolocation API (most accurate)
   * 2. IP-based geolocation via backend (fallback)
   * 3. Default location (final fallback)
   */
  async getCurrentLocation(
    useCache: boolean = true
  ): Promise<GeolocationResult> {
    console.log("📍 GeolocationService: Getting current location...");
    console.log("🔧 Debug info:", {
      useCache,
      hasCachedLocation: !!this.currentLocation,
      cacheValid: this.isLocationCacheValid(),
      cacheAge: this.currentLocation
        ? Date.now() - this.lastLocationTime
        : "no cache",
      environment: {
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        userAgent: navigator.userAgent.substring(0, 100),
      },
    });

    // Return cached location if valid and caching is enabled
    if (useCache && this.currentLocation && this.isLocationCacheValid()) {
      console.log("✅ Using cached location:", this.currentLocation);
      return this.currentLocation;
    }

    try {
      // Method 1: Try browser geolocation API first
      const browserLocation = await this.getBrowserLocation();
      if (browserLocation) {
        this.setCurrentLocation(browserLocation);
        return browserLocation;
      }
    } catch (error) {
      console.warn("⚠️ Browser geolocation failed:", error);
    }

    try {
      // Method 2: Try IP-based geolocation via backend
      const ipLocation = await this.getIPLocation();
      if (ipLocation) {
        this.setCurrentLocation(ipLocation);
        return ipLocation;
      }
    } catch (error) {
      console.warn("⚠️ IP geolocation failed:", error);
    }

    // Method 3: Use default location as final fallback
    const defaultLocation = this.getDefaultLocation();
    this.setCurrentLocation(defaultLocation);
    return defaultLocation;
  }

  /**
   * Get location using browser geolocation API
   */
  private async getBrowserLocation(): Promise<GeolocationResult | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log("❌ Geolocation not supported by browser");
        resolve(null);
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("✅ Browser geolocation successful");
          const result: GeolocationResult = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            method: "browser",
            timestamp: new Date().toISOString(),
          };
          resolve(result);
        },
        (error) => {
          console.log("❌ Browser geolocation error:", error.message);
          resolve(null);
        },
        options
      );
    });
  }

  /**
   * Get location using IP-based geolocation via backend
   */
  private async getIPLocation(): Promise<GeolocationResult | null> {
    try {
      console.log("🌐 Attempting IP-based geolocation...");

      const response = await fetch(
        `${API_CONFIG.BACKEND_URL}/api/geolocation/ip`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ IP geolocation successful:", data);

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        region: data.region,
        country: data.country,
        method: "ip_geolocation",
        timestamp: new Date().toISOString(),
        fallback: true,
      };
    } catch (error) {
      console.error("❌ IP geolocation failed:", error);
      return null;
    }
  }

  /**
   * Get default location (San Francisco)
   */
  private getDefaultLocation(): GeolocationResult {
    console.log("🏠 Using default location (San Francisco)");
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      city: "San Francisco",
      region: "California",
      country: "United States",
      method: "default",
      timestamp: new Date().toISOString(),
      fallback: true,
    };
  }

  /**
   * Set current location and update cache timestamp
   */
  private setCurrentLocation(location: GeolocationResult): void {
    this.currentLocation = location;
    this.lastLocationTime = Date.now();
    console.log("💾 Location cached:", location);
  }

  /**
   * Check if cached location is still valid
   */
  private isLocationCacheValid(): boolean {
    if (!this.currentLocation) return false;
    return Date.now() - this.lastLocationTime < this.locationCacheExpiry;
  }

  /**
   * Get nearby restaurants using Google Places API via backend
   */
  async getNearbyRestaurants(
    location: GeolocationResult,
    radius: number = 5000,
    type: string = "restaurant"
  ): Promise<NearbyRestaurantsResult> {
    console.log("🍽️ Getting nearby restaurants...", { location, radius, type });

    try {
      const response = await fetch(
        `${API_CONFIG.BACKEND_URL}/api/places/nearby`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location: {
              lat: location.latitude,
              lng: location.longitude,
            },
            radius,
            type,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Nearby restaurants loaded:", data);

      return {
        restaurants: data.results || [],
        location: {
          latitude:
            data.search_location?.lat ||
            data.location?.lat ||
            location.latitude,
          longitude:
            data.search_location?.lng ||
            data.location?.lng ||
            location.longitude,
        },
        searchRadius: data.search_radius || data.radius || radius,
        totalResults: data.results?.length || 0,
        method: "google_places",
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Failed to get nearby restaurants:", error);

      // Return empty result instead of mock data
      return {
        restaurants: [],
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        searchRadius: radius,
        totalResults: 0,
        method: "error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Search restaurants by location and query
   */
  async searchRestaurantsByLocation(
    location: GeolocationResult,
    query: string,
    radius: number = 5000
  ): Promise<NearbyRestaurantsResult> {
    console.log("🔍 Searching restaurants by location and query...", {
      location,
      query,
      radius,
    });

    try {
      const response = await fetch(
        `${API_CONFIG.BACKEND_URL}/api/places/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location: {
              lat: location.latitude,
              lng: location.longitude,
            },
            query,
            radius,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Restaurant search completed:", data);

      return {
        restaurants: data.results || [],
        location: {
          latitude:
            data.search_location?.lat ||
            data.location?.lat ||
            location.latitude,
          longitude:
            data.search_location?.lng ||
            data.location?.lng ||
            location.longitude,
        },
        searchRadius: data.search_radius || data.radius || radius,
        totalResults: data.results?.length || 0,
        method: "google_places_search",
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Location-based search failed:", error);
      return {
        restaurants: [],
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        searchRadius: radius,
        totalResults: 0,
        method: "error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get current cached location
   */
  getCurrentCachedLocation(): GeolocationResult | null {
    return this.currentLocation;
  }

  /**
   * Clear location cache
   */
  clearLocationCache(): void {
    this.currentLocation = null;
    this.lastLocationTime = 0;
  }

  /**
   * Get location info for display purposes
   */
  getLocationDisplayInfo(): string {
    if (!this.currentLocation) {
      return "Location not available";
    }

    const { city, region, country, method } = this.currentLocation;

    if (city && region) {
      return `${city}, ${region}`;
    } else if (country) {
      return country;
    } else {
      return `${this.currentLocation.latitude.toFixed(
        3
      )}, ${this.currentLocation.longitude.toFixed(3)}`;
    }
  }

  /**
   * Get location method for debugging
   */
  getLocationMethod(): string {
    return this.currentLocation?.method || "unknown";
  }

  /**
   * Check if location is from fallback
   */
  isLocationFallback(): boolean {
    return this.currentLocation?.fallback || false;
  }
}

// Export singleton instance
export const geolocationService = new GeolocationService();

