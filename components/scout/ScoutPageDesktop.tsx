'use client';

import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { Restaurant } from "./RestaurantCard";
import DesktopScoutLayout from "./desktop/DesktopScoutLayout";
import ScoutSidebar from "./desktop/ScoutSidebar";

// Import existing map components
import { ScoutMapContainer } from "./ScoutMapContainer";

// Import services from existing implementation
import {
  getCurrentUserLocation,
  type LocationInfo
} from "@/lib/scout/locationService";
import { savedItemsService, type SavedItem } from "@/lib/savedItemsService";

interface ScoutPageDesktopProps {
  className?: string;
}

export function ScoutPageDesktop({ className = '' }: ScoutPageDesktopProps) {
  // Restaurant data
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [savedRestaurants, setSavedRestaurants] = useState<SavedItem[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedMapRestaurant, setSelectedMapRestaurant] = useState<Restaurant | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshingLocation, setRefreshingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Location data
  const [geolocation, setGeolocation] = useState<LocationInfo | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    selectedCuisine: "",
    selectedPriceRange: [] as number[],
    sortBy: "distance" as "distance" | "rating" | "price"
  });

  // Load restaurants on mount
  // Load saved restaurants from backend
  const loadSavedRestaurants = async () => {
    try {
      const result = await savedItemsService.listSavedItems({ itemType: 'restaurant' });
      if (result.success) {
        setSavedRestaurants(result.data || []);
        console.log("✅ Loaded saved restaurants:", result.data?.length || 0);
      } else {
        console.error("❌ Failed to load saved restaurants:", result.error);
      }
    } catch (error) {
      console.error("❌ Failed to load saved restaurants:", error);
    }
  };

  // Load nearby restaurants using mobile implementation logic  
  const loadNearbyRestaurants = async (forceRefreshLocation: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 ScoutPageDesktop: Getting location using navigator.geolocation...");

      // Use the same location approach as ScoutDebug
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: forceRefreshLocation ? 0 : 300000
        });
      });

      const geoData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp).toLocaleString()
      };

      console.log("✅ Got location:", geoData);

      setGeolocation({
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        accuracy: geoData.accuracy,
        timestamp: geoData.timestamp,
        address: `${geoData.latitude.toFixed(4)}, ${geoData.longitude.toFixed(4)}`
      });

      // Call our working API endpoint (same as ScoutDebug)
      const restaurants = await searchRestaurantsViaAPI(
        geoData.latitude,
        geoData.longitude,
        5000
      );

      console.log("✅ API results:", {
        count: restaurants.length,
        location: { lat: geoData.latitude, lng: geoData.longitude },
      });

      // Update restaurants with saved state
      const restaurantsWithSavedState = restaurants.map((restaurant) => ({
        ...restaurant,
        isSaved: savedRestaurants.some(
          (saved) =>
            saved.item_id === restaurant.placeId || saved.item_id === restaurant.id
        ),
      }));

      setRestaurants(restaurantsWithSavedState);

      if (restaurants.length === 0) {
        setError("No restaurants found nearby. Try expanding your search radius.");
      }
    } catch (err) {
      console.error("Failed to load restaurants:", err);
      
      // Handle geolocation errors specifically
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case 1:
            setError("Permission denied - Please allow location access");
            break;
          case 2:
            setError("Position unavailable - Unable to determine location");
            break;
          case 3:
            setError("Request timeout - Location request timed out");
            break;
          default:
            setError("Unknown geolocation error");
        }
      } else {
        setError("Failed to load restaurants. Please try again later.");
      }
      setRestaurants([]);
    } finally {
      setLoading(false);
      setRefreshingLocation(false);
    }
  };

  // Direct Google Places API search function (from original implementation)
  const searchNearbyRestaurants = async (
    latitude: number,
    longitude: number,
    radius: number
  ): Promise<Restaurant[]> => {
    try {
      const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!API_KEY) {
        throw new Error("Google Maps API key not found");
      }

      console.log("🔍 Searching Google Places API directly...", {
        location: { lat: latitude, lng: longitude },
        radius,
      });

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

      console.log("✅ Google Places API returned:", places.length, "restaurants");

      // Convert Google Places results to our Restaurant format
      return places.map((place: any) => {
        // Prepare photos array
        const photos = place.photos
          ? place.photos.map((photo: any) => ({
              photoReference: photo.name,
              needsResolving: false,
              width: photo.widthPx,
              height: photo.heightPx,
            }))
          : [];

        // Calculate distance
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
          image: "", // Will be handled by image component
          rating: place.rating || 4.0,
          reviewCount: place.userRatingCount || Math.floor(Math.random() * 500) + 50,
          cuisine: extractCuisineFromTypes(place.types || []),
          address: place.formattedAddress || "Address not available",
          openHours: place.businessStatus === "OPERATIONAL" ? "Open now" : "Closed",
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
          photos: photos,
          placeId: place.id,
        };
      });
    } catch (error) {
      console.error("Error searching nearby restaurants:", error);
      throw error;
    }
  };

  // API-based restaurant search function (using working debug endpoint)
  const searchRestaurantsViaAPI = async (
    latitude: number,
    longitude: number,
    radius: number
  ): Promise<Restaurant[]> => {
    try {
      console.log("🔍 Searching via API endpoint...", {
        location: { lat: latitude, lng: longitude },
        radius,
      });

      const apiUrl = `/api/debug/scout-restaurant-search?latitude=${latitude}&longitude=${longitude}&radius=${radius}&type=all`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to search restaurants');
      }

      const restaurants = data.restaurants || [];
      console.log("✅ API returned restaurants:", restaurants.length);

      // Transform API response to match our Restaurant interface
      return restaurants.map((place: any) => ({
        id: place.id || place.placeId,
        name: place.name,
        image: place.photoUrl || "/placeholder-restaurant.jpg",
        rating: place.rating || 0,
        reviewCount: place.userRatingsTotal || 0,
        cuisine: extractCuisineFromTypes(place.types || []),
        address: place.address,
        openHours: place.openNow ? "Open now" : "Hours unknown",
        priceLevel: place.priceLevel || 1,
        distance: calculateDistance(
          { lat: latitude, lng: longitude },
          { lat: place.coordinates.lat, lng: place.coordinates.lng }
        ).toFixed(1) + " km",
        isOpen: place.openNow || false,
        coordinates: {
          lat: place.coordinates.lat,
          lng: place.coordinates.lng,
        },
        placeId: place.placeId || place.id,
        isSaved: false, // Will be updated later
      }));
    } catch (error) {
      console.error("❌ API search failed:", error);
      throw error;
    }
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(point2.lat - point1.lat);
    const dLng = toRadians(point2.lng - point1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(point1.lat)) *
        Math.cos(toRadians(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  // Helper function to extract cuisine types
  const extractCuisineFromTypes = (types: string[]): string[] => {
    const cuisineMap: Record<string, string> = {
      italian_restaurant: "Italian",
      chinese_restaurant: "Chinese",
      japanese_restaurant: "Japanese",
      mexican_restaurant: "Mexican",
      indian_restaurant: "Indian",
      thai_restaurant: "Thai",
      french_restaurant: "French",
      american_restaurant: "American",
    };

    const cuisines = types.map((type) => cuisineMap[type]).filter(Boolean);
    return cuisines.length > 0 ? cuisines : ["Restaurant"];
  };

  const handleLocationRefresh = async () => {
    setRefreshingLocation(true);
    console.log("🔄 Manual location refresh triggered");
    // Clear location cache for fresh location
    // Note: getCurrentUserLocation doesn't have clearLocationCache method
    await loadNearbyRestaurants(true);
  };

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setSelectedMapRestaurant(restaurant);
  };

  const handleViewOnMap = (restaurant: Restaurant) => {
    setSelectedMapRestaurant(restaurant);
    // Could trigger map pan/zoom to restaurant location
  };

  const handleGetDirections = (restaurant: Restaurant) => {
    // Open directions in Google Maps
    if (geolocation) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${geolocation.latitude},${geolocation.longitude}&destination=${restaurant.coordinates.lat},${restaurant.coordinates.lng}`;
      window.open(url, "_blank");
    }
  };

  const handleSaveRestaurant = async (restaurant: Restaurant) => {
    try {
      if (restaurant.isSaved) {
        // Unsave restaurant
        const result = await savedItemsService.unsaveItem({
          itemId: restaurant.placeId || restaurant.id,
          itemType: 'restaurant'
        });
        if (result.success) {
          const updatedRestaurants = restaurants.map((r) =>
            r.id === restaurant.id ? { ...r, isSaved: false } : r
          );
          setRestaurants(updatedRestaurants);
          setSavedRestaurants((saved) =>
            saved.filter((r) => r.item_id !== (restaurant.placeId || restaurant.id))
          );

          if (selectedRestaurant?.id === restaurant.id) {
            setSelectedRestaurant({
              ...selectedRestaurant,
              isSaved: false,
            });
          }
          console.log("✅ Restaurant removed from saved list");
        }
      } else {
        // Save restaurant
        const result = await savedItemsService.saveItem({
          itemId: restaurant.placeId || restaurant.id,
          itemType: 'restaurant',
          metadata: {
            name: restaurant.name,
            image: restaurant.image,
            rating: restaurant.rating,
            cuisine: restaurant.cuisine.join(", "),
            price: "$".repeat(restaurant.priceLevel),
            location: restaurant.address,
            coordinates: restaurant.coordinates,
          }
        });

        if (result.success) {
          const updatedRestaurants = restaurants.map((r) =>
            r.id === restaurant.id ? { ...r, isSaved: true } : r
          );
          setRestaurants(updatedRestaurants);
          // Reload saved restaurants to get updated data
          await loadSavedRestaurants();

          if (selectedRestaurant?.id === restaurant.id) {
            setSelectedRestaurant({
              ...selectedRestaurant,
              isSaved: true,
            });
          }
          console.log("✅ Restaurant saved to your plate");
        }
      }
    } catch (error) {
      console.error("❌ Failed to save/unsave restaurant:", error);
    }
  };

  // Apply filters to restaurants
  const filteredRestaurants = restaurants.filter((restaurant) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisine.some((c) =>
        c.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      restaurant.address.toLowerCase().includes(searchQuery.toLowerCase());

    // Cuisine filter
    const matchesCuisine =
      filters.selectedCuisine === "" ||
      filters.selectedCuisine === "All" ||
      restaurant.cuisine.includes(filters.selectedCuisine);

    // Price filter
    const matchesPrice =
      filters.selectedPriceRange.length === 0 ||
      filters.selectedPriceRange.includes(restaurant.priceLevel);

    return matchesSearch && matchesCuisine && matchesPrice;
  });

  // Sort restaurants
  const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
    switch (filters.sortBy) {
      case "rating":
        return b.rating - a.rating;
      case "price":
        return a.priceLevel - b.priceLevel;
      case "distance":
      default:
        return parseFloat(a.distance) - parseFloat(b.distance);
    }
  });

  // Load data on component mount
  useEffect(() => {
    console.log("🚀 ScoutPageDesktop component mounted, starting data load...");
    loadNearbyRestaurants();
    loadSavedRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array for mount only

  return (
    <div className={`scout-page-desktop ${className}`}>
      <DesktopScoutLayout
        sidebar={
          <ScoutSidebar
            restaurants={sortedRestaurants}
            selectedRestaurant={selectedRestaurant}
            loading={loading}
            currentLocation={geolocation ? {
              lat: geolocation.latitude,
              lng: geolocation.longitude
            } : null}
            geolocation={geolocation ? {
              latitude: geolocation.latitude,
              longitude: geolocation.longitude,
              // Add method property to match GeolocationResult interface
              method: 'browser',
              // Add other optional properties with defaults or from address
              city: geolocation.address?.split(',')[1]?.trim(),
              region: geolocation.address?.split(',')[2]?.trim(),
              country: geolocation.address?.split(',')[-1]?.trim(),
            } : null}
            refreshingLocation={refreshingLocation}
            onRestaurantSelect={handleRestaurantSelect}
            onSaveRestaurant={handleSaveRestaurant}
            onViewOnMap={handleViewOnMap}
            onGetDirections={handleGetDirections}
            onLocationRefresh={handleLocationRefresh}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFilterChange={setFilters}
          />
        }
      >
        {/* Map Component */}
        <ScoutMapContainer
          userLocation={geolocation ? {
            latitude: geolocation.latitude,
            longitude: geolocation.longitude
          } : undefined}
          restaurants={sortedRestaurants}
          selectedRestaurant={selectedMapRestaurant}
          onRestaurantClick={handleRestaurantSelect}
          className="desktop-map"
        />
      </DesktopScoutLayout>
    </div>
  );
}

export default ScoutPageDesktop;