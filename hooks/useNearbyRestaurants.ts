import { useEffect, useState } from "react";
import { Restaurant } from "../components/ScoutPage";
import { locationServiceBackend } from "../components/services/locationServiceBackend";
import { savedItemsService } from "../components/services/savedItemsService";
import { useLocation } from "./useLocation";

interface UseNearbyRestaurantsReturn {
  restaurants: Restaurant[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

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
        console.log("⏳ Waiting for location...");
        return;
      }

      if (location.error) {
        throw new Error(location.error);
      }

      // Only fetch from backend - no mock data fallback
      const nearbyRestaurants =
        await locationServiceBackend.getNearbyRestaurants(
          {
            lat: location.latitude,
            lng: location.longitude,
          },
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

      // Convert API restaurants to Restaurant format (matching ScoutPage)
      const restaurantsWithSavedState: Restaurant[] = nearbyRestaurants.map(
        (restaurant) => ({
          id: restaurant.id,
          name: restaurant.name,
          image: "", // Let SafeRestaurantImage handle image fetching
          rating: restaurant.rating,
          reviewCount: Math.floor(Math.random() * 500) + 50, // Mock review count
          cuisine: restaurant.cuisine,
          address: restaurant.address,
          openHours: restaurant.isOpen ? "Open now" : "Closed",
          priceLevel: restaurant.priceLevel,
          distance: restaurant.distance
            ? `${restaurant.distance.toFixed(1)} km`
            : "0.0 km",
          isOpen: restaurant.isOpen || true,
          isSaved: savedRestaurants.some(
            (saved) =>
              saved.place_id === restaurant.id || saved.id === restaurant.id
          ),
          coordinates: {
            lat: restaurant.location.lat,
            lng: restaurant.location.lng,
          },
          phone: restaurant.phoneNumber,
          website: restaurant.website,
          photos:
            restaurant.photos?.map((photo) => ({
              photoReference: photo.photoReference,
              needsResolving: photo.needsResolving || false,
              width: photo.width,
              height: photo.height,
            })) || [],
          placeId: restaurant.id,
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
      // Set empty array when backend fails - no mock data
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
