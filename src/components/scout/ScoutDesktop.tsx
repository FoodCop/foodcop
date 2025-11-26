import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Clock, Phone, Globe, Navigation, Heart } from 'lucide-react';
import { savedItemsService } from '../../services/savedItemsService';
import { useAuth } from '../auth/AuthProvider';
import { toast } from 'sonner';
import { toastHelpers } from '../../utils/toastHelpers';
import { GoogleMapView } from '../maps/GoogleMapView';
import type { MapMarker } from '../maps/mapUtils';
import { backendService, formatGooglePlaceResult, getGooglePlacesPhotoUrl } from '../../services/backendService';
import { getDirections, type TravelMode, type Route } from '../../services/googleDirections';
import type { GooglePlace } from '../../types';

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
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [distance, setDistance] = useState(2.5);
  const [activeFilter, setActiveFilter] = useState<string>('popular');
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'photos' | 'menu'>('overview');
  const [showDirections, setShowDirections] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number]>([13.1072, 80.0915456]); // Default to Tamil Nadu
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routePolyline, setRoutePolyline] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<Route | null>(null);
  const [selectedTravelMode, setSelectedTravelMode] = useState<TravelMode>('DRIVING');
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Get user location and fetch restaurants on mount
  useEffect(() => {
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
          toast.error('Unable to get your location. Using default.');
          fetchRestaurants(userLocation[0], userLocation[1], distance);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    };

    getUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Refetch when distance changes
  useEffect(() => {
    const hasRealLocation = userLocation[0] !== 13.1072 || userLocation[1] !== 80.0915456;
    if (hasRealLocation || restaurants.length === 0) {
      const query = searchQuery.trim() || undefined;
      fetchRestaurants(userLocation[0], userLocation[1], distance, query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distance]);

  // Search with debounce
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        fetchRestaurants(userLocation[0], userLocation[1], distance, searchQuery);
      }, 500);
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
    setActiveTab('overview');
    
    // Fetch detailed info including reviews and photos
    if (restaurant.id) {
      try {
        const response = await backendService.getPlaceDetails(restaurant.id);
        if (response.success && response.data?.result) {
          const details = response.data.result;
          
          // Convert photo references to full URLs
          const photos = details.photos 
            ? details.photos.slice(0, 8).map((photo: { photo_reference: string }) => 
                getGooglePlacesPhotoUrl(photo.photo_reference, 800)
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

    try {
      const result = await savedItemsService.saveItem({
        itemId: selectedRestaurant.id,
        itemType: 'restaurant',
        metadata: {
          address: selectedRestaurant.address,
          rating: selectedRestaurant.rating,
          cuisine: selectedRestaurant.cuisine,
          image: selectedRestaurant.image
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

  const priceLevel = selectedRestaurant?.price_level ? '$'.repeat(selectedRestaurant.price_level) : '$$';

  return (
    <div className="flex flex-col h-screen bg-gray-50" style={{ fontSize: '10pt' }}>
      <div className="flex flex-1">
      {/* Left Sidebar */}
      <aside className="w-[380px] bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search restaurants, cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
            />
            <Search className="absolute left-4 top-4 text-gray-400" size={18} />
          </div>

          {/* Distance Slider */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <i className="fa-solid fa-person-walking text-gray-700" style={{ fontSize: '10pt' }} aria-label="Distance"></i>
              <span className="text-sm font-semibold text-orange-600">{formatDistance(distance)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="50"
              step="0.5"
              value={distance}
              onChange={(e) => setDistance(Number.parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.5km</span>
              <span>10km</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveFilter('popular')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                activeFilter === 'popular'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Popular
            </button>
            <button
              onClick={() => setActiveFilter('top-rated')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                activeFilter === 'top-rated'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Top Rated
            </button>
            <button
              onClick={() => setActiveFilter('fast-delivery')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                activeFilter === 'fast-delivery'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Fast Delivery
            </button>
          </div>
        </div>

        {/* Restaurant List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Finding nearby restaurants...</p>
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
                <p className="text-gray-600 mb-2">No restaurants found</p>
                <p className="text-sm text-gray-500">Try increasing the search radius</p>
              </div>
            </div>
          ) : (
            restaurants.map((restaurant) => (
              <button
                key={restaurant.id}
                onClick={() => handleRestaurantClick(restaurant)}
                className={`w-full p-4 border-b border-gray-100 hover:bg-orange-50 cursor-pointer transition-colors text-left ${
                  selectedRestaurant?.id === restaurant.id ? 'bg-orange-50' : ''
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
                    <div className={`w-full h-full flex items-center justify-center ${restaurant.image ? 'hidden' : ''}`}>
                      <MapPin className="text-gray-400" size={32} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{restaurant.name}</h3>
                    <div className="flex items-center gap-1 mb-1">
                      <div className="flex text-orange-500 text-xs">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < Math.floor(restaurant.rating) ? 'fill-orange-500' : ''}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{restaurant.rating}</span>
                      <span className="text-xs text-gray-500">({restaurant.userRatingsTotal})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                      <span>{restaurant.cuisine}</span>
                      <span className="text-gray-400">·</span>
                      <span>{restaurant.price_level ? '$'.repeat(restaurant.price_level) : '$$'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">{formatDistance(restaurant.distance)}</span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          restaurant.opening_hours?.open_now
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
        </div>
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
          markers={restaurants.map((restaurant): MapMarker => ({
            id: restaurant.id,
            position: { lat: restaurant.lat, lng: restaurant.lng },
            title: restaurant.name,
            data: restaurant,
          }))}
          selectedMarkerId={selectedRestaurant?.id}
          onMarkerClick={(markerId) => {
            const restaurant = restaurants.find(r => r.id === markerId);
            if (restaurant) {
              handleRestaurantClick(restaurant);
            }
          }}
          enableClustering={restaurants.length > 20}
          route={showDirections && routePolyline ? routePolyline : undefined}
          className="w-full h-full"
        />

        {/* Search This Area Button */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <button className="px-4 py-2 bg-white rounded-full shadow-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Search this area
          </button>
        </div>
      </div>

      {/* Right Panel */}
      {selectedRestaurant && (
        <aside className="w-[420px] bg-white border-l border-gray-200 flex flex-col overflow-hidden">
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedRestaurant.name}</h2>
                  <div className="flex items-center gap-2">
                    <div className="flex text-orange-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < Math.floor(selectedRestaurant.rating) ? 'fill-orange-500' : ''}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{selectedRestaurant.rating}</span>
                    <span className="text-gray-600">({selectedRestaurant.userRatingsTotal} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={handleGetDirections}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Navigation size={18} />
                  Directions
                </button>
                {selectedRestaurant.phone && (
                  <a
                    href={`tel:${selectedRestaurant.phone}`}
                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Phone size={18} />
                    Call
                  </a>
                )}
                {selectedRestaurant.website && (
                  <a
                    href={selectedRestaurant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Globe size={18} />
                    Website
                  </a>
                )}
                <button
                  onClick={handleSaveToPlate}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Heart size={18} />
                  Save to Plate
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500 mb-1">{selectedRestaurant.rating}</div>
                  <div className="text-xs text-gray-600">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{selectedRestaurant.deliveryTime || '30m'}</div>
                  <div className="text-xs text-gray-600">Delivery</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{formatDistance(selectedRestaurant.distance)}</div>
                  <div className="text-xs text-gray-600">Distance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{priceLevel}</div>
                  <div className="text-xs text-gray-600">Price</div>
                </div>
              </div>

              {/* Tabs */}
              {!showDirections && (
                <>
                  <div className="flex gap-4 mb-6 border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`pb-3 px-1 font-semibold ${
                        activeTab === 'overview'
                          ? 'text-orange-500 border-b-2 border-orange-500'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('reviews')}
                      className={`pb-3 px-1 font-medium ${
                        activeTab === 'reviews'
                          ? 'text-orange-500 border-b-2 border-orange-500'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Reviews
                    </button>
                    <button
                      onClick={() => setActiveTab('photos')}
                      className={`pb-3 px-1 font-medium ${
                        activeTab === 'photos'
                          ? 'text-orange-500 border-b-2 border-orange-500'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Photos
                    </button>
                    <button
                      onClick={() => setActiveTab('menu')}
                      className={`pb-3 px-1 font-medium ${
                        activeTab === 'menu'
                          ? 'text-orange-500 border-b-2 border-orange-500'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Menu
                    </button>
                  </div>

                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <>
                      {/* About */}
                      {selectedRestaurant.description && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                          <p className="text-gray-700 leading-relaxed mb-3">{selectedRestaurant.description}</p>
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
                      <div className="mb-6 pb-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Location & Hours</h3>
                        <div className="flex items-start gap-3 mb-3">
                          <MapPin className="text-orange-500 mt-1" size={20} />
                          <div>
                            <div className="text-gray-900">{selectedRestaurant.address}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Clock className="text-orange-500 mt-1" size={20} />
                          <div>
                            <div
                              className={`font-medium ${
                                selectedRestaurant.opening_hours?.open_now ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {selectedRestaurant.opening_hours?.open_now ? 'Open now' : 'Closed'}
                            </div>
                            <div className="text-gray-600 text-sm">11:00 AM - 10:00 PM</div>
                          </div>
                        </div>
                      </div>

                      {/* Reviews Preview */}
                      {selectedRestaurant.reviews && selectedRestaurant.reviews.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
                            <button className="text-orange-500 text-sm font-medium">See all</button>
                          </div>
                          <div className="space-y-4">
                            {selectedRestaurant.reviews.slice(0, 2).map((review, index) => (
                              <div key={index} className="pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-600">
                                      {review.author_name.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-900">{review.author_name}</div>
                                    <div className="flex items-center gap-1">
                                      <div className="flex text-orange-500 text-xs">
                                        {[...Array(5)].map((_, i) => (
                                          <Star key={i} size={12} className={i < review.rating ? 'fill-orange-500' : ''} />
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
                        </div>
                      )}
                    </>
                  )}

                  {/* Reviews Tab */}
                  {activeTab === 'reviews' && (
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
                                  <div className="font-semibold text-gray-900">{review.author_name}</div>
                                  <div className="flex items-center gap-1">
                                    <div className="flex text-orange-500 text-xs">
                                      {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={12} className={i < review.rating ? 'fill-orange-500' : ''} />
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
                  {activeTab === 'photos' && (
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
                  {activeTab === 'menu' && (
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
                    className="text-orange-500 text-sm font-medium mb-4 hover:text-orange-600"
                  >
                    ← Back to overview
                  </button>

                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Directions</h3>

                  {/* Travel Modes */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <button
                      onClick={() => handleTravelModeChange('DRIVING')}
                      className={`p-3 border-2 rounded-lg text-center transition-colors ${
                        selectedTravelMode === 'DRIVING'
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
                      className={`p-3 border-2 rounded-lg text-center transition-colors ${
                        selectedTravelMode === 'WALKING'
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
                      className={`p-3 border-2 rounded-lg text-center transition-colors ${
                        selectedTravelMode === 'BICYCLING'
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
