import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Star, Clock, Phone, Globe, Navigation, Heart, Share2 } from 'lucide-react';
import { savedItemsService } from '../../services/savedItemsService';
import { useAuth } from '../auth/AuthProvider';
import { toast } from 'sonner';
import { toastHelpers } from '../../utils/toastHelpers';
import { GoogleMapView } from '../maps/GoogleMapView';
import type { MapMarker } from '../maps/mapUtils';
import { backendService, formatGooglePlaceResult, getGooglePlacesPhotoUrl } from '../../services/backendService';
import { getDirections, type TravelMode, type Route } from '../../services/googleDirections';
import type { GooglePlace } from '../../types';
import { mapSavedItemToRestaurant, calculateDistanceKm } from '../../utils/savedRestaurantMapper';
import { SharePostButton } from '../feed/SharePostButton';

// Format distance: meters for < 1km, kilometers for >= 1km
const formatDistance = (distanceKm: number | undefined): string => {
  if (!distanceKm) return '0m';
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
  return `${distanceKm.toFixed(1)}km`;
};

interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  userRatingsTotal?: number;
  price_level?: number;
  cuisine?: string | string[];
  distance?: number;
  deliveryTime?: string;
  image?: string;
  photos?: string[];
  phone?: string;
  website?: string;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  description?: string;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: string;
  }>;
}

export function ScoutDesktop() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [visibleLimit, setVisibleLimit] = useState(10);
  const [activeTab, setActiveTab] = useState<'discover' | 'my-map'>('discover');
  const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState<string | null>(null);
  const [myMapFilter, setMyMapFilter] = useState<'nearby' | 'all'>('nearby');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [distance, setDistance] = useState(2.5);
  const [activeFilter, setActiveFilter] = useState<string>('popular');
  const [detailTab, setDetailTab] = useState<'overview' | 'reviews' | 'photos' | 'menu'>('overview');
  const [showDirections, setShowDirections] = useState(false);
  // Start with a neutral default (San Francisco); real location is loaded via geolocation on mount
  const [userLocation, setUserLocation] = useState<[number, number]>([37.7849, -122.4094]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routePolyline, setRoutePolyline] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<Route | null>(null);
  const [selectedTravelMode, setSelectedTravelMode] = useState<TravelMode>('DRIVING');
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [debouncedDistance, setDebouncedDistance] = useState(2.5);

  // Prevent multiple geolocation attempts
  const geolocationAttempted = useRef(false);

  // Get user location and fetch restaurants on mount
  useEffect(() => {
    if (geolocationAttempted.current) return;
    geolocationAttempted.current = true;

    const getUserLocation = () => {
      console.log('🌍 ScoutDesktop: Getting user location...');

      if (!navigator.geolocation) {
        console.warn('⚠️ Geolocation not supported');
        fetchRestaurants(userLocation[0], userLocation[1], distance);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log('✅ ScoutDesktop: Got location:', position.coords);
          const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newLocation);
          fetchRestaurants(position.coords.latitude, position.coords.longitude, distance);
        },
        (error) => {
          console.error('❌ ScoutDesktop geolocation error:', error);
          toastHelpers.error('Unable to get your location. Using default.');
          fetchRestaurants(userLocation[0], userLocation[1], distance);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    };

    getUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce distance changes to avoid excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedDistance(distance);
    }, 1000); // Wait 1 second after user stops dragging slider
    return () => clearTimeout(timeoutId);
  }, [distance]);

  // Fetch restaurants from Google Places API
  const fetchRestaurants = async (lat: number, lng: number, radiusKm: number, query?: string) => {
    console.log('🔍 ScoutDesktop: Fetching restaurants', { lat, lng, radiusKm, query });
    setError(null);
    setLoading(true);

    try {
      const radiusMeters = radiusKm * 1000;
      let results: Restaurant[] = [];

      if (query?.trim()) {
        const response = await backendService.searchPlacesByText(
          `${query} restaurant`,
          { lat, lng }
        );

        if (response.success && response.data?.results) {
          results = response.data.results.map((place: GooglePlace) =>
            formatGooglePlaceResult(place, { lat, lng })
          ).filter((restaurant: Restaurant) =>
            restaurant.distance !== undefined && restaurant.distance <= radiusKm
          );
        }
      } else {
        const response = await backendService.searchNearbyPlaces(
          { lat, lng },
          radiusMeters,
          'restaurant'
        );

        if (response.success && response.data?.results) {
          results = response.data.results.map((place: GooglePlace) =>
            formatGooglePlaceResult(place, { lat, lng })
          );
          console.log('✅ ScoutDesktop: Got', results.length, 'restaurants');
        } else {
          setError(response.error || 'Failed to load restaurants');
        }
      }

      results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setRestaurants(results);
      setVisibleLimit(10);

      if (results.length > 0) {
        setSelectedRestaurant(results[0]);
      } else {
        toast.error(`No restaurants found within ${radiusKm}km`);
      }
    } catch (error) {
      console.error('❌ ScoutDesktop: Error fetching restaurants:', error);
      setError('Failed to load restaurants');
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when debounced distance changes
  useEffect(() => {
    const hasRealLocation = userLocation[0] !== 13.1072 || userLocation[1] !== 80.0915456;
    if (hasRealLocation || restaurants.length === 0) {
      const query = searchQuery.trim() || undefined;
      fetchRestaurants(userLocation[0], userLocation[1], debouncedDistance, query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDistance]);

  // Search with debounce
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        fetchRestaurants(userLocation[0], userLocation[1], distance, searchQuery);
      }, 1000); // Increased from 500ms to 1000ms to reduce API calls
      return () => clearTimeout(timeoutId);
    } else if (searchQuery === '' && restaurants.length > 0) {
      // Clear search - refetch all
      fetchRestaurants(userLocation[0], userLocation[1], distance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleRestaurantClick = async (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowDirections(false);
    setDetailTab('overview');

    // Fetch detailed info including reviews and photos
    if (restaurant.id) {
      try {
        const response = await backendService.getPlaceDetails(restaurant.id);
        if (response.success && response.data?.result) {
          const details = response.data.result;

          // Convert photo references to full URLs
          const photos = details.photos
            ? details.photos.slice(0, 4).map((photo: { photo_reference: string }) =>
              getGooglePlacesPhotoUrl(photo.photo_reference, 400)
            )
            : restaurant.photos;

          // Merge with detailed info
          setSelectedRestaurant({
            ...restaurant,
            photos,
            phone: details.formatted_phone_number || details.international_phone_number,
            website: details.website,
            opening_hours: details.opening_hours ? {
              open_now: details.opening_hours.open_now,
              weekday_text: details.opening_hours.weekday_text
            } : restaurant.opening_hours,
            reviews: details.reviews ? details.reviews.map((review: { author_name: string; rating: number; text: string; relative_time_description: string }) => ({
              author_name: review.author_name,
              rating: review.rating,
              text: review.text,
              time: review.relative_time_description
            })) : undefined
          });
        }
      } catch (error) {
        console.error('Failed to fetch restaurant details:', error);
      }
    }
  };

  const handleGetDirections = async () => {
    setShowDirections(true);
    if (!selectedRestaurant) return;

    setLoadingRoute(true);
    try {
      const response = await getDirections(
        { lat: userLocation[0], lng: userLocation[1] },
        { lat: selectedRestaurant.lat, lng: selectedRestaurant.lng },
        selectedTravelMode
      );

      if (response.routes && response.routes.length > 0) {
        setRoutePolyline(response.routes[0].overviewPolyline);
        setRouteInfo(response.routes[0]);
      }
    } catch (error) {
      console.error('Failed to get directions:', error);
      toast.error('Failed to get directions');
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleTravelModeChange = async (mode: TravelMode) => {
    setSelectedTravelMode(mode);
    if (!selectedRestaurant || !showDirections) return;

    setLoadingRoute(true);
    try {
      const response = await getDirections(
        { lat: userLocation[0], lng: userLocation[1] },
        { lat: selectedRestaurant.lat, lng: selectedRestaurant.lng },
        mode
      );

      if (response.routes && response.routes.length > 0) {
        setRoutePolyline(response.routes[0].overviewPolyline);
        setRouteInfo(response.routes[0]);
      }
    } catch (error) {
      console.error('Failed to get directions:', error);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleSaveToPlate = async () => {
    if (!user) {
      toast.error('Please sign in to save restaurants');
      return;
    }

    if (!selectedRestaurant) return;

    const cuisineText = Array.isArray(selectedRestaurant.cuisine)
      ? selectedRestaurant.cuisine.join(', ')
      : selectedRestaurant.cuisine;

    try {
      const result = await savedItemsService.saveItem({
        itemId: selectedRestaurant.id,
        itemType: 'restaurant',
        metadata: {
          name: selectedRestaurant.name,
          address: selectedRestaurant.address,
          cuisine: cuisineText,
          rating: selectedRestaurant.rating,
          lat: selectedRestaurant.lat,
          lng: selectedRestaurant.lng,
          place_id: selectedRestaurant.id,
          price_level: selectedRestaurant.price_level,
          distance: selectedRestaurant.distance ? selectedRestaurant.distance * 1000 : undefined,
          photos: selectedRestaurant.photos,
          phone: selectedRestaurant.phone,
          website: selectedRestaurant.website,
          image: selectedRestaurant.image,
          image_url: selectedRestaurant.image
        }
      });

      if (result.success) {
        toastHelpers.saved(selectedRestaurant.name);
      } else if (result.error === 'Item already saved') {
        toastHelpers.saved(selectedRestaurant.name, true);
      } else {
        toastHelpers.error(result.error || 'Failed to save restaurant');
      }
    } catch (error) {
      console.error('Error saving restaurant:', error);
      toast.error('An error occurred while saving the restaurant');
    }
  };

  // Load saved restaurants for My Map
  useEffect(() => {
    const loadSavedRestaurants = async () => {
      if (!user || activeTab !== 'my-map') {
        return;
      }

      setSavedLoading(true);
      setSavedError(null);

      try {
        const result = await savedItemsService.listSavedItems({ itemType: 'restaurant' });

        if (!result.success || !result.data) {
          setSavedError(result.error || 'Failed to load saved places');
          setSavedRestaurants([]);
          return;
        }

        const mapped: Restaurant[] = [];
        for (const item of result.data) {
          const mappedRestaurant = mapSavedItemToRestaurant(item);
          if (mappedRestaurant) {
            mapped.push({
              id: mappedRestaurant.id,
              name: mappedRestaurant.name,
              address: mappedRestaurant.address,
              lat: mappedRestaurant.lat,
              lng: mappedRestaurant.lng,
              rating: mappedRestaurant.rating ?? 0,
              userRatingsTotal: undefined,
              price_level: mappedRestaurant.price_level,
              cuisine: mappedRestaurant.cuisine,
              distance: mappedRestaurant.distanceMeters
                ? mappedRestaurant.distanceMeters / 1000
                : undefined,
              deliveryTime: undefined,
              image: mappedRestaurant.image || mappedRestaurant.image_url,
              photos: Array.isArray(mappedRestaurant.photos)
                ? mappedRestaurant.photos.map((p) =>
                  typeof p === 'string' ? p : getGooglePlacesPhotoUrl(p.photo_reference, 800),
                )
                : undefined,
              phone: undefined,
              website: undefined,
              opening_hours: undefined,
              description: undefined,
              reviews: undefined,
            });
          }
        }

        setSavedRestaurants(mapped);
        if (mapped.length > 0 && !selectedRestaurant) {
          setSelectedRestaurant(mapped[0]);
        }
      } catch (error) {
        console.error('❌ ScoutDesktop: Error loading saved restaurants for My Map:', error);
        setSavedError('Failed to load saved places');
        setSavedRestaurants([]);
      } finally {
        setSavedLoading(false);
      }
    };

    void loadSavedRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  const filteredSavedRestaurants = (() => {
    if (myMapFilter === 'all') return savedRestaurants;

    if (!userLocation) return savedRestaurants;

    const origin = { lat: userLocation[0], lng: userLocation[1] };
    const MAX_NEARBY_KM = 20;

    return savedRestaurants.filter((r) => {
      try {
        const d = calculateDistanceKm(origin, { lat: r.lat, lng: r.lng });
        return d <= MAX_NEARBY_KM;
      } catch {
        return false;
      }
    });
  })();

  const priceLevel = selectedRestaurant?.price_level ? '$'.repeat(selectedRestaurant.price_level) : '$$';

  return (
    <div className="flex flex-col h-screen bg-page-scout" style={{ fontSize: '10pt' }}>
      {/* Tabs for Discover / My Map */}
      <div className="border-b border-gray-200 bg-white px-4 pt-2">
        <div className="inline-flex rounded-full bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 ${activeTab === 'discover'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Discover
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my-map')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 ${activeTab === 'my-map'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            My Map
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left Sidebar - Apricot Theme */}
        <aside className="w-[380px] border-r flex flex-col overflow-hidden" style={{ backgroundColor: '#502503', borderColor: '#E5B88A' }}>
          {/* Header */}
          <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
            {/* User Location */}
            <div className="flex items-center gap-2 mb-4 p-2 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-blue-600 font-medium">Your Location</span>
                <p className="text-sm text-gray-800 truncate">
                  {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                </p>
              </div>
            </div>

            {activeTab === 'discover' ? (
              <>
                {/* Search */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Search restaurants, cuisines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-[#F4E3B2] placeholder:text-[#F4E3B2]"
                  />
                  <Search className="absolute left-4 top-4 text-gray-400" size={18} />
                </div>

                {/* Distance Slider */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <i
                      className="fa-solid fa-person-walking text-gray-200"
                      style={{ fontSize: '10pt' }}
                      aria-label="Distance"
                    ></i>
                    <span className="text-sm font-semibold text-[#F4E3B2]">
                      {formatDistance(distance)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="50"
                    step="0.5"
                    value={distance}
                    onChange={(e) => setDistance(Number.parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: '#F4E3B2' }}
                  />
                  <div className="flex justify-between text-xs text-gray-200 mt-1">
                    <span>0.5km</span>
                    <span>10km</span>
                  </div>
                </div>

              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-gray-900">My Saved Places</h2>
                  {!user && (
                    <span className="text-[11px] text-gray-500">
                      Sign in to see your saved restaurants
                    </span>
                  )}
                </div>
                {/* Nearby / All toggle */}
                <div className="flex items-center gap-3 mb-3">
                  <label className="inline-flex items-center gap-1 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="my-map-filter"
                      value="nearby"
                      checked={myMapFilter === 'nearby'}
                      onChange={() => setMyMapFilter('nearby')}
                      className="text-[#F4E3B2] focus:ring-[#F4E3B2]"
                    />
                    <span>Nearby</span>
                  </label>
                  <label className="inline-flex items-center gap-1 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="my-map-filter"
                      value="all"
                      checked={myMapFilter === 'all'}
                      onChange={() => setMyMapFilter('all')}
                      className="text-[#F4E3B2] focus:ring-[#F4E3B2]"
                    />
                    <span>All</span>
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Restaurant List */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'discover' ? (
              <>
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                      <p className="text-gray-200">Finding nearby restaurants...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center px-4">
                      <p className="text-red-600 mb-2">❌ {error}</p>
                      <button
                        onClick={() => fetchRestaurants(userLocation[0], userLocation[1], distance)}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : restaurants.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center px-4">
                      <MapPin className="text-gray-400 mx-auto mb-4" size={48} />
                      <p className="text-gray-200 mb-2">No restaurants found</p>
                      <p className="text-sm text-gray-300">Try increasing the search radius</p>
                    </div>
                  </div>
                ) : (
                  restaurants.slice(0, visibleLimit).map((restaurant) => (
                    <button
                      key={restaurant.id}
                      onClick={() => handleRestaurantClick(restaurant)}
                      className={`w-full p-4 border-b border-gray-100 cursor-pointer transition-colors text-left ${selectedRestaurant?.id === restaurant.id ? 'bg-[#E47A24]/20' : 'hover:bg-[#E47A24]/10'
                        }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-200">
                          {restaurant.image ? (
                            <img
                              src={restaurant.image}
                              alt={restaurant.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                                if (placeholder) placeholder.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full flex items-center justify-center ${restaurant.image ? 'hidden' : ''
                              }`}
                          >
                            <MapPin className="text-gray-400" size={32} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{restaurant.name}</h3>
                          <div className="flex items-center gap-1 mb-1">
                            <div className="flex text-[#F4E3B2] text-xs">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  className={i < Math.floor(restaurant.rating) ? 'fill-[#F4E3B2]' : ''}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-white">
                              {restaurant.rating}
                            </span>
                            <span className="text-xs text-gray-300">
                              ({restaurant.userRatingsTotal})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-300 mb-1">
                            <span>{restaurant.cuisine}</span>
                            <span className="text-gray-500">·</span>
                            <span>
                              {restaurant.price_level ? '$'.repeat(restaurant.price_level) : '$$'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-300">
                              {formatDistance(restaurant.distance)}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded ${restaurant.opening_hours?.open_now
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                                }`}
                            >
                              {restaurant.opening_hours?.open_now ? 'Open' : 'Closed'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </>
            ) : (
              <>
                {savedLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading your saved places...</p>
                    </div>
                  </div>
                ) : savedError ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center px-4">
                      <p className="text-red-600 mb-2">❌ {savedError}</p>
                      <p className="text-xs text-gray-500">
                        Open Plate and try saving a few restaurants, then come back here.
                      </p>
                    </div>
                  </div>
                ) : filteredSavedRestaurants.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center px-4">
                      <MapPin className="text-gray-400 mx-auto mb-4" size={40} />
                      <p className="text-gray-600 mb-2">No saved restaurants yet</p>
                      <p className="text-xs text-gray-500">
                        Save places from Scout or Plate to see them on your map.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredSavedRestaurants.map((restaurant) => (
                    <button
                      key={restaurant.id}
                      onClick={() => setSelectedRestaurant(restaurant)}
                      className={`w-full p-4 border-b border-gray-100 cursor-pointer transition-colors text-left ${selectedRestaurant?.id === restaurant.id ? 'bg-[#E47A24]/20' : 'hover:bg-[#E47A24]/10'
                        }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-200">
                          {restaurant.image ? (
                            <img
                              src={restaurant.image}
                              alt={restaurant.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                                if (placeholder) placeholder.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full flex items-center justify-center ${restaurant.image ? 'hidden' : ''
                              }`}
                          >
                            <MapPin className="text-gray-400" size={32} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{restaurant.name}</h3>
                          <div className="flex items-center gap-1 mb-1">
                            <div className="flex text-[#F4E3B2] text-xs">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  className={i < Math.floor(restaurant.rating) ? 'fill-[#F4E3B2]' : ''}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-white">
                              {restaurant.rating}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                            <span>{restaurant.cuisine}</span>
                            {restaurant.price_level && (
                              <>
                                <span className="text-gray-400">·</span>
                                <span>{'$'.repeat(restaurant.price_level)}</span>
                              </>
                            )}
                          </div>
                          {restaurant.distance && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">
                                {formatDistance(restaurant.distance)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </>
            )}
          </div>

          {/* Pagination - Load More */}
          {activeTab === 'discover' && restaurants.length > visibleLimit && (
            <div className="border-t border-gray-100 p-3 flex items-center justify-center bg-white">
              <button
                onClick={() => setVisibleLimit((prev) => Math.min(prev + 10, restaurants.length))}
                className="px-4 py-2 text-sm font-semibold rounded-full bg-orange-500 text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
              >
                Load more results
              </button>
            </div>
          )}
        </aside>

        {/* Map Container */}
        <div className="flex-1 relative bg-gray-200">
          <GoogleMapView
            center={
              selectedRestaurant
                ? { lat: selectedRestaurant.lat, lng: selectedRestaurant.lng }
                : { lat: userLocation[0], lng: userLocation[1] }
            }
            zoom={14}
            userLocation={{ lat: userLocation[0], lng: userLocation[1] }}
            markers={(activeTab === 'discover' ? restaurants : filteredSavedRestaurants).map(
              (restaurant): MapMarker => ({
                id: restaurant.id,
                position: { lat: restaurant.lat, lng: restaurant.lng },
                title: restaurant.name,
                data: restaurant,
              }),
            )}
            selectedMarkerId={selectedRestaurant?.id}
            onMarkerClick={(markerId) => {
              const source = activeTab === 'discover' ? restaurants : filteredSavedRestaurants;
              const restaurant = source.find((r) => r.id === markerId);
              if (restaurant) {
                handleRestaurantClick(restaurant);
              }
            }}
            enableClustering={
              (activeTab === 'discover' ? restaurants : filteredSavedRestaurants).length > 20
            }
            route={showDirections && routePolyline ? routePolyline : undefined}
            className="w-full h-full"
          />

          {/* Search This Area Button */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <button className="px-4 py-2 bg-white rounded-full shadow-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Search this area
            </button>
          </div>

          {/* Recenter on User Location Button */}
          <button
            onClick={() => {
              // Dispatch custom event to recenter map
              window.dispatchEvent(new CustomEvent('recenter-map', {
                detail: { lat: userLocation[0], lng: userLocation[1] }
              }));
            }}
            className="absolute bottom-4 right-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="Center on your location"
          >
            <Navigation size={20} className="text-blue-600" />
          </button>
        </div>

        {/* Right Panel - Apricot Theme */}
        {selectedRestaurant && (
          <aside className="w-[420px] border-l flex flex-col overflow-hidden" style={{ backgroundColor: '#502503', borderColor: '#E5B88A' }}>
            <div className="flex-1 overflow-y-auto">
              {/* Hero Image */}
              <div className="h-64 overflow-hidden bg-gray-200">
                {selectedRestaurant.image ? (
                  <img
                    src={selectedRestaurant.image}
                    alt={selectedRestaurant.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center ${selectedRestaurant.image ? 'hidden' : ''}`}>
                  <MapPin className="text-gray-400" size={64} />
                </div>
              </div>

              <div className="p-6">
                {/* Restaurant Name & Rating */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">{selectedRestaurant.name}</h2>
                    <div className="flex items-center gap-2">
                      <div className="flex text-[#F4E3B2]">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < Math.floor(selectedRestaurant.rating) ? 'fill-[#F4E3B2]' : ''}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-semibold text-white">{selectedRestaurant.rating}</span>
                      <span className="text-gray-300">({selectedRestaurant.userRatingsTotal} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Dark Mango with Blood Orange hover */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={handleGetDirections}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#F4E3B2] text-gray-800 font-medium rounded-lg hover:bg-[#E8D5A3] transition-colors"
                  >
                    <Navigation size={18} className="text-gray-800" />
                    Directions
                  </button>
                  {selectedRestaurant.phone && (
                    <a
                      href={`tel:${selectedRestaurant.phone}`}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-[#F4E3B2] text-gray-800 font-medium rounded-lg hover:bg-[#E8D5A3] transition-colors"
                    >
                      <Phone size={18} className="text-gray-800" />
                      Call
                    </a>
                  )}
                  {selectedRestaurant.website && (
                    <a
                      href={selectedRestaurant.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-[#F4E3B2] text-gray-800 font-medium rounded-lg hover:bg-[#E8D5A3] transition-colors"
                    >
                      <Globe size={18} className="text-gray-800" />
                      Website
                    </a>
                  )}
                  <button
                    onClick={handleSaveToPlate}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#F4E3B2] text-gray-800 font-medium rounded-lg hover:bg-[#E8D5A3] transition-colors"
                  >
                    <Heart size={18} className="text-gray-800" />
                    Save to Plate
                  </button>
                  <div className="flex items-center justify-center px-4 py-3 bg-[#F4E3B2] text-gray-800 rounded-lg hover:bg-[#E8D5A3] transition-colors">
                    <SharePostButton
                      cardId={selectedRestaurant.id}
                      title={selectedRestaurant.name}
                      imageUrl={selectedRestaurant.image || selectedRestaurant.photos?.[0]}
                      type="RESTAURANT"
                      subtitle={Array.isArray(selectedRestaurant.cuisine) ? selectedRestaurant.cuisine.join(', ') : selectedRestaurant.cuisine}
                      variant="light"
                      className="!text-gray-800 hover:!bg-transparent"
                    />
                    <span className="pr-4 text-gray-800 font-medium text-sm">Share to Chat</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center gap-4 mb-6 pb-6 border-b border-[#4d382a]">
                  <div className="flex items-center gap-2 px-6 py-4 bg-[#eda600] rounded-xl">
                    <span className="text-4xl">⭐</span>
                    <span className="text-5xl font-bold text-white">{selectedRestaurant.rating}</span>
                  </div>
                  <div className="px-6 py-4 bg-[#eda600] rounded-xl">
                    <span className="text-5xl font-bold text-white">{formatDistance(selectedRestaurant.distance)}</span>
                  </div>
                </div>

                {/* Tabs */}
                {!showDirections && (
                  <>
                    <div className="flex gap-4 mb-6 border-b border-gray-400">
                      <button
                        onClick={() => setDetailTab('overview')}
                        className={`pb-3 px-1 font-semibold ${detailTab === 'overview'
                          ? 'text-[#F4E3B2] border-b-2 border-[#F4E3B2]'
                          : 'text-gray-300 hover:text-white'
                          }`}
                      >
                        Overview
                      </button>
                      <button
                        onClick={() => setDetailTab('reviews')}
                        className={`pb-3 px-1 font-medium ${detailTab === 'reviews'
                          ? 'text-[#F4E3B2] border-b-2 border-[#F4E3B2]'
                          : 'text-gray-300 hover:text-white'
                          }`}
                      >
                        Reviews
                      </button>
                      <button
                        onClick={() => setDetailTab('photos')}
                        className={`pb-3 px-1 font-medium ${detailTab === 'photos'
                          ? 'text-[#F4E3B2] border-b-2 border-[#F4E3B2]'
                          : 'text-gray-300 hover:text-white'
                          }`}
                      >
                        Photos
                      </button>
                      <button
                        onClick={() => setDetailTab('menu')}
                        className={`pb-3 px-1 font-medium ${detailTab === 'menu'
                          ? 'text-[#F4E3B2] border-b-2 border-[#F4E3B2]'
                          : 'text-gray-300 hover:text-white'
                          }`}
                      >
                        Menu
                      </button>
                    </div>

                    {/* Overview Tab */}
                    {detailTab === 'overview' && (
                      <>
                        {/* About */}
                        {selectedRestaurant.description && (
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-3">About</h3>
                            <p className="text-gray-200 leading-relaxed mb-3">{selectedRestaurant.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {(typeof selectedRestaurant.cuisine === 'string'
                                ? selectedRestaurant.cuisine.split('·').map((c) => c.trim())
                                : selectedRestaurant.cuisine || []
                              ).map((tag) => (
                                <span key={tag} className="px-3 py-1 bg-orange-50 text-orange-700 text-sm rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}


                        {/* Location & Hours */}
                        <div className="mb-6 pb-6 border-b border-gray-400">
                          <h3 className="text-lg font-semibold text-white mb-3">Location & Hours</h3>
                          <div className="flex items-start gap-3 mb-3">
                            <MapPin className="text-[#F4E3B2] mt-1" size={20} />
                            <div>
                              <div className="text-white">{selectedRestaurant.address}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Clock className="text-[#F4E3B2] mt-1" size={20} />
                            <div>
                              <div
                                className={`font-medium ${selectedRestaurant.opening_hours?.open_now ? 'text-green-600' : 'text-red-600'
                                  }`}
                              >
                                {selectedRestaurant.opening_hours?.open_now ? 'Open now' : 'Closed'}
                              </div>
                              <div className="text-gray-300 text-sm">11:00 AM - 10:00 PM</div>
                            </div>
                          </div>
                        </div>

                        {/* Reviews Preview */}
                        {selectedRestaurant.reviews && selectedRestaurant.reviews.length > 0 && (
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-white">Reviews</h3>
                              <button className="text-[#F4E3B2] text-sm font-medium">See all</button>
                            </div>
                            <div className="space-y-4">
                              {selectedRestaurant.reviews.slice(0, 2).map((review, index) => (
                                <div key={index} className="pb-4 border-b border-gray-500">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                                      <span className="text-sm font-medium text-gray-300">
                                        {review.author_name.charAt(0)}
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-semibold text-white">{review.author_name}</div>
                                      <div className="flex items-center gap-1">
                                        <div className="flex text-[#F4E3B2] text-xs">
                                          {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={12} className={i < review.rating ? 'fill-[#F4E3B2]' : ''} />
                                          ))}
                                        </div>
                                        <span className="text-xs text-gray-400">{review.time}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-gray-200 text-sm">{review.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Reviews Tab */}
                    {detailTab === 'reviews' && (
                      <div>
                        {selectedRestaurant.reviews && selectedRestaurant.reviews.length > 0 ? (
                          <div className="space-y-4">
                            {selectedRestaurant.reviews.map((review, index) => (
                              <div key={index} className="pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-600">
                                      {review.author_name.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-semibold text-white">{review.author_name}</div>
                                    <div className="flex items-center gap-1">
                                      <div className="flex text-[#F4E3B2] text-xs">
                                        {[...Array(5)].map((_, i) => (
                                          <Star key={i} size={12} className={i < review.rating ? 'fill-[#F4E3B2]' : ''} />
                                        ))}
                                      </div>
                                      <span className="text-xs text-gray-500">{review.time}</span>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-gray-700 text-sm">{review.text}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            <p>No reviews available</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Photos Tab */}
                    {detailTab === 'photos' && (
                      <div>
                        {selectedRestaurant.photos && selectedRestaurant.photos.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {selectedRestaurant.photos.map((photo, index) => (
                              <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                                <img
                                  src={photo}
                                  alt={`${selectedRestaurant.name} photo ${index + 1}`}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            <p>No photos available</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Menu Tab */}
                    {detailTab === 'menu' && (
                      <div className="text-center text-gray-500 py-8">
                        <p>Menu coming soon</p>
                      </div>
                    )}
                  </>
                )}

                {/* Directions View */}
                {showDirections && (
                  <div>
                    <button
                      onClick={() => {
                        setShowDirections(false);
                        setRoutePolyline(null);
                        setRouteInfo(null);
                      }}
                      className="text-[#F4E3B2] text-sm font-medium mb-4 hover:text-[#E8D5A3]"
                    >
                      ← Back to overview
                    </button>

                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Directions</h3>

                    {/* Travel Modes */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <button
                        onClick={() => handleTravelModeChange('DRIVING')}
                        className={`p-3 border-2 rounded-lg text-center transition-colors ${selectedTravelMode === 'DRIVING'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="text-2xl mb-1">🚗</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {loadingRoute && selectedTravelMode === 'DRIVING' ? '...' :
                            routeInfo && selectedTravelMode === 'DRIVING' ? routeInfo.legs[0]?.duration.text : '--'}
                        </div>
                        <div className="text-xs text-gray-600">Driving</div>
                      </button>
                      <button
                        onClick={() => handleTravelModeChange('WALKING')}
                        className={`p-3 border-2 rounded-lg text-center transition-colors ${selectedTravelMode === 'WALKING'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="text-2xl mb-1">🚶</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {loadingRoute && selectedTravelMode === 'WALKING' ? '...' :
                            routeInfo && selectedTravelMode === 'WALKING' ? routeInfo.legs[0]?.duration.text : '--'}
                        </div>
                        <div className="text-xs text-gray-600">Walking</div>
                      </button>
                      <button
                        onClick={() => handleTravelModeChange('BICYCLING')}
                        className={`p-3 border-2 rounded-lg text-center transition-colors ${selectedTravelMode === 'BICYCLING'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="text-2xl mb-1">🚴</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {loadingRoute && selectedTravelMode === 'BICYCLING' ? '...' :
                            routeInfo && selectedTravelMode === 'BICYCLING' ? routeInfo.legs[0]?.duration.text : '--'}
                        </div>
                        <div className="text-xs text-gray-600">Cycling</div>
                      </button>
                    </div>

                    {/* Route Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Your location</div>
                          <div className="text-xs text-gray-600">
                            {routeInfo?.legs[0]?.startAddress || 'Current position'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{selectedRestaurant.name}</div>
                          <div className="text-xs text-gray-600">{selectedRestaurant.address}</div>
                        </div>
                      </div>
                      {routeInfo && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Distance:</span>
                            <span className="font-semibold">{routeInfo.legs[0]?.distance.text}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-600">Duration:</span>
                            <span className="font-semibold">{routeInfo.legs[0]?.duration.text}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Route Steps */}
                    {routeInfo && routeInfo.legs[0]?.steps && routeInfo.legs[0].steps.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Route Steps</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {routeInfo.legs[0].steps.slice(0, 10).map((step, index) => (
                            <div key={index} className="flex gap-2 text-sm">
                              <span className="text-gray-400 w-5">{index + 1}.</span>
                              <span
                                className="text-gray-700 flex-1"
                                dangerouslySetInnerHTML={{ __html: step.instruction }}
                              />
                              <span className="text-gray-500 text-xs">{step.distance.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Send to Google Maps Button */}
                    <button
                      onClick={() => {
                        if (selectedRestaurant) {
                          const mode = selectedTravelMode.toLowerCase();
                          const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedRestaurant.lat},${selectedRestaurant.lng}&travelmode=${mode}`;
                          window.open(googleMapsUrl, '_blank');
                        }
                      }}
                      className="w-full bg-orange-500 text-white font-semibold py-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Navigation size={20} />
                      Open in Google Maps
                    </button>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
