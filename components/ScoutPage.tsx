import { motion } from "framer-motion";
import {
  ArrowLeft,
  Filter,
  Heart,
  Loader,
  MapPin,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BottomNavigation } from "./BottomNavigation";

import { TakoToast } from "./ai/TakoToast";
import { FuzoAIAssistant } from "./FuzoAIAssistant";
import { PlatesTab } from "./global/PlatesTab";
import { FriendsTab } from "./scout/FriendsTab";
import { MapView } from "./scout/MapView";
import { RestaurantCard } from "./scout/RestaurantCard";
import { RestaurantDetailSheet } from "./scout/RestaurantDetailSheet";
import {
  Restaurant as APIRestaurant,
  Location,
  RouteInfo,
  locationServiceBackend,
} from "./services/locationServiceBackend";
import { savedItemsService } from "./services/savedItemsService";

import {
  GeolocationResult,
  geolocationService,
} from "./services/geolocationService";

export interface Restaurant {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  cuisine: string[];
  address: string;
  openHours: string;
  priceLevel: number;
  distance: string;
  isOpen: boolean;
  isSaved: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
  phone?: string;
  website?: string;
  photos?: Array<{
    photoReference?: string;
    needsResolving?: boolean;
    width?: number;
    height?: number;
  }>;
  placeId?: string; // Add placeId for Google Places API v1
}

// Helper function to convert API restaurant to local restaurant format
const convertAPIRestaurant = (apiRestaurant: APIRestaurant): Restaurant => ({
  id: apiRestaurant.id,
  name: apiRestaurant.name,
  image: "", // Let SafeRestaurantImage handle image fetching
  rating: apiRestaurant.rating,
  reviewCount: Math.floor(Math.random() * 500) + 50, // Mock review count
  cuisine: apiRestaurant.cuisine,
  address: apiRestaurant.address,
  openHours: apiRestaurant.isOpen ? "Open now" : "Closed",
  priceLevel: apiRestaurant.priceLevel,
  distance: apiRestaurant.distance
    ? `${apiRestaurant.distance.toFixed(1)} mi`
    : "0.0 mi",
  isOpen: apiRestaurant.isOpen || true,
  isSaved: false,
  coordinates: {
    lat: apiRestaurant.location.lat,
    lng: apiRestaurant.location.lng,
  },
  phone: apiRestaurant.phoneNumber,
  website: apiRestaurant.website,
});

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  savedCount: number;
  savedRestaurants: Restaurant[];
}

// Mock data removed - using only real data from backend

interface ScoutPageProps {
  onNavigateBack?: () => void;
  onNavigateToFeed?: () => void;
  onNavigateToSnap?: () => void;
  onNavigateToRecipes?: () => void;
}

export function ScoutPage({
  onNavigateBack,
  onNavigateToFeed,
  onNavigateToSnap,
  onNavigateToRecipes,
}: ScoutPageProps) {
  const [activeTab, setActiveTab] = useState("nearby");
  const [activeNavTab, setActiveNavTab] = useState("scout");
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTakoToast, setShowTakoToast] = useState(false);
  const [selectedMapRestaurant, setSelectedMapRestaurant] =
    useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [geolocation, setGeolocation] = useState<GeolocationResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [showRouteInfo, setShowRouteInfo] = useState(false);

  const handleNavTabChange = (tab: string) => {
    setActiveNavTab(tab);
    if (tab === "feed" && onNavigateToFeed) {
      onNavigateToFeed();
    } else if (tab === "snap" && onNavigateToSnap) {
      onNavigateToSnap();
    } else if (tab === "bites" && onNavigateToRecipes) {
      onNavigateToRecipes();
    } else if (tab === "scout") {
      // Already on scout page, just update the active tab
      console.log("Scout tab is active");
    }
  };
  const [refreshingLocation, setRefreshingLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchRadius, setSearchRadius] = useState(500); // Default 500m
  const [selectedCuisine, setSelectedCuisine] = useState<string>("");
  const [selectedPriceRange, setSelectedPriceRange] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "price">(
    "distance"
  );

  // Load restaurants on mount
  useEffect(() => {
    loadNearbyRestaurants();
    loadSavedRestaurants();
  }, []);

  // Close search when clicking outside or pressing escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showSearch) {
        setShowSearch(false);
      }
    };

    if (showSearch) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [showSearch]);

  // Load saved restaurants from backend
  const loadSavedRestaurants = async () => {
    try {
      const savedItems = await savedItemsService.listSavedItems({
        itemType: "restaurant",
      });

      // Convert SavedItem to Restaurant format
      const convertedRestaurants: Restaurant[] = savedItems.map((item) => ({
        id: item.id,
        placeId: item.item_id,
        name: item.metadata.title || "Unknown Restaurant",
        image: item.metadata.imageUrl || "",
        rating: item.metadata.rating || 4.5,
        cuisine: item.metadata.cuisine || ["Restaurant"],
        priceLevel: item.metadata.priceLevel || 2,
        address: item.metadata.address || "Unknown Address",
        coordinates: item.metadata.coordinates || { lat: 0, lng: 0 },
        isSaved: true,
        photos: item.metadata.photos || [],
        openHours: item.metadata.openHours || "Unknown",
        reviewCount: item.metadata.reviewCount || 0,
        distance: item.metadata.distance || "Unknown",
        isOpen: item.metadata.isOpen ?? true,
        phone: item.metadata.phone,
        website: item.metadata.website,
      }));

      setSavedRestaurants(convertedRestaurants);
      console.log("✅ Loaded saved restaurants:", convertedRestaurants.length);
    } catch (error) {
      console.error("❌ Failed to load saved restaurants:", error);
    }
  };

  const loadNearbyRestaurants = async (
    forceRefreshLocation: boolean = false,
    radius: number = searchRadius
  ) => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        "🔍 ScoutPage: Loading nearby restaurants with direct Google Places API..."
      );

      // Get user location using enhanced geolocation service
      const geoResult = await geolocationService.getCurrentLocation(
        !forceRefreshLocation
      );
      setGeolocation(geoResult);

      // Convert to legacy format for backward compatibility
      const location: Location = {
        lat: geoResult.latitude,
        lng: geoResult.longitude,
      };
      setCurrentLocation(location);

      // Try backend API first, then fallback to direct Google API
      let restaurants: Restaurant[] = [];
      try {
        // Try backend API first
        const backendRestaurants =
          await locationServiceBackend.getNearbyRestaurants(location, radius);

        // Convert backend restaurants to our format
        restaurants = backendRestaurants.map(convertAPIRestaurant);
        console.log("✅ Using backend API results:", restaurants.length);
      } catch (backendError) {
        console.warn(
          "⚠️ Backend API failed, falling back to direct Google API:",
          backendError
        );

        // Fallback to direct Google Places API
        restaurants = await searchNearbyRestaurants(
          geoResult.latitude,
          geoResult.longitude,
          radius
        );
        console.log("✅ Using direct Google API results:", restaurants.length);
      }

      console.log("✅ Direct Google Places API results:", {
        count: restaurants.length,
        location: { lat: geoResult.latitude, lng: geoResult.longitude },
        restaurants: restaurants.slice(0, 3), // Log first 3 restaurants for debugging
      });

      // Update restaurants with saved state
      const restaurantsWithSavedState = restaurants.map((restaurant) => ({
        ...restaurant,
        isSaved: savedRestaurants.some(
          (saved) =>
            saved.placeId === restaurant.placeId || saved.id === restaurant.id
        ),
      }));

      console.log(
        "✅ Setting restaurants with saved state:",
        restaurantsWithSavedState.length
      );
      setRestaurants(restaurantsWithSavedState);

      if (restaurants.length === 0) {
        setError(
          "No restaurants found nearby. Try expanding your search radius."
        );
      }
    } catch (err) {
      console.error("Failed to load restaurants:", err);
      setError("Failed to load restaurants. Please try again later.");
      // No fallback data - show empty state
      setRestaurants([]);
    } finally {
      setLoading(false);
      setRefreshingLocation(false);
    }
  };

  // Direct Google Places API search function
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

      console.log(
        "✅ Google Places API returned:",
        places.length,
        "restaurants"
      );

      // Convert Google Places results to our Restaurant format
      return places.map((place: any) => {
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
          photos: photos,
          placeId: place.id, // Use the place ID for Google Places API v1
        };
      });
    } catch (error) {
      console.error("Error searching nearby restaurants:", error);
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
    geolocationService.clearLocationCache();
    await loadNearbyRestaurants(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Close search toast after search is performed
    setShowSearch(false);
  };

  const handleRadiusChange = async (newRadius: number) => {
    setSearchRadius(newRadius);
    console.log("🔍 Radius changed to:", newRadius, "meters");
    // Reload restaurants with new radius
    await loadNearbyRestaurants(false, newRadius);
  };

  const handlePlanRoute = async (restaurant: Restaurant) => {
    try {
      if (!currentLocation) {
        console.error("No current location available for route planning");
        return;
      }

      console.log("🗺️ Planning route to:", restaurant.name);

      // Use Google Directions API to get route information
      const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!API_KEY) {
        throw new Error("Google Maps API key not found");
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${currentLocation.lat},${currentLocation.lng}&destination=${restaurant.coordinates.lat},${restaurant.coordinates.lng}&key=${API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Directions API failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];

        const routeInfo: RouteInfo = {
          distance: leg.distance.text,
          duration: leg.duration.text,
          distanceValue: leg.distance.value,
          durationValue: leg.duration.value,
        };

        setRouteInfo(routeInfo);
        setShowRouteInfo(true);
        console.log("✅ Route planned successfully:", routeInfo);
      } else {
        throw new Error("No routes found");
      }
    } catch (error) {
      console.error("❌ Failed to plan route:", error);
      // Fallback: open in Google Maps
      const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation?.lat},${currentLocation?.lng}&destination=${restaurant.coordinates.lat},${restaurant.coordinates.lng}`;
      window.open(url, "_blank");
    }
  };

  const tabs = [
    { id: "nearby", label: "Nearby", icon: MapPin },
    { id: "saved", label: "Saved Items", icon: Heart },
    { id: "friends", label: "Friends", icon: Users },
  ];

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowDetailSheet(true);
  };

  const handleViewOnMap = (restaurant: Restaurant) => {
    setSelectedMapRestaurant(restaurant);
    setShowTakoToast(true);
    setShowDetailSheet(false);
  };

  const handleSaveRestaurant = async (restaurant: Restaurant) => {
    try {
      if (restaurant.isSaved) {
        // Unsave restaurant
        const result = await savedItemsService.unsaveItem({
          itemId: restaurant.placeId || restaurant.id,
          itemType: "restaurant",
        });
        if (result.success) {
          const updatedRestaurants = restaurants.map((r) =>
            r.id === restaurant.id ? { ...r, isSaved: false } : r
          );
          setRestaurants(updatedRestaurants);
          setSavedRestaurants((saved) =>
            saved.filter((r) => r.id !== restaurant.id)
          );

          if (selectedRestaurant) {
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
          itemType: "restaurant",
          metadata: {
            title: restaurant.name,
            imageUrl: restaurant.image,
            rating: restaurant.rating,
            cuisine: restaurant.cuisine,
            priceLevel: restaurant.priceLevel,
            address: restaurant.address,
            coordinates: restaurant.coordinates,
            openHours: restaurant.openHours,
            reviewCount: restaurant.reviewCount,
            distance: restaurant.distance,
            isOpen: restaurant.isOpen,
            phone: restaurant.phone,
            website: restaurant.website,
            photos: restaurant.photos,
            savedAt: new Date().toISOString(),
          },
        });

        if (result.success) {
          const updatedRestaurants = restaurants.map((r) =>
            r.id === restaurant.id ? { ...r, isSaved: true } : r
          );
          setRestaurants(updatedRestaurants);
          setSavedRestaurants((saved) => [
            ...saved,
            { ...restaurant, isSaved: true },
          ]);

          if (selectedRestaurant) {
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

  const filteredRestaurants = restaurants
    .filter((restaurant) => {
      // Search query filter
      const matchesSearch =
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine.some((c) =>
          c.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Cuisine filter
      const matchesCuisine =
        !selectedCuisine ||
        selectedCuisine === "All" ||
        restaurant.cuisine.some((c) =>
          c.toLowerCase().includes(selectedCuisine.toLowerCase())
        );

      // Price range filter
      const matchesPrice =
        selectedPriceRange.length === 0 ||
        selectedPriceRange.includes(restaurant.priceLevel);

      return matchesSearch && matchesCuisine && matchesPrice;
    })
    .sort((a, b) => {
      // Sort by selected criteria
      switch (sortBy) {
        case "distance":
          const distanceA = parseFloat(a.distance.replace(/[^\d.]/g, ""));
          const distanceB = parseFloat(b.distance.replace(/[^\d.]/g, ""));
          return distanceA - distanceB;
        case "rating":
          return b.rating - a.rating;
        case "price":
          return a.priceLevel - b.priceLevel;
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-white relative">
      {/* Full Screen Map */}
      <div className="absolute inset-0">
        <MapView
          restaurants={filteredRestaurants}
          selectedRestaurant={selectedMapRestaurant}
          onRestaurantSelect={handleRestaurantClick}
          currentLocation={
            currentLocation
              ? { lat: currentLocation.lat, lng: currentLocation.lng }
              : undefined
          }
          searchRadius={searchRadius}
        />
      </div>

      {/* Floating Header */}
      <div className="absolute top-0 left-0 right-0 z-40 p-4">
        <div className="flex items-center justify-between">
          {/* Back Button */}
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 text-[#0B1F3A]" />
            </button>
          )}

          {/* Search Active Indicator */}
          {searchQuery && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-[#F14C35]/10 rounded-full">
              <Search className="w-4 h-4 text-[#F14C35]" />
              <span className="text-xs text-[#F14C35] font-medium">
                "{searchQuery}"
              </span>
              <button
                onClick={() => setSearchQuery("")}
                className="text-[#F14C35] hover:text-[#E63E26]"
              >
                ✕
              </button>
            </div>
          )}

          {/* Search Button */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg ${
              showSearch
                ? "bg-[#F14C35] text-white"
                : "bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-white"
            }`}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg ${
              showFilters
                ? "bg-[#F14C35] text-white"
                : "bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-white"
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Collapsible Search Toast */}
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 p-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg"
          >
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search restaurants or cuisines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 pr-10 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F14C35] focus:border-transparent text-sm"
                  autoFocus
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </form>

            {/* Distance Slider */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700">
                  Search Radius
                </label>
                <span className="text-xs text-[#F14C35] font-medium">
                  {searchRadius < 1000
                    ? `${searchRadius}m`
                    : `${(searchRadius / 1000).toFixed(1)}km`}
                </span>
              </div>

              <div className="relative">
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  value={searchRadius}
                  onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #F14C35 0%, #F14C35 ${
                      ((searchRadius - 50) / (2000 - 50)) * 100
                    }%, #e5e7eb ${
                      ((searchRadius - 50) / (2000 - 50)) * 100
                    }%, #e5e7eb 100%)`,
                  }}
                />

                {/* Distance markers */}
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>50m</span>
                  <span>500m</span>
                  <span>1km</span>
                  <span>1.5km</span>
                  <span>2km</span>
                </div>
              </div>
            </div>

            {/* Search Results Count */}
            <div className="mt-2 text-xs text-gray-600">
              {searchQuery ? (
                <>
                  {filteredRestaurants.length} restaurants found for "
                  {searchQuery}"
                </>
              ) : (
                <>
                  {filteredRestaurants.length} restaurants within{" "}
                  {searchRadius < 1000
                    ? `${searchRadius}m`
                    : `${(searchRadius / 1000).toFixed(1)}km`}
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Collapsible Filters */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 p-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg"
          >
            <div className="space-y-3">
              {/* Quick Filters */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Cuisine
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "All",
                    "Italian",
                    "Asian",
                    "Mexican",
                    "American",
                    "Mediterranean",
                  ].map((cuisine) => (
                    <button
                      key={cuisine}
                      onClick={() =>
                        setSelectedCuisine(
                          selectedCuisine === cuisine ? "" : cuisine
                        )
                      }
                      className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                        selectedCuisine === cuisine
                          ? "bg-[#F14C35] text-white"
                          : "bg-white text-gray-600 border border-gray-200"
                      }`}
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Price Range
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((price) => (
                    <button
                      key={price}
                      onClick={() => {
                        if (selectedPriceRange.includes(price)) {
                          setSelectedPriceRange(
                            selectedPriceRange.filter((p) => p !== price)
                          );
                        } else {
                          setSelectedPriceRange([...selectedPriceRange, price]);
                        }
                      }}
                      className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                        selectedPriceRange.includes(price)
                          ? "bg-[#F14C35] text-white"
                          : "bg-white text-gray-600 border border-gray-200"
                      }`}
                    >
                      {"$".repeat(price)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Sort by
                </label>
                <div className="flex gap-1.5">
                  {[
                    { id: "distance", label: "Distance" },
                    { id: "rating", label: "Rating" },
                    { id: "price", label: "Price" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id as any)}
                      className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                        sortBy === option.id
                          ? "bg-[#F14C35] text-white"
                          : "bg-white text-gray-600 border border-gray-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Floating Tab Buttons */}
      <div className="absolute top-20 left-4 z-30 flex flex-col space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
              activeTab === tab.id
                ? "bg-[#F14C35] text-white scale-110"
                : "bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-white hover:scale-105"
            }`}
          >
            <tab.icon className="w-5 h-5" />
          </button>
        ))}
      </div>

      {/* Floating Restaurant Cards */}
      {activeTab === "nearby" && (
        <div className="absolute bottom-4 left-4 right-4 z-30">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
            {/* Restaurant Count Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0B1F3A]">
                  {loading
                    ? "Finding restaurants..."
                    : `${filteredRestaurants.length} restaurants nearby`}
                </h3>
                {activeNavTab === "scout" && (
                  <p className="text-xs text-[#F14C35] font-medium mt-1">
                    🗺️ Scout Mode Active
                  </p>
                )}
                {geolocation && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    {refreshingLocation ? (
                      <>
                        <Loader className="w-3 h-3 animate-spin mr-1" />
                        <span>Updating location...</span>
                      </>
                    ) : (
                      <>
                        📍{" "}
                        {geolocation.accuracy
                          ? `±${Math.round(geolocation.accuracy)}m`
                          : ""}
                        {geolocation.timestamp && (
                          <span className="ml-2">
                            {new Date(
                              geolocation.timestamp
                            ).toLocaleTimeString()}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                )}
              </div>
              {!loading && (
                <button
                  onClick={handleLocationRefresh}
                  disabled={refreshingLocation}
                  className="text-[#F14C35] text-xs font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  {refreshingLocation ? (
                    <>
                      <Loader className="w-3 h-3 animate-spin" />
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    "Refresh"
                  )}
                </button>
              )}
            </div>

            {loading || refreshingLocation ? (
              <div className="flex items-center justify-center py-4">
                <Loader className="w-5 h-5 text-[#F14C35] animate-spin" />
                <span className="ml-2 text-gray-600 text-sm">
                  {refreshingLocation
                    ? "Refreshing location..."
                    : "Finding restaurants..."}
                </span>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-2 text-sm">{error}</p>
                <button
                  onClick={() => loadNearbyRestaurants()}
                  className="text-[#F14C35] font-medium hover:underline text-sm"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {filteredRestaurants.length > 0 ? (
                  filteredRestaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      onClick={() => handleRestaurantClick(restaurant)}
                      variant="grid"
                      showMapIcon={true}
                      onMapClick={() => handleViewOnMap(restaurant)}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 w-full">
                    <p className="text-gray-600 mb-2 text-sm">
                      No restaurants found
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      Try adjusting your search or location
                    </p>
                    <button
                      onClick={() => loadNearbyRestaurants()}
                      className="text-[#F14C35] font-medium hover:underline text-sm"
                    >
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Content for Other Tabs */}
      {activeTab === "saved" && (
        <div className="absolute bottom-4 left-4 right-4 z-30">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg max-h-96 overflow-y-auto">
            <PlatesTab
              variant="scout"
              onRestaurantClick={(restaurant) => {
                // Convert PlatesTab Restaurant to ScoutPage Restaurant format
                const scoutRestaurant: Restaurant = {
                  ...restaurant,
                  reviewCount: 0, // Default value since PlatesTab doesn't have this
                  openHours: "Unknown", // Default value since PlatesTab doesn't have this
                  phone: undefined, // PlatesTab doesn't have phone property
                  website: undefined, // PlatesTab doesn't have website property
                  photos: restaurant.photos || [],
                  placeId: restaurant.placeId,
                  distance: restaurant.distance || "0.0 mi", // Ensure distance is string
                  isOpen: restaurant.isOpen ?? true, // Ensure isOpen is boolean, default to true
                };
                handleRestaurantClick(scoutRestaurant);
              }}
              onRestaurantUnsave={(placeId: string) => {
                // Find the restaurant in savedRestaurants by placeId
                // Updated to use placeId instead of restaurant object
                // TypeScript fix: interface now accepts placeId string
                const restaurant = savedRestaurants.find(
                  (r) => r.placeId === placeId
                );
                if (restaurant) {
                  handleSaveRestaurant(restaurant);
                }
              }}
              showSearch={true}
              showFilters={true}
              showViewToggle={true}
              showStats={false}
            />
          </div>
        </div>
      )}

      {activeTab === "friends" && (
        <div className="absolute bottom-4 left-4 right-4 z-30">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg max-h-96 overflow-y-auto">
            <FriendsTab
              friends={[]}
              onRestaurantClick={handleRestaurantClick}
              onCopyToPlate={handleSaveRestaurant}
            />
          </div>
        </div>
      )}

      {/* Restaurant Detail Sheet */}
      {selectedRestaurant && (
        <RestaurantDetailSheet
          restaurant={selectedRestaurant}
          isOpen={showDetailSheet}
          onClose={() => setShowDetailSheet(false)}
        />
      )}

      {/* Route Info Modal */}
      {showRouteInfo && routeInfo && selectedMapRestaurant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0B1F3A]">
                Route to {selectedMapRestaurant.name}
              </h3>
              <button
                onClick={() => setShowRouteInfo(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#F14C35] rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-[#0B1F3A]">Distance</p>
                    <p className="text-sm text-gray-600">
                      {routeInfo.distance}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-[#0B1F3A]">Drive Time</p>
                  <p className="text-sm text-gray-600">{routeInfo.duration}</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRouteInfo(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Open in Google Maps
                    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation?.lat},${currentLocation?.lng}&destination=${selectedMapRestaurant.coordinates.lat},${selectedMapRestaurant.coordinates.lng}`;
                    window.open(url, "_blank");
                  }}
                  className="flex-1 py-3 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors"
                >
                  Open in Maps
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tako Toast */}
      {showTakoToast && selectedMapRestaurant && (
        <TakoToast
          restaurant={selectedMapRestaurant}
          onPlanRoute={() => {
            setShowTakoToast(false);
            handlePlanRoute(selectedMapRestaurant);
          }}
          onSaveToPlate={() => {
            handleSaveRestaurant(selectedMapRestaurant);
            setShowTakoToast(false);
          }}
          onClose={() => setShowTakoToast(false)}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="scout" onTabChange={handleNavTabChange} />

      {/* AI Assistant */}
      <FuzoAIAssistant
        onNavigateToMap={(location) => {
          if (location) {
            setCurrentLocation(location);
            setActiveTab("nearby");
          }
        }}
        onNavigateToRecipe={(recipeId) => {
          console.log("Navigate to recipe:", recipeId);
          // You can add recipe navigation logic here
        }}
        onSaveRestaurant={(restaurantId) => {
          console.log("Save restaurant:", restaurantId);
          // You can add restaurant saving logic here
        }}
        onNavigateToFeed={() => onNavigateToFeed?.()}
        onNavigateToScout={() => {}}
        onNavigateToBites={() => onNavigateToRecipes?.()}
      />
    </div>
  );
}
