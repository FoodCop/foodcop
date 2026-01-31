import { useState, useEffect } from 'react';
import { Search, MapPin, Navigation, Star, Clock, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { backendService, formatGooglePlaceResult, getGooglePlacesPhotoUrl } from '../../services/backendService';
import type { GooglePlace } from '../../types';
import { RestaurantDetailDialog } from './components/RestaurantDetailDialog';
import { ScoutDesktop } from './ScoutDesktop';
import { GoogleMapView } from '../maps/GoogleMapView';
import { MapView } from './components/MapView';
import type { MapMarker } from '../maps/mapUtils';
import { SectionHeading } from '../ui/section-heading';
import { useAuth } from '../auth/AuthProvider';
import { savedItemsService } from '../../services';
import { toastHelpers } from '../../utils/toastHelpers';
import { SharePostButton } from '../feed/SharePostButton';
import { mapSavedItemToRestaurant, calculateDistanceKm } from '../../utils/savedRestaurantMapper';

// Hook to detect screen size
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(globalThis.innerWidth >= 1024);
    };

    checkDesktop();
    globalThis.addEventListener('resize', checkDesktop);
    return () => globalThis.removeEventListener('resize', checkDesktop);
  }, []);

  return isDesktop;
}

// Format distance: meters for < 1km, kilometers for >= 1km
const formatDistance = (distanceKm: number | undefined): string => {
  if (!distanceKm) return '0m';
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
  return `${distanceKm.toFixed(1)}km`;
};

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  lat: number;
  lng: number;
  address: string;
  distance?: number;
  place_id?: string;
  price_level?: number;
  photos?: string[];
  phone?: string;
  website?: string;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  reviews?: {
    author_name: string;
    rating: number;
    text: string;
    time: string;
  }[];
}

// Cuisine categories
const CUISINE_CATEGORIES = [
  { id: 'all', label: 'All', icon: 'fa-solid fa-utensils', query: '' },
  { id: 'italian', label: 'Italian', icon: 'fa-solid fa-pizza-slice', query: 'italian' },
  { id: 'japanese', label: 'Japanese', icon: 'fa-solid fa-fish', query: 'japanese sushi' },
  { id: 'mexican', label: 'Mexican', icon: 'fa-solid fa-pepper-hot', query: 'mexican' },
  { id: 'chinese', label: 'Chinese', icon: 'fa-solid fa-bowl-food', query: 'chinese' },
  { id: 'indian', label: 'Indian', icon: 'fa-solid fa-pepper-hot', query: 'indian' },
  { id: 'american', label: 'American', icon: 'fa-solid fa-burger', query: 'american burger' },
];

export default function ScoutNew() {
  // Detect desktop screen size
  const isDesktop = useIsDesktop();
  const { user } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<'discover' | 'my-map'>('discover');
  const [myMapFilter, setMyMapFilter] = useState<'nearby' | 'all'>('nearby');
  const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  // Mobile-specific state
  const [userLocation, setUserLocation] = useState<[number, number]>([37.7849, -122.4094]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(2);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [navigationRestaurant, setNavigationRestaurant] = useState<Restaurant | null>(null);

  // Fetch full restaurant details when clicked
  const handleNavigateToRestaurant = (restaurant: Restaurant) => {
    setNavigationRestaurant(restaurant);
    setShowMapView(true);
  };

  const fetchRestaurantDetails = async (restaurant: Restaurant) => {
    if (!restaurant.place_id) {
      setSelectedRestaurant(restaurant);
      setDialogOpen(true);
      return;
    }

    try {
      const response = await backendService.getPlaceDetails(restaurant.place_id);

      if (response.success && response.data?.result) {
        const details = response.data.result;

        // Convert photo references to full URLs
        const photos = details.photos
          ? details.photos.slice(0, 5).map((photo: { photo_reference: string }) =>
            getGooglePlacesPhotoUrl(photo.photo_reference, 800)
          )
          : restaurant.photos;

        // Merge basic info with detailed info
        const enrichedRestaurant: Restaurant = {
          ...restaurant,
          photos,
          phone: details.formatted_phone_number || details.international_phone_number,
          website: details.website,
          opening_hours: details.opening_hours ? {
            open_now: details.opening_hours.open_now,
            weekday_text: details.opening_hours.weekday_text
          } : undefined,
          reviews: details.reviews ? details.reviews.slice(0, 3).map((review: { author_name: string; rating: number; text: string; time: number; relative_time_description: string }) => ({
            author_name: review.author_name,
            rating: review.rating,
            text: review.text,
            time: review.relative_time_description
          })) : undefined
        };

        setSelectedRestaurant(enrichedRestaurant);
      } else {
        // Fallback to basic info if details fetch fails
        setSelectedRestaurant(restaurant);
      }
    } catch (error) {
      console.error('Failed to fetch restaurant details:', error);
      setSelectedRestaurant(restaurant);
    } finally {
      setDialogOpen(true);
    }
  };

  // Get user location on mount
  useEffect(() => {
    const getUserLocation = () => {
      console.log('🌍 Attempting to get user location...');

      if (!navigator.geolocation) {
        console.warn('⚠️ Geolocation not supported by browser');
        const defaultLocation: [number, number] = [37.7849, -122.4094];
        setUserLocation(defaultLocation);
        fetchRestaurants(37.7849, -122.4094, radiusKm);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log('✅ Got user location:', position.coords);
          const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newLocation);
          await reverseGeocode(position.coords.latitude, position.coords.longitude);
          fetchRestaurants(position.coords.latitude, position.coords.longitude, radiusKm);
        },
        (error) => {
          console.error('❌ Geolocation error:', error.message, error.code);
          console.log('📍 Using default location (San Francisco)');
          const defaultLocation: [number, number] = [37.7849, -122.4094];
          setUserLocation(defaultLocation);
          fetchRestaurants(37.7849, -122.4094, radiusKm);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    };

    getUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount, NOT when radiusKm changes

  // When radius changes, refetch with current location
  useEffect(() => {
    const hasRealLocation = userLocation[0] !== 37.7849 || userLocation[1] !== -122.4094;
    if (hasRealLocation) {
      // Only refetch if we have a real location (not the default SF coordinates)
      const query = selectedCategory === 'all' ? undefined : CUISINE_CATEGORIES.find(c => c.id === selectedCategory)?.query;
      fetchRestaurants(userLocation[0], userLocation[1], radiusKm, query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusKm]);

  // Load saved restaurants for My Map
  useEffect(() => {
    const loadSavedRestaurants = async () => {
      if (!user || activeTab !== 'my-map') {
        return;
      }

      setSavedLoading(true);
      try {
        const result = await savedItemsService.listSavedItems({ itemType: 'restaurant' });
        
        if (!result.success || !result.data) {
          setSavedRestaurants([]);
          return;
        }

        const mapped: Restaurant[] = [];
        for (const item of result.data) {
          const mappedRestaurant = mapSavedItemToRestaurant(item);
          if (mappedRestaurant) {
            // Calculate distance from user location
            if (userLocation) {
              const origin = { lat: userLocation[0], lng: userLocation[1] };
              const dest = { lat: mappedRestaurant.lat, lng: mappedRestaurant.lng };
              const distKm = calculateDistanceKm(origin, dest);
              // Convert to Restaurant type with distance
              const restaurant: Restaurant = {
                id: mappedRestaurant.id,
                name: mappedRestaurant.name,
                address: mappedRestaurant.address,
                lat: mappedRestaurant.lat,
                lng: mappedRestaurant.lng,
                cuisine: Array.isArray(mappedRestaurant.cuisine) ? mappedRestaurant.cuisine.join(', ') : mappedRestaurant.cuisine,
                rating: mappedRestaurant.rating || 0,
                price_level: mappedRestaurant.price_level,
                distance: distKm,
                photos: Array.isArray(mappedRestaurant.photos)
                  ? mappedRestaurant.photos.map((p) =>
                      typeof p === 'string' ? p : `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${p.photo_reference}&key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}`
                    )
                  : [],
              };
              mapped.push(restaurant);
            }
          }
        }

        setSavedRestaurants(mapped);
      } catch (err) {
        console.error('Failed to load saved restaurants:', err);
        toast.error('Failed to load saved places');
      } finally {
        setSavedLoading(false);
      }
    };

    loadSavedRestaurants();
  }, [activeTab, user, userLocation]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'FUZO-FoodApp/1.0' } }
      );
      const data = await response.json();

      if (data?.display_name) {
        console.log('Location:', data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  const fetchRestaurants = async (lat: number, lng: number, radius: number, query?: string) => {
    console.log('fetchRestaurants called:', { lat, lng, radius, query });
    setError(null);
    setLoading(true);

    try {
      let results: Restaurant[] = [];
      const radiusMeters = radius * 1000;

      if (query?.trim()) {
        console.log('Searching by text:', `${query} restaurant`);
        const response = await backendService.searchPlacesByText(
          `${query} restaurant`,
          { lat, lng }
        );

        console.log('Search response:', response);

        if (response.success && response.data?.results) {
          results = response.data.results.map((place: GooglePlace) =>
            formatGooglePlaceResult(place, { lat, lng })
          ).filter((restaurant: Restaurant) =>
            restaurant.distance !== undefined && restaurant.distance <= radius
          );
        } else {
          console.error('Text search failed:', response.error);
          setError(response.error || 'Failed to search restaurants');
        }
      } else {
        console.log('Searching nearby with radius:', radiusMeters);
        const response = await backendService.searchNearbyPlaces(
          { lat, lng },
          radiusMeters,
          'restaurant'
        );

        console.log('Nearby response:', response);

        if (response.success && response.data?.results) {
          results = response.data.results.map((place: GooglePlace) =>
            formatGooglePlaceResult(place, { lat, lng })
          );
          console.log('✅ Successfully formatted', results.length, 'restaurants from API');
        } else {
          console.error('Nearby search failed:', response.error);
          setError(response.error || 'Failed to load nearby restaurants');
        }
      }

      results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      console.log('Setting restaurants:', results.length);
      setRestaurants(results);

      if (results.length === 0) {
        toast.error(`No restaurants found within ${radius}km`);
      } else {
        console.log('📍 Sample restaurant:', results[0]);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError('Failed to load restaurants');
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    const category = CUISINE_CATEGORIES.find(c => c.id === categoryId);
    setSelectedCategory(categoryId);
    if (category) {
      fetchRestaurants(userLocation[0], userLocation[1], radiusKm, category.query);
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        fetchRestaurants(userLocation[0], userLocation[1], radiusKm, searchQuery);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      const category = CUISINE_CATEGORIES.find(c => c.id === selectedCategory);
      fetchRestaurants(userLocation[0], userLocation[1], radiusKm, category?.query);
    }
  }, [searchQuery, radiusKm, selectedCategory, userLocation]);

  // Filter saved restaurants based on My Map filter
  const filteredSavedRestaurants =
    myMapFilter === 'all'
      ? savedRestaurants
      : savedRestaurants.filter((r) => {
          const distKm = calculateDistanceKm(
            { lat: userLocation[0], lng: userLocation[1] },
            { lat: r.lat, lng: r.lng }
          );
          return distKm <= 20;
        });

  // Render desktop version for screens >= 1024px
  if (isDesktop) {
    return <ScoutDesktop />;
  }

  // Mobile version below
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Container - Max width for mobile view */}
      <div className="max-w-md mx-auto bg-background min-h-screen md:max-w-full">

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-background px-4 pt-2">
          <div className="inline-flex rounded-full p-1">
            <button
              type="button"
              onClick={() => setActiveTab('discover')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                activeTab === 'discover'
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{
                backgroundColor: activeTab === 'discover' ? 'var(--yellow-tertiary)' : 'transparent'
              }}
            >
              Discover
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('my-map')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                activeTab === 'my-map'
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{
                backgroundColor: activeTab === 'my-map' ? 'var(--yellow-tertiary)' : 'transparent'
              }}
            >
              My Map
            </button>
          </div>
        </div>

        {/* Discover Tab Content */}
        {activeTab === 'discover' && (<>
        {/* Distance Control */}
        <section className="px-5 py-4" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
          <div className="flex items-center justify-between mb-3">
            <i className="fa-solid fa-person-walking text-gray-700" style={{ fontSize: '10pt' }} aria-label="Distance"></i>
            <span className="text-sm font-bold text-gray-900">{radiusKm} km</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number.parseFloat(e.target.value))}
              className="scout-distance-slider w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--gray-700) 0%, var(--gray-700) ${((radiusKm - 0.5) / (10 - 0.5)) * 100}%, var(--gray-300) ${((radiusKm - 0.5) / (10 - 0.5)) * 100}%, var(--gray-300) 100%)`
              }}
            />
            {/* Tick marks */}
            <div className="flex justify-between mt-1 px-1">
              {[0.5, 2, 4, 6, 8, 10].map((tick) => (
                <div key={tick} className="w-px h-2 bg-gray-300" />
              ))}
            </div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs font-semibold text-gray-900">0.5 km</span>
            <span className="text-xs font-semibold text-gray-900">10 km</span>
          </div>
        </section>

        {/* Map Section */}
        <section className="px-5 py-4">
          <div className="relative w-full h-80 rounded-3xl overflow-hidden shadow-lg">
            <GoogleMapView
              center={{ lat: userLocation[0], lng: userLocation[1] }}
              zoom={13}
              userLocation={{ lat: userLocation[0], lng: userLocation[1] }}
              markers={restaurants.map((restaurant): MapMarker => ({
                id: restaurant.id,
                position: { lat: restaurant.lat, lng: restaurant.lng },
                title: restaurant.name,
                data: restaurant,
              }))}
              selectedMarkerId={selectedRestaurant?.id}
              onMarkerClick={(markerId, data) => {
                const restaurant = data as Restaurant;
                fetchRestaurantDetails(restaurant);
              }}
              className="w-full h-full"
              height="320px"
            />

            {/* Your Location Badge */}
            <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-full shadow-md flex items-center space-x-2 pointer-events-none z-10">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-gray-900">Your Location</span>
            </div>

            {/* Recenter button */}
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
                      setUserLocation(newLocation);
                      await reverseGeocode(position.coords.latitude, position.coords.longitude);
                      fetchRestaurants(position.coords.latitude, position.coords.longitude, radiusKm);
                    }
                  );
                }
              }}
              className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow z-10"
            >
              <Navigation className="text-gray-700 text-lg" />
            </button>
          </div>

          {/* Location info */}
          <div className="flex items-center justify-center mt-4 space-x-2">
            <MapPin className="text-red-500 text-sm" />
            <span className="text-sm text-gray-600">{restaurants.length} restaurants nearby</span>
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-600 text-base">Finding restaurants... 🔍</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 px-5">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-3xl">⚠️</span>
            </div>
            <p className="text-gray-900 font-semibold text-base mb-1">Failed to load restaurants</p>
            <p className="text-gray-600 text-sm mb-4 text-center">{error}</p>
            <button
              onClick={() => fetchRestaurants(userLocation[0], userLocation[1], radiusKm)}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm shadow-md active:scale-95 transition-transform"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Nearby Restaurants Carousel */}
        {!loading && !error && restaurants.length > 0 && (
          <section className="py-6">
            <div className="px-5 mb-4">
              <SectionHeading>Nearby Restaurants</SectionHeading>
            </div>

            <div className="flex overflow-x-auto space-x-4 px-5 pb-2 hide-scrollbar">
              {restaurants.slice(0, 6).map((restaurant) => (
                <RestaurantCarouselCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onClick={() => fetchRestaurantDetails(restaurant)}
                  onNavigate={handleNavigateToRestaurant}
                />
              ))}
            </div>
          </section>
        )}

        {/* Featured Restaurant */}
        {!loading && !error && restaurants.length > 0 && (
          <section className="px-5 py-6 bg-gray-50">
            <SectionHeading className="mb-4">Featured Restaurant</SectionHeading>
            <FeaturedRestaurantCard
              restaurant={restaurants[0]}
              onClick={() => fetchRestaurantDetails(restaurants[0])}
              onNavigate={handleNavigateToRestaurant}
            />
          </section>
        )}

        {/* Empty State */}
        {!loading && !error && restaurants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">🏪</span>
            </div>
            <p className="text-gray-900 font-semibold text-base mb-2">No restaurants found</p>
            <p className="text-gray-600 text-sm text-center">
              Try adjusting your search or increasing the radius
            </p>
          </div>
        )}

        <div className="h-24"></div>
        </>)}

      {/* My Map Tab Content */}
      {activeTab === 'my-map' && (
        <div className="px-5 py-6">
          {/* Filter Toggle */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Saved Places</h2>
            <div className="inline-flex rounded-full bg-gray-100 p-1">
              <button
                onClick={() => setMyMapFilter('nearby')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  myMapFilter === 'nearby'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-transparent text-gray-600'
                }`}
              >
                Nearby
              </button>
              <button
                onClick={() => setMyMapFilter('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  myMapFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-transparent text-gray-600'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Map Section */}
          <div className="relative w-full h-80 rounded-3xl overflow-hidden shadow-lg mb-6">
            <GoogleMapView
              center={{ lat: userLocation[0], lng: userLocation[1] }}
              zoom={13}
              userLocation={{ lat: userLocation[0], lng: userLocation[1] }}
              markers={filteredSavedRestaurants.map((restaurant): MapMarker => ({
                id: restaurant.id,
                position: { lat: restaurant.lat, lng: restaurant.lng },
                title: restaurant.name,
                data: restaurant,
              }))}
              selectedMarkerId={selectedRestaurant?.id}
              onMarkerClick={(markerId, data) => {
                const restaurant = data as Restaurant;
                fetchRestaurantDetails(restaurant);
              }}
            />
          </div>

          {/* Loading State */}
          {savedLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-gray-600 text-base">Loading saved places... 🔍</p>
            </div>
          )}

          {/* Empty State */}
          {!savedLoading && filteredSavedRestaurants.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">📍</span>
              </div>
              <p className="text-gray-900 font-semibold text-base mb-2">
                {myMapFilter === 'nearby' ? 'No nearby saved places' : 'No saved places yet'}
              </p>
              <p className="text-gray-600 text-sm text-center px-8">
                {myMapFilter === 'nearby' 
                  ? 'Try switching to "All" to see all your saved places'
                  : 'Save restaurants from Discover to see them here'}
              </p>
            </div>
          )}

          {/* Saved Restaurants List */}
          {!savedLoading && filteredSavedRestaurants.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {filteredSavedRestaurants.length} {filteredSavedRestaurants.length === 1 ? 'Place' : 'Places'}
              </h3>
              {filteredSavedRestaurants.map((restaurant) => (
                <button
                  key={restaurant.id}
                  onClick={() => fetchRestaurantDetails(restaurant)}
                  className="w-full bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Image Section */}
                  <div className="relative h-48 bg-gray-100">
                    {restaurant.photos && restaurant.photos.length > 0 ? (
                      <img
                        src={restaurant.photos[0]}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl">🍽️</span>
                      </div>
                    )}
                    
                    {/* Overlay with rating and distance */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="bg-gray-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center space-x-1.5">
                        <Navigation className="w-3.5 h-3.5 text-white" />
                        <span className="text-sm text-white">{formatDistance(restaurant.distance)}</span>
                      </div>
                      {restaurant.rating && (
                        <div className="bg-white px-4 py-2 rounded-full flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-lg font-bold text-gray-900">{restaurant.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="p-4">
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{restaurant.name}</h4>
                    
                    {/* Tags */}
                    <div className="flex items-center space-x-2 mb-3">
                      {restaurant.cuisine && typeof restaurant.cuisine === 'string' && restaurant.cuisine.split(',').slice(0, 2).map((type) => (
                        <span key={type.trim()} className="px-3 py-1 bg-gray-50 rounded-full text-xs font-medium text-gray-700">
                          {type.trim()}
                        </span>
                      ))}
                      {restaurant.price_level && (
                        <span className="px-3 py-1 bg-gray-50 rounded-full text-xs font-medium text-gray-700">
                          {'$'.repeat(restaurant.price_level)}
                        </span>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigateToRestaurant(restaurant);
                      }}
                      className="w-full h-10 bg-gray-900 text-white rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-gray-800 transition-colors"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Navigate</span>
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="h-24"></div>
        </div>
      )}

      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Distance slider styling */
        .scout-distance-slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border: 2px solid #E5E7EB;
        }
        
        .scout-distance-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border: 2px solid #E5E7EB;
        }
      `}</style>

      <RestaurantDetailDialog
        restaurant={selectedRestaurant}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Navigation MapView */}
      <MapView
        restaurant={navigationRestaurant}
        open={showMapView}
        onClose={() => {
          setShowMapView(false);
          setNavigationRestaurant(null);
        }}
      />
    </div>
  );
}

// Carousel Card Component (for horizontal scroll)
function RestaurantCarouselCard({ restaurant, onClick, onNavigate }: Readonly<{ restaurant: Restaurant; onClick?: () => void; onNavigate?: (restaurant: Restaurant) => void }>) {
  const priceLevel = restaurant.price_level ? '$'.repeat(restaurant.price_level) : '$$';
  const distanceText = formatDistance(restaurant.distance);
  const cuisineText = Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : restaurant.cuisine;

  return (
    <button
      onClick={onClick}
      className="shrink-0 w-72 bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow text-left"
    >
      {/* Image placeholder */}
      <div className="relative h-40 overflow-hidden bg-linear-to-br from-gray-100 to-gray-200">
        {restaurant.photos && restaurant.photos.length > 0 ? (
          <img
            src={restaurant.photos[0]}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-full h-full flex items-center justify-center ${restaurant.photos && restaurant.photos.length > 0 ? 'hidden' : ''}`}>
          <MapPin className="w-12 h-12 text-gray-300" />
        </div>

        {/* Rating badge */}
        <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full flex items-center space-x-1">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-bold text-gray-900">{restaurant.rating}</span>
        </div>

        {/* Share to Chat button */}
        <div className="absolute top-3 right-12">
          <SharePostButton
            cardId={restaurant.place_id || restaurant.id}
            title={restaurant.name}
            imageUrl={restaurant.photos?.[0]}
            type="RESTAURANT"
            subtitle={cuisineText}
          />
        </div>

        {/* Distance badge */}
        <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
          {distanceText}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{restaurant.name}</h3>
        <p className="text-sm text-gray-500 mb-3 truncate">
          {Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(' • ') : restaurant.cuisine}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-600">25 min</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-600">{priceLevel}</span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onNavigate) onNavigate(restaurant);
            }}
            className="w-9 h-9 bg-orange-50 rounded-full flex items-center justify-center hover:bg-orange-100 transition-colors"
          >
            <Navigation className="w-4 h-4 text-orange-600" />
          </button>
        </div>
      </div>
    </button>
  );
}

// Featured Restaurant Card Component
function FeaturedRestaurantCard({ restaurant, onClick, onNavigate }: Readonly<{ restaurant: Restaurant; onClick?: () => void; onNavigate?: (restaurant: Restaurant) => void }>) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const priceLevel = restaurant.price_level ? '$'.repeat(restaurant.price_level) : '$$$';
  const distanceText = `${formatDistance(restaurant.distance)} away`;
  const cuisineText = Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : restaurant.cuisine;

  const cuisineTypes: string[] = Array.isArray(restaurant.cuisine) ? restaurant.cuisine : [restaurant.cuisine || 'Restaurant'];

  const handleSaveToPlate = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      toast.error('Please sign in to save restaurants');
      return;
    }

    setSaving(true);
    try {
      const cuisineText = Array.isArray(restaurant.cuisine)
        ? restaurant.cuisine.join(', ')
        : restaurant.cuisine;

      const result = await savedItemsService.saveItem({
        itemId: restaurant.place_id || restaurant.id,
        itemType: 'restaurant',
        metadata: {
          name: restaurant.name,
          cuisine: cuisineText,
          rating: restaurant.rating,
          address: restaurant.address,
          lat: restaurant.lat,
          lng: restaurant.lng,
          place_id: restaurant.place_id || restaurant.id,
          price_level: restaurant.price_level,
          photos: restaurant.photos,
          phone: restaurant.phone,
          website: restaurant.website,
        }
      });

      if (result.success) {
        toastHelpers.saved(restaurant.name);
      } else if (result.error === 'Item already saved') {
        toastHelpers.saved(restaurant.name, true);
      } else {
        toastHelpers.error(result.error || 'Failed to save restaurant');
      }
    } catch (error) {
      console.error('Error saving restaurant:', error);
      toast.error('An error occurred while saving the restaurant');
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow text-left w-full"
    >
      {/* Hero image with gradient overlay */}
      <div className="relative h-56 overflow-hidden bg-linear-to-br from-gray-200 to-gray-300">
        {restaurant.photos && restaurant.photos.length > 0 ? (
          <img
            src={restaurant.photos[0]}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-full h-full flex items-center justify-center ${restaurant.photos && restaurant.photos.length > 0 ? 'hidden' : ''}`}>
          <MapPin className="w-16 h-16 text-gray-400" />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent"></div>

        {/* Share to Chat button */}
        <div className="absolute top-4 right-4">
          <SharePostButton
            cardId={restaurant.place_id || restaurant.id}
            title={restaurant.name}
            imageUrl={restaurant.photos?.[0]}
            type="RESTAURANT"
            subtitle={cuisineText}
          />
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">{restaurant.name}</h3>
              <div className="flex items-center space-x-2">
                <MapPin className="w-3 h-3 text-white" />
                <span className="text-sm text-white">{distanceText}</span>
              </div>
            </div>
            <div className="bg-white px-4 py-2 rounded-full flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-lg font-bold text-gray-900">{restaurant.rating}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details section */}
      <div className="p-5">
        {/* Tags */}
        <div className="flex items-center space-x-2 mb-4">
          {cuisineTypes.slice(0, 2).map((type) => (
            <span key={type} className="px-3 py-1 bg-gray-50 rounded-full text-xs font-medium text-gray-700">
              {type}
            </span>
          ))}
          <span className="px-3 py-1 bg-gray-50 rounded-full text-xs font-medium text-gray-700">
            {priceLevel}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-5 leading-relaxed line-clamp-2">
          Experience exquisite cuisine in an elegant setting. Our chef-curated menu features seasonal ingredients and classic techniques.
        </p>

        {/* Action icons */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Clock className="text-gray-700 text-lg" />
            </div>
            <span className="text-xs text-gray-500">Open Now</span>
            <p className="text-sm font-semibold text-gray-900">11AM-10PM</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <span className="text-gray-700 text-lg">📞</span>
            </div>
            <span className="text-xs text-gray-500">Call</span>
            <p className="text-sm font-semibold text-gray-900">Reserve</p>
          </div>
          <div className="text-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigate) onNavigate(restaurant);
              }}
              className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-2 hover:bg-orange-100 transition-colors"
            >
              <Navigation className="text-orange-600 text-lg" />
            </button>
            <span className="text-xs text-gray-500">Navigate</span>
            <p className="text-sm font-semibold text-gray-900">{distanceText}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleSaveToPlate}
            disabled={saving}
            className="flex-1 h-12 text-black rounded-2xl font-semibold flex items-center justify-center space-x-2 hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--yellow-feed)' }}
          >
            <span>💾</span>
            <span>{saving ? 'Saving...' : 'Save to Plate'}</span>
          </button>
        </div>
      </div>
    </button>
  );
}
