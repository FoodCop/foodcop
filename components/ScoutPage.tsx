import { motion } from "framer-motion";
import { ArrowLeft, Filter, Heart, Loader, MapPin, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { FuzoTabs } from "./global/FuzoTabs";

import { TakoToast } from "./ai/TakoToast";
import { FriendsTab } from "./scout/FriendsTab";
import { MapView } from "./scout/MapView";
import { RestaurantCard } from "./scout/RestaurantCard";
import { RestaurantDetailSheet } from "./scout/RestaurantDetailSheet";
import { SavedItemsTab } from "./scout/SavedItemsTab";
import {
  Restaurant as APIRestaurant,
  Location,
  RouteInfo,
} from "./services/locationServiceBackend";

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
  image:
    apiRestaurant.photos[0] ||
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
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

// Mock data
const mockRestaurants: Restaurant[] = [
  {
    id: "1",
    name: "Sakura Sushi Bar",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400",
    rating: 4.8,
    reviewCount: 324,
    cuisine: ["Japanese", "Sushi"],
    address: "123 Main St, Downtown",
    openHours: "Open until 10 PM",
    priceLevel: 3,
    distance: "0.2 mi",
    isOpen: true,
    isSaved: false,
    coordinates: { lat: 37.7749, lng: -122.4194 },
  },
  {
    id: "2",
    name: "Mama Maria's",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
    rating: 4.5,
    reviewCount: 156,
    cuisine: ["Italian", "Pizza"],
    address: "456 Oak Ave, Little Italy",
    openHours: "Open until 11 PM",
    priceLevel: 2,
    distance: "0.5 mi",
    isOpen: true,
    isSaved: true,
    coordinates: { lat: 37.7849, lng: -122.4094 },
  },
  {
    id: "3",
    name: "Spice Route",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
    rating: 4.7,
    reviewCount: 289,
    cuisine: ["Indian", "Curry"],
    address: "789 Curry Lane, Spice District",
    openHours: "Closed",
    priceLevel: 2,
    distance: "0.8 mi",
    isOpen: false,
    isSaved: false,
    coordinates: { lat: 37.7649, lng: -122.4294 },
  },
];

const mockFriends: Friend[] = [
  {
    id: "1",
    name: "Sarah Chen",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b8e5?w=100",
    savedCount: 12,
    savedRestaurants: [mockRestaurants[0], mockRestaurants[1]],
  },
  {
    id: "2",
    name: "Mike Rodriguez",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    savedCount: 8,
    savedRestaurants: [mockRestaurants[2]],
  },
];

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
    if (tab === "feed" && onNavigateToFeed) {
      onNavigateToFeed();
    } else if (tab === "snap" && onNavigateToSnap) {
      onNavigateToSnap();
    } else if (tab === "bites" && onNavigateToRecipes) {
      onNavigateToRecipes();
    } else {
      setActiveNavTab(tab);
    }
  };
  const [refreshingLocation, setRefreshingLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<string>("");
  const [selectedPriceRange, setSelectedPriceRange] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "price">(
    "distance"
  );

  // Load restaurants on mount
  useEffect(() => {
    loadNearbyRestaurants();
  }, []);

  const loadNearbyRestaurants = async (
    forceRefreshLocation: boolean = false
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
        city: geoResult.city,
        country: geoResult.country,
      };
      setCurrentLocation(location);

      // Call Google Places API directly
      const restaurants = await searchNearbyRestaurants(
        geoResult.latitude,
        geoResult.longitude,
        5000
      );

      console.log("✅ Direct Google Places API results:", {
        count: restaurants.length,
        location: { lat: geoResult.latitude, lng: geoResult.longitude },
      });

      setRestaurants(restaurants);

      if (restaurants.length === 0) {
        setError(
          "No restaurants found nearby. Try expanding your search radius."
        );
      }
    } catch (err) {
      console.error("Failed to load restaurants:", err);
      setError("Failed to load restaurants. Using offline data.");
      // Fallback to mock data
      setRestaurants(mockRestaurants);
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
          image: getFallbackImageForRestaurant(place.types || [], index), // Will be resolved by SafeRestaurantImage
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

  // Helper function to get variety of fallback images based on restaurant type
  const getFallbackImageForRestaurant = (
    types: string[],
    index: number
  ): string => {
    const cuisineImages: Record<string, string> = {
      italian_restaurant:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
      chinese_restaurant:
        "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=400",
      japanese_restaurant:
        "https://images.unsplash.com/photo-1725122194872-ace87e5a1a8d?w=400",
      mexican_restaurant:
        "https://images.unsplash.com/photo-1700625915228-f2b3d88c6676?w=400",
    };

    const generalImages = [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
      "https://images.unsplash.com/photo-1725122194872-ace87e5a1a8d?w=400",
      "https://images.unsplash.com/photo-1700625915228-f2b3d88c6676?w=400",
    ];

    for (const type of types) {
      if (cuisineImages[type]) {
        return cuisineImages[type];
      }
    }

    return generalImages[index % generalImages.length];
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

  const handleSaveRestaurant = (restaurant: Restaurant) => {
    const updatedRestaurants = restaurants.map((r) =>
      r.id === restaurant.id ? { ...r, isSaved: !r.isSaved } : r
    );
    setRestaurants(updatedRestaurants);

    if (restaurant.isSaved) {
      setSavedRestaurants((saved) =>
        saved.filter((r) => r.id !== restaurant.id)
      );
    } else {
      setSavedRestaurants((saved) => [
        ...saved,
        { ...restaurant, isSaved: true },
      ]);
    }

    if (selectedRestaurant) {
      setSelectedRestaurant({
        ...selectedRestaurant,
        isSaved: !selectedRestaurant.isSaved,
      });
    }
  };

  const filteredRestaurants = restaurants.filter(
    (restaurant) =>
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisine.some((c) =>
        c.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-3 py-3">
        <div className="flex items-center space-x-2">
          {/* Back Button */}
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#0B1F3A]" />
            </button>
          )}

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              showFilters
                ? "bg-[#F14C35] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 p-3 bg-gray-50 rounded-lg"
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

        {/* Tabs */}
        <div className="mt-3">
          <FuzoTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="compact"
            showContent={false}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === "nearby" && (
          <div className="flex flex-col h-[calc(100vh-120px)]">
            {/* Map Section - Larger for better visibility */}
            <div className="h-[60%] relative">
              <MapView
                restaurants={filteredRestaurants}
                selectedRestaurant={selectedMapRestaurant}
                onRestaurantSelect={handleRestaurantClick}
                currentLocation={currentLocation}
              />

              {/* Map Controls */}
              <div className="absolute top-3 right-3 flex flex-col space-y-2">
                <button
                  onClick={handleLocationRefresh}
                  disabled={refreshingLocation}
                  className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
                >
                  <MapPin
                    className={`w-4 h-4 text-[#F14C35] ${
                      refreshingLocation ? "animate-pulse" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Restaurant Cards - Compact Bottom Section */}
            <div className="h-[40%] bg-gray-50">
              <div className="p-3">
                {/* Location Status Card */}
                {geolocation && (
                  <div className="mb-3 p-3 bg-white rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-[#F14C35]" />
                        <div>
                          <span className="text-sm font-medium text-[#0B1F3A]">
                            {geolocation.city
                              ? `${geolocation.city}, ${geolocation.region}`
                              : "Current Location"}
                          </span>
                          <div className="text-xs text-gray-500">
                            {geolocation.method === "browser" &&
                              "📍 GPS Location (Most Accurate)"}
                            {geolocation.method === "ip_geolocation" &&
                              "🌐 IP-based Location"}
                            {geolocation.method === "default" &&
                              "📌 Default Location (San Francisco)"}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleLocationRefresh}
                        disabled={refreshingLocation}
                        className="text-xs text-[#F14C35] font-medium hover:underline disabled:opacity-50"
                      >
                        {refreshingLocation ? "Updating..." : "Update"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Restaurant Count Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#0B1F3A]">
                    {loading
                      ? "Finding restaurants..."
                      : `${filteredRestaurants.length} restaurants nearby`}
                  </h3>
                  {!loading && (
                    <button
                      onClick={() => loadNearbyRestaurants()}
                      className="text-[#F14C35] text-xs font-medium hover:underline"
                    >
                      Refresh
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 text-[#F14C35] animate-spin" />
                    <span className="ml-2 text-gray-600">
                      Finding restaurants...
                    </span>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-2">{error}</p>
                    <button
                      onClick={() => loadNearbyRestaurants()}
                      className="text-[#F14C35] font-medium hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : filteredRestaurants.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-2">No restaurants found</p>
                    <p className="text-sm text-gray-500">
                      Try adjusting your search or location
                    </p>
                  </div>
                ) : (
                  <div className="flex space-x-3 overflow-x-auto pb-4">
                    {filteredRestaurants.map((restaurant) => (
                      <RestaurantCard
                        key={restaurant.id}
                        restaurant={restaurant}
                        onClick={() => handleRestaurantClick(restaurant)}
                        onSave={() => handleSaveRestaurant(restaurant)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "saved" && (
          <SavedItemsTab
            restaurants={savedRestaurants}
            onRestaurantClick={handleRestaurantClick}
            onRestaurantUnsave={handleSaveRestaurant}
          />
        )}

        {activeTab === "friends" && (
          <FriendsTab
            friends={mockFriends}
            onRestaurantClick={handleRestaurantClick}
            onCopyToPlate={handleSaveRestaurant}
          />
        )}
      </div>

      {/* Restaurant Detail Sheet */}
      {selectedRestaurant && (
        <RestaurantDetailSheet
          restaurant={selectedRestaurant}
          isOpen={showDetailSheet}
          onClose={() => setShowDetailSheet(false)}
          onViewOnMap={() => handleViewOnMap(selectedRestaurant)}
          onSave={() => handleSaveRestaurant(selectedRestaurant)}
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
                      {routeInfo.distance.text}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-[#0B1F3A]">Drive Time</p>
                  <p className="text-sm text-gray-600">
                    {routeInfo.duration.text}
                  </p>
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
            // handlePlanRoute(selectedMapRestaurant);
          }}
          onSaveToPlate={() => {
            handleSaveRestaurant(selectedMapRestaurant);
            setShowTakoToast(false);
          }}
          onClose={() => setShowTakoToast(false)}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeNavTab}
        onTabChange={handleNavTabChange}
      />
    </div>
  );
}
