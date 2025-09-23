import { useEffect, useState } from "react";
import { Restaurant } from "../components/ScoutPage";
import { savedItemsService } from "../components/services/savedItemsService";
import { useLocation } from "./useLocation";

interface UseNearbyRestaurantsReturn {
  restaurants: Restaurant[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Helper function to calculate distance between two points
const calculateDistance = (
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
  const dLng = (point2.lng - point1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * (Math.PI / 180)) *
      Math.cos(point2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper function to extract cuisine from Google Places types
const extractCuisineFromTypes = (types: string[]): string[] => {
  const cuisineMap: { [key: string]: string } = {
    restaurant: "Restaurant",
    food: "Food",
    meal_takeaway: "Takeaway",
    meal_delivery: "Delivery",
    cafe: "Café",
    bakery: "Bakery",
    bar: "Bar",
    fast_food_restaurant: "Fast Food",
    pizza_restaurant: "Pizza",
    indian_restaurant: "Indian",
    chinese_restaurant: "Chinese",
    italian_restaurant: "Italian",
    mexican_restaurant: "Mexican",
    thai_restaurant: "Thai",
    japanese_restaurant: "Japanese",
    korean_restaurant: "Korean",
    vegetarian_restaurant: "Vegetarian",
    seafood_restaurant: "Seafood",
    steak_house: "Steakhouse",
    barbecue_restaurant: "BBQ",
  };

  return types
    .map((type) => cuisineMap[type])
    .filter(Boolean)
    .slice(0, 3); // Limit to 3 cuisines
};

// Direct Google Places API search function (same as ScoutPage)
const searchNearbyRestaurants = async (
  latitude: number,
  longitude: number,
  radius: number
): Promise<Restaurant[]> => {
  try {
    const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!API_KEY) {
      throw new Error("Google Maps API key not found");
    }

    console.log(
      "🔍 useNearbyRestaurants: Searching Google Places API directly...",
      {
        location: { lat: latitude, lng: longitude },
        radius,
      }
    );

    // Use Google Places API (New) - Nearby Search
    const response = await fetch(
      `https://places.googleapis.com/v1/places:searchNearby`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.businessStatus,places.location,places.photos,places.types,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber",
        },
        body: JSON.stringify({
          includedTypes: ["restaurant"],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: {
                latitude,
                longitude,
              },
              radius,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Places API error:", response.status, errorText);
      throw new Error(`Google Places API failed: ${response.status}`);
    }

    const data = await response.json();
    const places = data.places || [];

    console.log(
      "✅ useNearbyRestaurants: Google Places API returned:",
      places.length,
      "restaurants"
    );

    // Convert Google Places results to our Restaurant format
    return places.map((place: any, index: number) => {
      // Prepare photos array for SafeRestaurantImage
      const photos = place.photos
        ? place.photos.map((photo: any) => ({
            photoReference: photo.name, // Google Places API v1 uses 'name' instead of 'photo_reference'
            needsResolving: false, // We'll use placeId for direct API calls
            width: photo.widthPx,
            height: photo.heightPx,
          }))
        : [];

      // Calculate distance (simple approximation)
      const distance = calculateDistance(
        { lat: latitude, lng: longitude },
        {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
        }
      );

      return {
        id: place.id || `restaurant_${Math.random()}`,
        name: place.displayName?.text || "Unknown Restaurant",
        image: "", // Let SafeRestaurantImage handle image fetching using placeId
        rating: place.rating || 4.0,
        reviewCount:
          place.userRatingCount || Math.floor(Math.random() * 500) + 50,
        cuisine: extractCuisineFromTypes(place.types || []),
        address: place.formattedAddress || "Address not available",
        openHours:
          place.businessStatus === "OPERATIONAL" ? "Open now" : "Closed",
        priceLevel: place.priceLevel || 2,
        distance: `${distance.toFixed(1)} km`,
        isOpen: place.businessStatus === "OPERATIONAL",
        isSaved: false,
        coordinates: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
        },
        phone: place.nationalPhoneNumber,
        website: place.websiteUri,
        photos,
        placeId: place.id, // Use the place ID for image fetching
      };
    });
  } catch (error) {
    console.error(
      "❌ useNearbyRestaurants: Error in searchNearbyRestaurants:",
      error
    );
    throw error;
  }
};

export function useNearbyRestaurants(): UseNearbyRestaurantsReturn {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { location } = useLocation();

  const fetchNearbyRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 useNearbyRestaurants: Fetching nearby restaurants...");

      // Wait for location to be available
      if (location.isLoading) {
        console.log("⏳ useNearbyRestaurants: Waiting for location...");
        return;
      }

      if (location.error) {
        throw new Error(location.error);
      }

      // Use the same direct Google Places API approach as ScoutPage
      const nearbyRestaurants = await searchNearbyRestaurants(
        location.latitude,
        location.longitude,
        2000 // 2km radius
      );

      console.log("✅ useNearbyRestaurants: Found restaurants:", {
        count: nearbyRestaurants.length,
        location: { lat: location.latitude, lng: location.longitude },
      });

      // Get saved restaurants to check which ones are saved
      const savedRestaurants = await savedItemsService.listSavedItems({
        itemType: "restaurant",
      });

      // Update saved state for restaurants
      const restaurantsWithSavedState: Restaurant[] = nearbyRestaurants.map(
        (restaurant) => ({
          ...restaurant,
          isSaved: savedRestaurants.some(
            (saved) =>
              saved.place_id === restaurant.placeId ||
              saved.id === restaurant.id
          ),
        })
      );

      // Take only the first 6 restaurants for the dashboard
      const limitedRestaurants = restaurantsWithSavedState.slice(0, 6);

      setRestaurants(limitedRestaurants);
      console.log(
        `✅ useNearbyRestaurants: Set ${limitedRestaurants.length} restaurants`
      );
    } catch (err) {
      console.error(
        "❌ useNearbyRestaurants: Error fetching nearby restaurants:",
        err
      );
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch nearby restaurants"
      );
      // Set empty array when API fails - no mock data
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!location.isLoading && location.latitude && location.longitude) {
      fetchNearbyRestaurants();
    }
  }, [location.isLoading, location.latitude, location.longitude]);

  return {
    restaurants,
    loading,
    error,
    refetch: fetchNearbyRestaurants,
  };
}
