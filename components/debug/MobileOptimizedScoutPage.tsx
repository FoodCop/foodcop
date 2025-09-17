import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Heart, Users, Star, Clock, ExternalLink, ArrowLeft, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FuzoButton } from './FuzoButton';
import { RestaurantCard } from './RestaurantCard';
import { RestaurantDetailSheet } from './RestaurantDetailSheet';
import { MapView } from './MapView';
import { TakoToast } from './TakoToast';
import { SavedItemsTab } from './SavedItemsTab';
import { FriendsTab } from './FriendsTab';
import { locationServiceBackend as locationService, Restaurant as APIRestaurant, Location, RouteInfo } from './services/locationServiceBackend';
import { geolocationService, GeolocationResult, NearbyRestaurantsResult } from './services/geolocationService';
import { backendService } from './services/backendService';
import { API_CONFIG } from './config/apiConfig';
import type { Restaurant, Friend } from './ScoutPage';

interface MobileOptimizedScoutPageProps {
  onNavigateBack?: () => void;
}

// Mock data (same as original)
const mockRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Sakura Sushi Bar',
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
    rating: 4.8,
    reviewCount: 324,
    cuisine: ['Japanese', 'Sushi'],
    address: '123 Main St, Downtown',
    openHours: 'Open until 10 PM',
    priceLevel: 3,
    distance: '0.2 mi',
    isOpen: true,
    isSaved: false,
    coordinates: { lat: 37.7749, lng: -122.4194 }
  },
  {
    id: '2',
    name: 'Mama Maria\'s',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
    rating: 4.5,
    reviewCount: 156,
    cuisine: ['Italian', 'Pizza'],
    address: '456 Oak Ave, Little Italy',
    openHours: 'Open until 11 PM',
    priceLevel: 2,
    distance: '0.5 mi',
    isOpen: true,
    isSaved: true,
    coordinates: { lat: 37.7849, lng: -122.4094 }
  }
];

const mockFriends: Friend[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b8e5?w=100',
    savedCount: 12,
    savedRestaurants: [mockRestaurants[0], mockRestaurants[1]]
  }
];

export function MobileOptimizedScoutPage({ onNavigateBack }: MobileOptimizedScoutPageProps) {
  const [activeTab, setActiveTab] = useState('nearby');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTakoToast, setShowTakoToast] = useState(false);
  const [selectedMapRestaurant, setSelectedMapRestaurant] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [geolocation, setGeolocation] = useState<GeolocationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [showRouteInfo, setShowRouteInfo] = useState(false);
  const [refreshingLocation, setRefreshingLocation] = useState(false);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'price'>('distance');

  // Load restaurants on mount
  useEffect(() => {
    loadNearbyRestaurants();
  }, []);

  const loadNearbyRestaurants = async (forceRefreshLocation: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 MobileOptimizedScoutPage: Loading nearby restaurants...');
      
      // Get user location using enhanced geolocation service
      const geoResult = await geolocationService.getCurrentLocation(!forceRefreshLocation);
      setGeolocation(geoResult);
      
      // Convert to legacy format for backward compatibility
      const location: Location = {
        lat: geoResult.latitude,
        lng: geoResult.longitude,
        city: geoResult.city,
        country: geoResult.country
      };
      setCurrentLocation(location);
      
      // Search for nearby restaurants using enhanced geolocation service
      const restaurantsResult = await geolocationService.getNearbyRestaurants(5000, forceRefreshLocation);
      
      console.log('✅ Restaurant search results:', {
        count: restaurantsResult.restaurants.length,
        method: restaurantsResult.method,
        location: restaurantsResult.location
      });
      
      // Convert Google Places results to frontend format with safe photo handling
      const convertedRestaurants = restaurantsResult.restaurants.map((place: any, index: number) => {
        const photos = place.photos ? place.photos.map((photo: any) => ({
          photoReference: photo.photo_reference,
          needsResolving: true,
          width: photo.width,
          height: photo.height
        })) : [];

        const fallbackImage = getFallbackImageForRestaurant(place.types || [], index);

        return {
          id: place.place_id || `restaurant_${Math.random()}`,
          name: place.name || 'Unknown Restaurant',
          image: fallbackImage,
          rating: place.rating || 4.0,
          reviewCount: place.user_ratings_total || Math.floor(Math.random() * 500) + 50,
          cuisine: extractCuisineFromTypes(place.types || []),
          address: place.vicinity || place.formatted_address || 'Address not available',
          openHours: place.opening_hours?.open_now ? 'Open now' : 'Closed',
          priceLevel: place.price_level || 2,
          distance: place.distance_text || `${place.distance_km || 0}km`,
          isOpen: place.opening_hours?.open_now !== false,
          isSaved: false,
          coordinates: {
            lat: place.geometry?.location?.lat || 0,
            lng: place.geometry?.location?.lng || 0
          },
          phone: place.formatted_phone_number,
          website: place.website,
          photos: photos
        };
      });
      
      setRestaurants(convertedRestaurants);
      
      if (convertedRestaurants.length === 0) {
        setError('No restaurants found nearby. Try expanding your search radius.');
      }
      
    } catch (err) {
      console.error('Failed to load restaurants:', err);
      setError('Failed to load restaurants. Using offline data.');
      setRestaurants(mockRestaurants);
    } finally {
      setLoading(false);
      setRefreshingLocation(false);
    }
  };

  // Helper functions
  const getFallbackImageForRestaurant = (types: string[], index: number): string => {
    const cuisineImages: Record<string, string> = {
      'italian_restaurant': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
      'chinese_restaurant': 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=400',
      'japanese_restaurant': 'https://images.unsplash.com/photo-1725122194872-ace87e5a1a8d?w=400',
      'mexican_restaurant': 'https://images.unsplash.com/photo-1700625915228-f2b3d88c6676?w=400'
    };

    const generalImages = [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
      'https://images.unsplash.com/photo-1725122194872-ace87e5a1a8d?w=400',
      'https://images.unsplash.com/photo-1700625915228-f2b3d88c6676?w=400'
    ];

    for (const type of types) {
      if (cuisineImages[type]) {
        return cuisineImages[type];
      }
    }

    return generalImages[index % generalImages.length];
  };

  const extractCuisineFromTypes = (types: string[]): string[] => {
    const cuisineMap: Record<string, string> = {
      'italian_restaurant': 'Italian',
      'chinese_restaurant': 'Chinese',
      'japanese_restaurant': 'Japanese',
      'mexican_restaurant': 'Mexican',
      'indian_restaurant': 'Indian',
      'thai_restaurant': 'Thai',
      'french_restaurant': 'French',
      'american_restaurant': 'American'
    };

    const cuisines = types
      .map(type => cuisineMap[type])
      .filter(Boolean);

    return cuisines.length > 0 ? cuisines : ['Restaurant'];
  };

  const handleLocationRefresh = async () => {
    setRefreshingLocation(true);
    console.log('🔄 Manual location refresh triggered');
    geolocationService.clearLocationCache();
    await loadNearbyRestaurants(true);
  };

  const tabs = [
    { id: 'nearby', label: 'Nearby', icon: MapPin },
    { id: 'saved', label: 'Saved', icon: Heart },
    { id: 'friends', label: 'Friends', icon: Users }
  ];

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowDetailSheet(true);
  };

  const handleSaveRestaurant = (restaurant: Restaurant) => {
    const updatedRestaurants = restaurants.map(r => 
      r.id === restaurant.id ? { ...r, isSaved: !r.isSaved } : r
    );
    setRestaurants(updatedRestaurants);
    
    if (restaurant.isSaved) {
      setSavedRestaurants(saved => saved.filter(r => r.id !== restaurant.id));
    } else {
      setSavedRestaurants(saved => [...saved, { ...restaurant, isSaved: true }]);
    }
    
    if (selectedRestaurant) {
      setSelectedRestaurant({ ...selectedRestaurant, isSaved: !selectedRestaurant.isSaved });
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant => 
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.cuisine.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Compact Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-3 py-2.5">
        <div className="flex items-center space-x-2">
          {/* Back Button */}
          {onNavigateBack && (
            <button 
              onClick={onNavigateBack}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#0B1F3A]" />
            </button>
          )}
          
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-100 border-0 rounded-lg text-sm text-[#0B1F3A] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F14C35]/20 focus:bg-white focus:shadow-sm transition-all"
            />
          </div>
          
          {/* Filter Button */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              showFilters ? 'bg-[#F14C35] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsible Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 p-2.5 bg-gray-50 rounded-lg overflow-hidden"
            >
              <div className="space-y-2.5">
                {/* Quick Filters */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Cuisine</label>
                  <div className="flex flex-wrap gap-1">
                    {['All', 'Italian', 'Asian', 'Mexican', 'American'].map((cuisine) => (
                      <button
                        key={cuisine}
                        onClick={() => setSelectedCuisine(selectedCuisine === cuisine ? '' : cuisine)}
                        className={`px-2 py-1 text-xs rounded-full transition-colors ${
                          selectedCuisine === cuisine
                            ? 'bg-[#F14C35] text-white'
                            : 'bg-white text-gray-600 border border-gray-200'
                        }`}
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Price</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((price) => (
                      <button
                        key={price}
                        onClick={() => {
                          if (selectedPriceRange.includes(price)) {
                            setSelectedPriceRange(selectedPriceRange.filter(p => p !== price));
                          } else {
                            setSelectedPriceRange([...selectedPriceRange, price]);
                          }
                        }}
                        className={`px-2 py-1 text-xs rounded-full transition-colors ${
                          selectedPriceRange.includes(price)
                            ? 'bg-[#F14C35] text-white'
                            : 'bg-white text-gray-600 border border-gray-200'
                        }`}
                      >
                        {'$'.repeat(price)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact Tabs */}
        <div className="mt-2.5">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-[#F14C35] shadow-sm'
                      : 'text-gray-600 hover:text-[#0B1F3A]'
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'nearby' && (
          <div className="flex flex-col h-[calc(100vh-110px)]">
            {/* Map Section - Larger for better visibility */}
            <div className="h-[65%] relative">
              <MapView 
                restaurants={filteredRestaurants}
                selectedRestaurant={selectedMapRestaurant}
                onRestaurantSelect={handleRestaurantClick}
              />
              
              {/* Map Controls */}
              <div className="absolute top-2 right-2">
                <button
                  onClick={handleLocationRefresh}
                  disabled={refreshingLocation}
                  className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
                >
                  <MapPin className={`w-4 h-4 text-[#F14C35] ${refreshingLocation ? 'animate-pulse' : ''}`} />
                </button>
              </div>
            </div>

            {/* Restaurant Cards - Compact Bottom Section */}
            <div className="h-[35%] bg-gray-50">
              <div className="p-2.5">
                {/* Location Status Card */}
                {geolocation && (
                  <div className="mb-2 p-2 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#F14C35]" />
                        <div>
                          <span className="text-xs font-medium text-[#0B1F3A]">
                            {geolocation.city ? `${geolocation.city}, ${geolocation.region}` : 'Current Location'}
                          </span>
                          <div className="text-xs text-gray-500">
                            {geolocation.method === 'browser' && '📍 GPS (Accurate)'}
                            {geolocation.method === 'ip_geolocation' && '🌐 IP Location'}
                            {geolocation.method === 'default' && '📌 Default Location'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleLocationRefresh}
                        disabled={refreshingLocation}
                        className="text-xs text-[#F14C35] font-medium hover:underline disabled:opacity-50"
                      >
                        {refreshingLocation ? 'Updating...' : 'Update'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Restaurant Count Header */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-[#0B1F3A]">
                    {loading ? 'Finding restaurants...' : `${filteredRestaurants.length} restaurants nearby`}
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
                  <div className="flex items-center justify-center py-6">
                    <Loader className="w-5 h-5 text-[#F14C35] animate-spin" />
                    <span className="ml-2 text-sm text-gray-600">Finding restaurants...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-600 mb-1">{error}</p>
                    <button 
                      onClick={loadNearbyRestaurants}
                      className="text-[#F14C35] text-sm font-medium hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : filteredRestaurants.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-600 mb-1">No restaurants found</p>
                    <p className="text-xs text-gray-500">Try adjusting your search or location</p>
                  </div>
                ) : (
                  <div className="flex space-x-2.5 overflow-x-auto pb-2">
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

        {activeTab === 'saved' && (
          <SavedItemsTab 
            restaurants={savedRestaurants}
            onRestaurantClick={handleRestaurantClick}
            onRestaurantUnsave={handleSaveRestaurant}
          />
        )}

        {activeTab === 'friends' && (
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
          onViewOnMap={() => {
            setSelectedMapRestaurant(selectedRestaurant);
            setShowTakoToast(true);
            setShowDetailSheet(false);
          }}
          onSave={() => handleSaveRestaurant(selectedRestaurant)}
        />
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
    </div>
  );
}
