import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Input } from '../ui/input';
import { MapPin, Navigation, ExternalLink, X, Info, Clock, Phone, Globe, Star, DollarSign, Bookmark, Share2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { toast } from 'sonner';
import { Toaster } from '../ui/sonner';
import { Map, Marker, Overlay } from 'pigeon-maps';
import { backendService, formatGooglePlaceResult } from '../../services/backendService';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { getPlaceImages, generateStaticMapFallback, getPlaceDetails } from '../../services/googlePlacesImages';
import { savedItemsService } from '../../services';
import { useAuth } from '../auth/AuthProvider';
import type { GooglePlace } from '../../types';
import './fixes/SliderStyles.css';

// Review type for raw data processing
interface RawReviewData {
  author_name?: string;
  author?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
  relativeTimeDescription?: string;
}

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
    open_now: boolean;
    weekday_text: string[];
  };
}

// Mock restaurant data (centered around San Francisco) - Will be replaced with Google Places API
const mockRestaurants: Restaurant[] = [
  { id: "1", name: "Golden Dragon", cuisine: "Chinese", rating: 4.5, lat: 37.7849, lng: -122.4094, address: "123 Chinatown St" },
  { id: "2", name: "Mama Mia", cuisine: "Italian", rating: 4.8, lat: 37.7849, lng: -122.4194, address: "456 Little Italy Ave" },
  { id: "3", name: "Spice Garden", cuisine: "Thai", rating: 4.3, lat: 37.7899, lng: -122.4144, address: "789 Spice St" },
  { id: "4", name: "Le Petit Bistro", cuisine: "French", rating: 4.7, lat: 37.7829, lng: -122.4190, address: "321 Hayes St" },
  { id: "5", name: "Spice Route", cuisine: "Indian", rating: 4.4, lat: 37.7889, lng: -122.4074, address: "654 Folsom St" },
  { id: "6", name: "Dragon Wok", cuisine: "Chinese", rating: 4.6, lat: 37.7809, lng: -122.4134, address: "987 Geary St" },
  { id: "7", name: "Mediterranean Delight", cuisine: "Mediterranean", rating: 4.5, lat: 37.7859, lng: -122.4020, address: "147 Howard St" },
  { id: "8", name: "Tokyo Sushi", cuisine: "Japanese", rating: 4.9, lat: 37.7869, lng: -122.4110, address: "258 Japantown Blvd" },
  { id: "9", name: "El Sombrero", cuisine: "Mexican", rating: 4.2, lat: 37.7819, lng: -122.4170, address: "369 Mission St" },
  { id: "10", name: "Burger Palace", cuisine: "American", rating: 4.0, lat: 37.7839, lng: -122.4050, address: "741 Market St" }
];

// Custom marker component for restaurants
function RestaurantMarker({ restaurant, isSelected, onClick }: { 
  restaurant: Restaurant; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <div
      style={{ 
        cursor: 'pointer',
        transform: 'translate(-50%, -100%)',
        zIndex: isSelected ? 1000 : 10
      }}
      onClick={onClick}
    >
      <div className={`
        relative px-2 py-1 rounded-lg text-xs font-medium shadow-lg transition-all duration-200
        ${isSelected 
          ? 'bg-orange-600 text-white scale-110 shadow-xl' 
          : 'bg-white text-gray-800 hover:bg-orange-50 hover:scale-105'
        }
      `}>
        {restaurant.name}
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-yellow-500">★</span>
          <span>{restaurant.rating}</span>
        </div>
        {/* Pointer */}
        <div className={`
          absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
          border-l-4 border-r-4 border-t-4 border-transparent
          ${isSelected ? 'border-t-orange-600' : 'border-t-white'}
        `} />
      </div>
    </div>
  );
}

// Main component
export default function App() {
  // Authentication
  const { user } = useAuth();
  
  const [userLocation, setUserLocation] = useState<[number, number]>([37.7849, -122.4094]);
  const [userAddress, setUserAddress] = useState<string>('Getting location...');
  const [searchDistance, setSearchDistance] = useState([2]); // in km
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Restaurant details state
  const [restaurantDetails, setRestaurantDetails] = useState<{
    id: string;
    name: string;
    address: string;
    phone?: string;
    website?: string;
    photos?: { url: string; reference: string; width: number; height: number }[];
    reviews?: { author: string; rating: number; text: string; time: number; relativeTimeDescription: string }[];
    hours?: { weekdayText?: string[] };
    formatted_phone_number?: string;
    url?: string;
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Calculate zoom based on search distance
  const calculateZoom = (distance: number) => {
    // Inverse relationship: smaller distance = higher zoom (more zoomed in)
    // 0.5 km → zoom 16
    // 2 km → zoom 14
    // 5 km → zoom 13
    // 10 km → zoom 12
    return Math.max(12, Math.min(16, 16 - Math.log2(distance / 0.5)));
  };

  const [zoom, setZoom] = useState(calculateZoom(searchDistance[0]));

  // Reverse geocode function to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    console.log('🌍 Starting reverse geocoding for:', lat, lng);
    try {
      // Use OpenStreetMap Nominatim service for reverse geocoding (free and reliable)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'FUZO-FoodApp/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🌍 Reverse geocoding response:', data);
      
      if (data && data.display_name) {
        // Format address nicely
        const address = data.display_name.split(',').slice(0, 3).join(',').trim();
        console.log('🌍 Formatted address:', address);
        return address;
      } else {
        throw new Error('No address found');
      }
    } catch (error) {
      console.error('❌ Reverse geocoding error:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // Distance calculation
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter restaurants based on search distance and query
  const filterRestaurants = (restaurants: Restaurant[], maxDistance: number, query: string = '') => {
    return restaurants
      .map(restaurant => ({
        ...restaurant,
        distance: calculateDistance(userLocation[0], userLocation[1], restaurant.lat, restaurant.lng)
      }))
      .filter(restaurant => {
        const withinDistance = restaurant.distance! <= maxDistance;
        const matchesQuery = query === '' || 
          restaurant.name.toLowerCase().includes(query.toLowerCase()) ||
          restaurant.cuisine.toLowerCase().includes(query.toLowerCase());
        return withinDistance && matchesQuery;
      })
      .sort((a, b) => a.distance! - b.distance!);
  };

  // Fetch restaurants (will be replaced with Google Places API)
  const fetchRestaurants = async (lat: number, lng: number, maxDistance: number) => {
    console.log('🔍 Fetching restaurants for location:', lat, lng, 'within', maxDistance, 'km');
    
    try {
      setError(null);
      
      // Check if backend service is available
      console.log('🔧 Checking backend service availability...');
      const healthResponse = await backendService.healthCheck();
      
      if (healthResponse.success && healthResponse.data?.services?.google_maps_configured) {
        console.log('🌟 Google Maps backend is configured, attempting Places API...');
        
        try {
          // Try Google Places API first
          const placesResponse = await backendService.nearbySearch({
            latitude: lat,
            longitude: lng,
            radius: maxDistance * 1000, // Convert km to meters
            type: 'restaurant'
          });
          
          if (placesResponse.success && placesResponse.data?.results) {
            console.log('✅ Google Places API successful, found', placesResponse.data.results.length, 'restaurants');
            
            // Transform Google Places results to our Restaurant interface
            const googleRestaurants: Restaurant[] = placesResponse.data.results.map((place: GooglePlace) => ({
              id: place.place_id,
              name: place.name,
              cuisine: place.types?.find(type => type.includes('restaurant')) || 'Restaurant',
              rating: place.rating || 4.0,
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
              address: place.vicinity || place.formatted_address || 'Address not available',
              place_id: place.place_id,
              price_level: place.price_level,
              photos: place.photos?.map(photo => photo.photo_reference) || [],
              opening_hours: place.opening_hours ? {
                open_now: place.opening_hours.open_now,
                weekday_text: []
              } : undefined
            }));
            
            const filtered = filterRestaurants(googleRestaurants, maxDistance, searchQuery);
            setFilteredRestaurants(filtered);
            return;
          }
        } catch (apiError) {
          console.warn('⚠️ Google Places API failed, falling back to mock data:', apiError);
        }
      }
      
      // Fallback to mock data
      console.log('📝 Using mock restaurant data');
      const filtered = filterRestaurants(mockRestaurants, maxDistance, searchQuery);
      setFilteredRestaurants(filtered);
      
    } catch (error) {
      console.error('❌ Error fetching restaurants:', error);
      setError('Failed to load nearby restaurants. Using local data.');
      
      // Even on error, try to show mock data
      const filtered = filterRestaurants(mockRestaurants, maxDistance, searchQuery);
      setFilteredRestaurants(filtered);
    }
  };

  // Fetch detailed restaurant information
  const fetchRestaurantDetails = async (restaurant: Restaurant) => {
    if (!restaurant.place_id) {
      console.log('⚠️ No place_id available for restaurant:', restaurant.name);
      return;
    }

    setLoadingDetails(true);
    
    try {
      console.log('🔍 Fetching detailed information for:', restaurant.name, restaurant.place_id);
      
      // Get place details from Google Places API
      const rawData = await getPlaceDetails(restaurant.place_id);
      console.log('📝 Raw place details:', rawData);
      
      if (!rawData) {
        throw new Error('No details returned from Places API');
      }

      // Get place images
      console.log('📸 Fetching place images...');
      const placeImages = await getPlaceImages(restaurant.id, 3, {
        maxWidth: 800,
        maxHeight: 600
      });
      
      const processedDetails = {
        id: restaurant.id,
        name: rawData.name || restaurant.name,
        address: rawData.formatted_address || rawData.address || restaurant.address,
        phone: rawData.formatted_phone_number || rawData.phone,
        website: rawData.website,
        
        photos: placeImages.length > 0 
          ? placeImages.map((image, index) => ({
              url: image.url || generateStaticMapFallback(restaurant.lat, restaurant.lng, 800, 600),
              reference: `google-places-${index}`,
              width: 800,
              height: 600,
              attributions: image.attributions
            }))
          : [{
              url: generateStaticMapFallback(restaurant.lat, restaurant.lng, 800, 600),
              reference: 'static-map-fallback',
              width: 800,
              height: 600
            }],
        
        reviews: [],
        hours: rawData.opening_hours ? {
          weekdayText: rawData.opening_hours.weekday_text || []
        } : undefined,
        formatted_phone_number: rawData.formatted_phone_number,
        url: rawData.url
      };

      // Process reviews if available
      if (rawData.reviews && Array.isArray(rawData.reviews)) {
        processedDetails.reviews = rawData.reviews.slice(0, 5).map((review: RawReviewData) => ({
          author: review.author_name || review.author || 'Anonymous',
          rating: review.rating || 5,
          text: review.text || '',
          time: Date.now(), // Placeholder since we don't have time in raw data
          relativeTimeDescription: review.relative_time_description || review.relativeTimeDescription || 'Recently'
        }));
      }

      console.log('✅ Processed restaurant details:', processedDetails);
      setRestaurantDetails(processedDetails);
      
    } catch (error) {
      console.error('❌ Error fetching restaurant details:', error);
      toast.error('Failed to load restaurant details');
      
      // Set minimal fallback details with static map
      setRestaurantDetails({
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        photos: [{
          url: generateStaticMapFallback(restaurant.lat, restaurant.lng, 800, 600),
          reference: 'static-map-fallback',
          width: 800,
          height: 600
        }],
        reviews: [],
        hours: undefined,
        formatted_phone_number: undefined,
        website: undefined,
        url: undefined
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Effect to fetch restaurants when location or distance changes
  useEffect(() => {
    // Only trigger if userLocation has been set and is not the initial default
    if (userLocation[0] === 37.7849 && userLocation[1] === -122.4094) {
      // Skip if this is the initial San Francisco coordinates
      return;
    }
    
    console.log('🔄 Location or distance changed, fetching restaurants...');
    fetchRestaurants(userLocation[0], userLocation[1], searchDistance[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, searchDistance]);

  // Effect to filter restaurants when search query changes
  useEffect(() => {
    console.log('🔍 Search query changed:', searchQuery);
    const restaurants = filteredRestaurants.length > 0 ? filteredRestaurants : mockRestaurants;
    const filtered = filterRestaurants(restaurants, searchDistance[0], searchQuery);
    setFilteredRestaurants(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Effect to update zoom when distance changes
  useEffect(() => {
    setZoom(calculateZoom(searchDistance[0]));
  }, [searchDistance]);

  // Get user location on component mount
  useEffect(() => {
    console.log('🌍 Component mounted, requesting geolocation...');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log('✅ Geolocation success:', position.coords.latitude, position.coords.longitude);
          const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newLocation);
          
          // Get human-readable address
          const address = await reverseGeocode(position.coords.latitude, position.coords.longitude);
          setUserAddress(address);
          
          // Fetch restaurants for this location
          fetchRestaurants(position.coords.latitude, position.coords.longitude, searchDistance[0]);
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          console.log('🌍 Using default San Francisco location');
          // Fallback to San Francisco
          const defaultLocation: [number, number] = [37.7849, -122.4094];
          setUserLocation(defaultLocation);
          setUserAddress('San Francisco, CA');
          fetchRestaurants(37.7849, -122.4094, searchDistance[0]); // Use initial value directly
        }
      );
    } else {
      console.log('❌ Geolocation not supported, using default location');
      // Fallback to San Francisco
      const defaultLocation: [number, number] = [37.7849, -122.4094];
      setUserLocation(defaultLocation);
      setUserAddress('San Francisco, CA');
      fetchRestaurants(37.7849, -122.4094, 2); // Use initial value directly
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - intentionally minimal dependencies

  // Initial service check on mount (separate from geolocation)
  useEffect(() => {
    const testBackendService = async () => {
      try {
        console.log('🔧 Testing backend service...');
        const healthResponse = await backendService.healthCheck();
        console.log('🏥 Health check response:', healthResponse);
        
        if (healthResponse.success) {
          console.log('✅ Backend service is available');
          console.log('📊 Service status:', healthResponse.data?.services);
          
          if (!healthResponse.data?.services?.google_maps_configured) {
            console.log('⚠️ Google Maps not configured in backend, will use mock data');
            setError('Google Maps API not configured. Using sample data.');
          }
        } else {
          console.log('⚠️ Backend service not available, will use mock data');
          setError('Backend service unavailable. Using sample data.');
        }
      } catch (error) {
        console.error('❌ Backend service test failed:', error);
        setError('Backend service unavailable. Using sample data.');
      }
    };

    testBackendService();
  }, []);

  // Handle showing distance on map
  const handleShowDistance = () => {
    if (!selectedRestaurant) return;
    setShowRoute(!showRoute);
  };

  // Handle opening Google Maps directions
  const handleSetRoute = () => {
    if (!selectedRestaurant) return;
    
    const googleMapsUrl = `https://www.google.com/maps/dir/${userLocation[0]},${userLocation[1]}/${selectedRestaurant.lat},${selectedRestaurant.lng}`;
    window.open(googleMapsUrl, '_blank');
  };

  // Handle saving restaurant to plate
  const handleSaveToPlate = async () => {
    if (!selectedRestaurant || !user) {
      toast.error('Please sign in to save restaurants');
      return;
    }

    try {
      console.log('💾 Saving restaurant to plate:', selectedRestaurant.name);
      
      const saveResult = await savedItemsService.saveItem({
        type: 'place',
        title: selectedRestaurant.name,
        metadata: {
          place_id: selectedRestaurant.place_id,
          name: selectedRestaurant.name,
          address: selectedRestaurant.address,
          rating: selectedRestaurant.rating,
          price_level: selectedRestaurant.price_level,
          cuisine: selectedRestaurant.cuisine,
          lat: selectedRestaurant.lat,
          lng: selectedRestaurant.lng,
          photos: selectedRestaurant.photos,
          phone: selectedRestaurant.phone,
          website: selectedRestaurant.website
        },
        userId: user.id
      });

      if (saveResult.success) {
        toast.success(`${selectedRestaurant.name} saved to your Plate!`);
      } else {
        throw new Error(saveResult.error || 'Failed to save');
      }
    } catch (error) {
      console.error('❌ Error saving to plate:', error);
      toast.error('Failed to save restaurant');
    }
  };

  // Handle sharing restaurant
  const handleShareWithFriend = () => {
    if (!selectedRestaurant) return;
    
    const shareText = `Check out ${selectedRestaurant.name} - ${selectedRestaurant.cuisine} restaurant with ${selectedRestaurant.rating}⭐ rating at ${selectedRestaurant.address}`;
    const shareUrl = `https://www.google.com/maps/place/${encodeURIComponent(selectedRestaurant.address)}`;
    
    if (navigator.share) {
      navigator.share({
        title: selectedRestaurant.name,
        text: shareText,
        url: shareUrl,
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).then(() => {
        toast.success('Restaurant details copied to clipboard!');
      }).catch(() => {
        toast.error('Failed to copy restaurant details');
      });
    }
  };

  return (
    <ErrorBoundary>
      <div className="h-screen w-full relative">      
        {/* Map Container */}
        <div className="absolute inset-0">
          <Map
            height={window.innerHeight}
            width={window.innerWidth}
            center={userLocation}
            zoom={zoom}
            provider={(x, y, z, dpr) => {
              const retina = dpr >= 2 ? '@2x' : '';
              return `https://tile.openstreetmap.org/${z}/${x}/${y}.png${retina}`;
            }}
            attribution={
              <div style={{ 
                fontSize: '12px', 
                color: '#333',
                background: 'rgba(255,255,255,0.8)',
                padding: '2px 4px',
                borderRadius: '4px'
              }}>
                © OpenStreetMap contributors
              </div>
            }
            onClick={() => {
              // Deselect restaurant when clicking on map
              setSelectedRestaurant(null);
              setShowRoute(false);
            }}
          >
            {/* User location marker */}
            <Marker 
              anchor={userLocation} 
              payload={1}
            >
              <div style={{ 
                width: '16px', 
                height: '16px', 
                backgroundColor: '#3b82f6', 
                borderRadius: '50%',
                border: '3px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                transform: 'translate(-50%, -50%)'
              }} />
            </Marker>

            {/* Restaurant markers */}
            {filteredRestaurants.map((restaurant) => (
              <Marker 
                key={restaurant.id}
                anchor={[restaurant.lat, restaurant.lng]}
                payload={restaurant}
              >
                <RestaurantMarker
                  restaurant={restaurant}
                  isSelected={selectedRestaurant?.id === restaurant.id}
                  onClick={() => {
                    console.log('🎯 Restaurant selected:', restaurant.name);
                    setSelectedRestaurant(restaurant);
                    setShowRoute(false);
                  }}
                />
              </Marker>
            ))}

            {/* Route overlay */}
            {showRoute && selectedRestaurant && (
              <Overlay anchor={userLocation} offset={[0, 0]}>
                <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  <line
                    x1={0}
                    y1={0}
                    x2={(selectedRestaurant.lng - userLocation[1]) * 100000}
                    y2={(selectedRestaurant.lat - userLocation[0]) * 100000}
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeDasharray="10,10"
                  />
                </svg>
              </Overlay>
            )}
          </Map>
        </div>

        {/* Floating search control - Mobile-first responsive */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 
                       sm:top-6 sm:left-6 sm:translate-x-0 
                       bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 
                       w-[calc(100vw-2rem)] max-w-sm z-[1000]
                       p-3 sm:p-4">
          
          {/* Location Header */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 font-medium">Current Location</div>
              <div className="text-sm text-gray-800 truncate">{userAddress}</div>
            </div>
            {/* Refresh location button - Mobile optimized */}
            {userAddress === 'Getting location...' && (
              <button
                onClick={() => {
                  console.log('🔄 Manual location refresh requested');
                  setUserAddress('Getting location...');
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      async (position) => {
                        console.log('🔄 Manual geolocation success:', position.coords.latitude, position.coords.longitude);
                        const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
                        setUserLocation(newLocation);
                        const address = await reverseGeocode(position.coords.latitude, position.coords.longitude);
                        setUserAddress(address);
                        fetchRestaurants(position.coords.latitude, position.coords.longitude, searchDistance[0]);
                      },
                      (error) => {
                        console.error('❌ Manual geolocation failed:', error);
                        setUserAddress('Location unavailable');
                      }
                    );
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded shrink-0 touch-manipulation"
                aria-label="Refresh location"
              >
                <Navigation className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>

          {/* Search and Controls */}
          <div className="space-y-3">
            {/* Search Input - Mobile optimized */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-sm h-10"
              />
            </div>

            {/* Distance Slider - Mobile-first with touch targets */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-600">Distance</span>
                <span className="text-xs font-semibold text-blue-600">{searchDistance[0]} km</span>
              </div>
              <Slider
                value={searchDistance}
                onValueChange={setSearchDistance}
                min={0.5}
                max={10}
                step={0.5}
                className="scout-slider w-full"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Floating restaurant info card - Mobile-first responsive */}
        {selectedRestaurant && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 
                         sm:bottom-6 sm:left-6 sm:translate-x-0 
                         bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 
                         w-[calc(100vw-2rem)] max-w-sm z-[1000]
                         p-4">
            
            {/* Restaurant Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold truncate">{selectedRestaurant.name}</h3>
                <p className="text-sm text-gray-600 truncate">
                  {Array.isArray(selectedRestaurant.cuisine) 
                    ? selectedRestaurant.cuisine.join(', ') 
                    : (selectedRestaurant.cuisine || 'Restaurant')
                  }
                </p>
                <p className="text-xs text-gray-500 truncate">{selectedRestaurant.address}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedRestaurant(null);
                  setShowRoute(false);
                }}
                className="p-2 hover:bg-gray-100 rounded ml-2 shrink-0 touch-manipulation"
                aria-label="Close restaurant details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Restaurant Info */}
            <div className="flex items-center gap-4 mb-3 text-sm text-gray-700">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-600" />
                <span>{selectedRestaurant.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>{selectedRestaurant.distance?.toFixed(1)} km</span>
              </div>
            </div>

            {/* Action Buttons - Mobile-first grid */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={handleShowDistance}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Navigation className="w-3 h-3 mr-1" />
                {showRoute ? 'Hide' : 'Route'}
              </Button>
              <Button
                onClick={handleSetRoute}
                size="sm"
                className="text-xs"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Go
              </Button>
              <Button
                onClick={() => {
                  setShowDetailsModal(true);
                  if (selectedRestaurant) {
                    fetchRestaurantDetails(selectedRestaurant);
                  }
                }}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Info className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Restaurant Details Modal - Mobile-first responsive */}
        <Dialog open={showDetailsModal} onOpenChange={(open) => {
          setShowDetailsModal(open);
          if (!open) {
            setRestaurantDetails(null);
          }
        }}>
          <DialogContent 
            className="w-[calc(100vw-1rem)] max-w-sm mx-auto p-0 rounded-2xl"
            style={{ 
              maxHeight: '85vh',
              zIndex: 9999
            }}
          >
            <ScrollArea className="max-h-[85vh] rounded-2xl">
              <div className="p-4 bg-white rounded-2xl">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-lg leading-tight">{selectedRestaurant?.name}</DialogTitle>
                  <DialogDescription className="text-sm">
                    {selectedRestaurant?.cuisine} • {selectedRestaurant?.address}
                  </DialogDescription>
                </DialogHeader>

                {selectedRestaurant && (
                  <div className="space-y-4">
                    {loadingDetails ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Loading details...</span>
                      </div>
                    ) : (
                      <>
                        {/* Restaurant Images - Mobile optimized */}
                        {restaurantDetails?.photos && restaurantDetails.photos.length > 0 ? (
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium">Photos</h3>
                            <div className="w-full h-32 overflow-hidden rounded-lg">
                              <img
                                src={restaurantDetails.photos[0].url}
                                alt={selectedRestaurant.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {restaurantDetails.photos.length > 1 && (
                              <div className="grid grid-cols-3 gap-1">
                                {restaurantDetails.photos.slice(1, 4).map((photo: { url: string }, index: number) => (
                                  <div key={index} className="aspect-square overflow-hidden rounded">
                                    <img 
                                      src={photo.url}
                                      alt={`${selectedRestaurant.name} photo ${index + 2}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                            {restaurantDetails.photos.length > 4 && (
                              <p className="text-xs text-gray-500 text-center">
                                +{restaurantDetails.photos.length - 4} more photos
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-32 overflow-hidden rounded-lg">
                            <ImageWithFallback
                              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
                              alt={selectedRestaurant.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Quick Info - Mobile grid */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-600" />
                            <span>{selectedRestaurant.rating} / 5.0</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span>{'$'.repeat(selectedRestaurant.price_level || 2)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span>{selectedRestaurant.distance?.toFixed(1)} km away</span>
                          </div>
                          {restaurantDetails?.formatted_phone_number && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-600" />
                              <span className="text-xs">{restaurantDetails.formatted_phone_number}</span>
                            </div>
                          )}
                        </div>

                        {/* Operating Hours */}
                        {restaurantDetails?.hours?.weekdayText && restaurantDetails.hours.weekdayText.length > 0 && (
                          <>
                            <div className="space-y-2">
                              <h3 className="text-sm font-medium flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Operating Hours
                              </h3>
                              <div className="text-xs text-gray-600 space-y-1">
                                {restaurantDetails.hours.weekdayText.map((day: string, index: number) => (
                                  <div key={index}>{day}</div>
                                ))}
                              </div>
                            </div>
                            <Separator />
                          </>
                        )}

                        {/* Reviews - Mobile optimized */}
                        {restaurantDetails?.reviews && restaurantDetails.reviews.length > 0 && (
                          <>
                            <div className="space-y-3">
                              <h3 className="text-sm font-medium">Customer Reviews</h3>
                              {restaurantDetails.reviews.slice(0, 2).map((review: { author: string; rating: number; text: string; relativeTimeDescription: string }, index: number) => (
                                <div key={index} className="border rounded-lg p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{review.author}</span>
                                    <span className="text-xs text-gray-500">{review.relativeTimeDescription}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-yellow-600">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star 
                                        key={i} 
                                        className="w-3 h-3"
                                        fill={i < review.rating ? "currentColor" : "none"}
                                      />
                                    ))}
                                  </div>
                                  <p className="text-xs text-gray-700 line-clamp-3">{review.text}</p>
                                </div>
                              ))}
                            </div>
                            <Separator />
                          </>
                        )}

                        {/* Action Buttons - Mobile-first stack */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Button 
                              onClick={() => {
                                handleSetRoute();
                                setShowDetailsModal(false);
                              }}
                              className="w-full"
                            >
                              <Navigation className="w-4 h-4 mr-2" />
                              Directions
                            </Button>
                            {restaurantDetails?.website && (
                              <Button 
                                variant="outline"
                                onClick={() => window.open(restaurantDetails.website, '_blank')}
                                className="w-full"
                              >
                                <Globe className="w-4 h-4 mr-2" />
                                Website
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              onClick={() => {
                                handleSaveToPlate();
                                setShowDetailsModal(false);
                              }}
                              variant="default"
                              className="w-full"
                            >
                              <Bookmark className="w-4 h-4 mr-2" />
                              Save to Plate
                            </Button>
                            <Button
                              onClick={handleShareWithFriend}
                              variant="default"
                              className="w-full"
                            >
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Toaster />
      </div>
    </ErrorBoundary>
  );
}