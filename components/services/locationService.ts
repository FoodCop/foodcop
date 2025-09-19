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

class LocationService {
  /**
   * Get nearby restaurants using Google Places API
   */
  async getNearbyRestaurants(
    location: Location,
    radius: number = 5000
  ): Promise<Restaurant[]> {
    console.log("🍽️ Getting nearby restaurants...", { location, radius });

    return new Promise((resolve) => {
      if (
        typeof window === "undefined" ||
        !window.google ||
        !window.google.maps ||
        !window.google.maps.places
      ) {
        console.warn("❌ Google Maps Places API not loaded");
        resolve([]);
        return;
      }

      const service = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );

      const request = {
        location: new window.google.maps.LatLng(location.lat, location.lng),
        radius: radius,
        type: "restaurant",
        fields: [
          "name",
          "vicinity",
          "rating",
          "price_level",
          "photos",
          "types",
          "opening_hours",
          "place_id",
          "formatted_phone_number",
          "website",
        ],
      };

      service.nearbySearch(request, (results, status) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          results
        ) {
          try {
            const restaurants = results.map((place: any) =>
              this.formatPlaceToRestaurant(place, location)
            );
            console.log(`✅ Found ${restaurants.length} nearby restaurants`);
            resolve(restaurants);
          } catch (formatError) {
            console.error("❌ Error formatting places:", formatError);
            resolve([]);
          }
        } else {
          console.warn("❌ Places API error:", status, {
            possibleCauses: this.getDiagnosticSuggestions(status),
          });
          resolve([]);
        }
      });
    });
  }

  /**
   * Search restaurants by query using Google Places API
   */
  async searchRestaurantsByQuery(
    query: string,
    location?: Location
  ): Promise<Restaurant[]> {
    console.log("🔍 Searching restaurants by query...", { query, location });

    return new Promise((resolve) => {
      if (
        typeof window === "undefined" ||
        !window.google ||
        !window.google.maps ||
        !window.google.maps.places
      ) {
        console.warn("Google Maps Places API not loaded");
        resolve([]);
        return;
      }

      const service = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );

      const request: any = {
        query: query,
        fields: [
          "name",
          "vicinity",
          "rating",
          "price_level",
          "photos",
          "types",
          "opening_hours",
          "place_id",
          "formatted_phone_number",
          "website",
          "geometry",
        ],
      };

      if (location) {
        request.location = new window.google.maps.LatLng(
          location.lat,
          location.lng
        );
        request.radius = 5000;
      }

      service.textSearch(request, (results, status) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          results
        ) {
          try {
            const restaurants = results.map((place: any) =>
              this.formatPlaceToRestaurant(
                place,
                location || API_CONFIG.DEFAULT_LOCATION
              )
            );
            console.log(
              `✅ Found ${restaurants.length} restaurants for query: ${query}`
            );
            resolve(restaurants);
          } catch (formatError) {
            console.error("❌ Error formatting search results:", formatError);
            resolve([]);
          }
        } else {
          console.warn("❌ Text search error:", status, {
            query,
            resultCount: results?.length || 0,
          });
          resolve([]);
        }
      });
    });
  }

  /**
   * Get route information between two locations
   */
  async getRouteInfo(
    origin: Location,
    destination: Location
  ): Promise<RouteInfo> {
    console.log("🗺️ Getting route info...", { origin, destination });

    if (
      typeof window === "undefined" ||
      !window.google ||
      !window.google.maps
    ) {
      console.warn("Google Maps API not loaded, using estimated values");
      return this.getEstimatedRouteInfo(origin, destination);
    }

    return new Promise((resolve) => {
      const service = new window.google.maps.DistanceMatrixService();

      service.getDistanceMatrix(
        {
          origins: [new window.google.maps.LatLng(origin.lat, origin.lng)],
          destinations: [
            new window.google.maps.LatLng(destination.lat, destination.lng),
          ],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false,
        },
        (response, status) => {
          if (
            status === window.google.maps.DistanceMatrixStatus.OK &&
            response
          ) {
            const element = response.rows[0].elements[0];
            if (
              element.status ===
              window.google.maps.DistanceMatrixElementStatus.OK
            ) {
              resolve({
                distance: element.distance.text,
                duration: element.duration.text,
                distanceValue: element.distance.value,
                durationValue: element.duration.value,
              });
            } else {
              console.warn("Distance Matrix element error:", element.status);
              resolve(this.getEstimatedRouteInfo(origin, destination));
            }
          } else {
            console.warn("Distance Matrix Service error:", status);
            resolve(this.getEstimatedRouteInfo(origin, destination));
          }
        }
      );
    });
  }

  /**
   * Format Google Places API result to Restaurant object
   */
  private formatPlaceToRestaurant(
    place: any,
    userLocation: Location
  ): Restaurant {
    const distance = this.calculateDistance(userLocation, {
      lat: place.geometry?.location?.lat() || place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng() || place.geometry?.location?.lng,
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
        lat: place.geometry?.location?.lat() || place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng() || place.geometry?.location?.lng,
      },
      distance: distance,
      isOpen: place.opening_hours?.open_now || false,
      phoneNumber: place.formatted_phone_number,
      website: place.website,
    };
  }

  /**
   * Get diagnostic suggestions for Places API errors
   */
  private getDiagnosticSuggestions(status: any): string[] {
    const suggestions: string[] = [];

    switch (status) {
      case "ZERO_RESULTS":
        suggestions.push("Try expanding your search radius");
        suggestions.push("Check if you're in a valid location");
        break;
      case "OVER_QUERY_LIMIT":
        suggestions.push(
          "API quota exceeded - check your Google Cloud billing"
        );
        suggestions.push("Wait before making more requests");
        break;
      case "REQUEST_DENIED":
        suggestions.push("Check your API key configuration");
        suggestions.push(
          "Verify Places API is enabled in Google Cloud Console"
        );
        break;
      case "INVALID_REQUEST":
        suggestions.push("Check your request parameters");
        suggestions.push("Verify location coordinates are valid");
        break;
      default:
        suggestions.push("Check your internet connection");
        suggestions.push("Verify Google Maps API is properly loaded");
    }

    return suggestions;
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
   * Get estimated route info when Google Maps API is not available
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

export const locationService = new LocationService();
