import { API_CONFIG } from "../config/apiConfig";

export interface Location {
  lat: number;
  lng: number;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  rating: number;
  priceLevel: number;
  photos: string[];
  cuisine: string[];
  location: Location;
  distance: number;
  isOpen: boolean;
  phoneNumber?: string;
  website?: string;
}

export interface RouteInfo {
  distance: string;
  duration: string;
  distanceValue: number;
  durationValue: number;
}

interface ServiceAvailability {
  backend: boolean;
  googleMaps: boolean;
}

class LocationServiceBackend {
  private serviceAvailability: ServiceAvailability | null = null;

  constructor() {
    this.checkServiceAvailability();
  }

  /**
   * Check if backend services are available
   */
  private async checkServiceAvailability(): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      this.serviceAvailability = {
        backend: response.ok,
        googleMaps: response.ok, // Assume Google Maps is available if backend is up
      };

      console.log("🔍 Service availability check:", this.serviceAvailability);
    } catch (error) {
      console.warn("⚠️ Could not check service availability:", error);
      this.serviceAvailability = {
        backend: false,
        googleMaps: false,
      };
    }
  }

  /**
   * Get nearby restaurants using backend Places API
   */
  async getNearbyRestaurants(
    location: Location,
    radius: number = 5000
  ): Promise<Restaurant[]> {
    console.log("🍽️ Getting nearby restaurants via backend...", {
      location,
      radius,
    });

    if (!this.serviceAvailability?.backend) {
      console.warn("❌ Backend service not available");
      return [];
    }

    if (!this.serviceAvailability?.googleMaps) {
      console.warn("⚠️ Google Maps not configured in backend");
      return [];
    }

    try {
      const response = await fetch(
        `${API_CONFIG.BACKEND_URL}/api/places/nearby`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: { lat: location.lat, lng: location.lng },
            radius: radius,
            type: "restaurant",
          }),
        }
      );

      if (!response.ok) {
        console.error("❌ Backend Places search failed:", response.statusText);
        return [];
      }

      const data = await response.json();

      if (data.status !== "OK" || !data.results || data.results.length === 0) {
        console.warn("⚠️ No results from Places API:", data.status);
        return [];
      }

      const restaurants = data.results.map((place: any) =>
        this.formatPlaceToRestaurant(place, location)
      );
      console.log(
        `✅ Found ${restaurants.length} nearby restaurants via backend`
      );
      return restaurants;
    } catch (error) {
      console.error("❌ Backend search error:", error);
      return [];
    }
  }

  /**
   * Search restaurants by query using backend
   */
  async searchRestaurantsByQuery(
    query: string,
    location?: Location
  ): Promise<Restaurant[]> {
    console.log("🔍 Searching restaurants by query via backend...", {
      query,
      location,
    });

    if (
      !this.serviceAvailability?.backend ||
      !this.serviceAvailability?.googleMaps
    ) {
      console.log("⚠️ Backend/Google Maps not available");
      return [];
    }

    try {
      const response = await fetch(
        `${API_CONFIG.BACKEND_URL}/api/places/search`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: query,
            location: location
              ? { lat: location.lat, lng: location.lng }
              : undefined,
            radius: 5000,
          }),
        }
      );

      if (!response.ok) {
        console.error("❌ Backend text search failed:", response.statusText);
        return [];
      }

      const data = await response.json();

      if (data.status !== "OK" || !data.results) {
        console.warn("⚠️ No text search results:", data.status);
        return [];
      }

      const restaurants = data.results.map((place: any) =>
        this.formatPlaceToRestaurant(
          place,
          location || API_CONFIG.DEFAULT_LOCATION
        )
      );
      console.log(
        `✅ Found ${restaurants.length} restaurants for query: ${query}`
      );
      return restaurants;
    } catch (error) {
      console.error("❌ Backend text search error:", error);
      return [];
    }
  }

  /**
   * Get route information between two locations using backend
   */
  async getRouteInfo(
    origin: Location,
    destination: Location
  ): Promise<RouteInfo> {
    console.log("🗺️ Getting route info via backend...", {
      origin,
      destination,
    });

    if (
      !this.serviceAvailability?.backend ||
      !this.serviceAvailability?.googleMaps
    ) {
      console.log("⚠️ Backend service not available, using estimated route");
      return this.getEstimatedRouteInfo(origin, destination);
    }

    try {
      const response = await fetch(
        `${API_CONFIG.BACKEND_URL}/api/distance-matrix`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origins: [{ lat: origin.lat, lng: origin.lng }],
            destinations: [{ lat: destination.lat, lng: destination.lng }],
            travelMode: "DRIVING",
            unitSystem: "METRIC",
          }),
        }
      );

      if (!response.ok) {
        console.error(
          "❌ Backend distance matrix failed:",
          response.statusText
        );
        return this.getEstimatedRouteInfo(origin, destination);
      }

      const data = await response.json();

      if (
        data.status !== "OK" ||
        !data.rows ||
        !data.rows[0] ||
        !data.rows[0].elements[0]
      ) {
        console.warn("⚠️ No route data:", data.status);
        return this.getEstimatedRouteInfo(origin, destination);
      }

      const element = data.rows[0].elements[0];

      if (element.status !== "OK") {
        console.warn("⚠️ Route element error:", element.status);
        return this.getEstimatedRouteInfo(origin, destination);
      }

      return {
        distance: element.distance.text,
        duration: element.duration.text,
        distanceValue: element.distance.value,
        durationValue: element.duration.value,
      };
    } catch (error) {
      console.error("❌ Backend route info error:", error);
      return this.getEstimatedRouteInfo(origin, destination);
    }
  }

  /**
   * Format Google Places API result to Restaurant object
   */
  private formatPlaceToRestaurant(
    place: any,
    userLocation: Location
  ): Restaurant {
    const distance = this.calculateDistance(userLocation, {
      lat: place.geometry?.location?.lat || place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng || place.geometry?.location?.lng,
    });

    return {
      id: place.place_id,
      name: place.name || "Unknown Restaurant",
      address: place.vicinity || "Address not available",
      rating: place.rating || 0,
      priceLevel: place.price_level || 0,
      photos: place.photos
        ? place.photos.map((photo: any) =>
            photo.getUrl ? photo.getUrl() : photo
          )
        : [],
      cuisine: this.extractCuisineFromTypes(place.types || []),
      location: {
        lat: place.geometry?.location?.lat || place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng || place.geometry?.location?.lng,
      },
      distance: distance,
      isOpen: place.opening_hours?.open_now || false,
      phoneNumber: place.formatted_phone_number,
      website: place.website,
    };
  }

  /**
   * Extract cuisine types from Google Places types
   */
  private extractCuisineFromTypes(types: string[]): string[] {
    const cuisineMap: { [key: string]: string } = {
      restaurant: "Restaurant",
      food: "Food",
      meal_takeaway: "Takeaway",
      meal_delivery: "Delivery",
      cafe: "Cafe",
      bakery: "Bakery",
      bar: "Bar",
      night_club: "Nightlife",
      japanese_restaurant: "Japanese",
      korean_restaurant: "Korean",
      chinese_restaurant: "Chinese",
      thai_restaurant: "Thai",
      vietnamese_restaurant: "Vietnamese",
      indian_restaurant: "Indian",
      italian_restaurant: "Italian",
      mexican_restaurant: "Mexican",
      french_restaurant: "French",
      greek_restaurant: "Greek",
      mediterranean_restaurant: "Mediterranean",
      american_restaurant: "American",
      steak_house: "Steakhouse",
      seafood_restaurant: "Seafood",
      pizza_restaurant: "Pizza",
      hamburger_restaurant: "Burgers",
      sandwich_shop: "Sandwiches",
      sushi_restaurant: "Sushi",
      ramen_restaurant: "Ramen",
      noodle_house: "Noodles",
      vegetarian_restaurant: "Vegetarian",
      vegan_restaurant: "Vegan",
      fast_food_restaurant: "Fast Food",
      coffee_shop: "Coffee",
      ice_cream_shop: "Ice Cream",
      dessert_shop: "Desserts",
    };

    const cuisines = types.map((type) => cuisineMap[type]).filter(Boolean);

    return cuisines.length > 0 ? cuisines : ["Restaurant"];
  }

  /**
   * Get estimated route info when backend is not available
   */
  private getEstimatedRouteInfo(
    origin: Location,
    destination: Location
  ): RouteInfo {
    const distance = this.calculateDistance(origin, destination);
    const distanceMiles = distance * 0.621371; // Convert km to miles
    const estimatedDuration = Math.round(distance * 1.5); // Rough estimate: 1.5 minutes per km

    return {
      distance: `${distanceMiles.toFixed(1)} mi`,
      duration: `${estimatedDuration} min`,
      distanceValue: distance * 1000, // Convert to meters
      durationValue: estimatedDuration * 60, // Convert to seconds
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(point1: Location, point2: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) *
        Math.cos(this.toRadians(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const locationServiceBackend = new LocationServiceBackend();
