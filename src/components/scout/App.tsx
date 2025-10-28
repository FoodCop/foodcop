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
  { id: "1", name: "The Golden Fork", cuisine: "Italian", rating: 4.5, lat: 37.7849, lng: -122.4094, address: "123 Market St" },
  { id: "2", name: "Sushi Paradise", cuisine: "Japanese", rating: 4.8, lat: 37.7899, lng: -122.4012, address: "456 Mission St" },
  { id: "3", name: "Taco Fiesta", cuisine: "Mexican", rating: 4.3, lat: 37.7779, lng: -122.4177, address: "789 Valencia St" },
  { id: "4", name: "Le Petit Bistro", cuisine: "French", rating: 4.7, lat: 37.7829, lng: -122.4190, address: "321 Hayes St" },
  { id: "5", name: "Spice Route", cuisine: "Indian", rating: 4.4, lat: 37.7889, lng: -122.4074, address: "654 Folsom St" },
  { id: "6", name: "Dragon Wok", cuisine: "Chinese", rating: 4.6, lat: 37.7809, lng: -122.4134, address: "987 Geary St" },
  { id: "7", name: "Mediterranean Delight", cuisine: "Mediterranean", rating: 4.5, lat: 37.7859, lng: -122.4020, address: "147 Howard St" },
  { id: "8", name: "BBQ Haven", cuisine: "American", rating: 4.2, lat: 37.7799, lng: -122.4050, address: "258 3rd St" },
];

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
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

// Custom marker component
const CustomMarker = ({ 
  isUser, 
  isSelected,
  onClick
}: { 
  isUser?: boolean; 
  isSelected?: boolean;
  onClick?: () => void;
}) => {
  if (isUser) {
    return (
      <div style={{ 
        width: '36px', 
        height: '36px', 
        transform: 'translate(-50%, -50%)',
        position: 'relative'
      }}>
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="#3b82f6" stroke="white" strokeWidth="4"/>
          <circle cx="18" cy="18" r="7" fill="white"/>
        </svg>
      </div>
    );
  }

  const size = isSelected ? 36 : 30;
  const height = isSelected ? 48 : 40;
  const color = isSelected ? '#ef4444' : '#f59e0b';

  return (
    <div 
      onClick={() => {
        console.log('Marker clicked!', onClick);
        onClick?.();
      }}
      style={{ 
        width: `${size}px`, 
        height: `${height}px`, 
        transform: `translate(-50%, -100%)`,
        position: 'relative',
        cursor: 'pointer',
        zIndex: isSelected ? 1000 : 100,
        pointerEvents: 'auto'
      }}
    >
      <svg width={size} height={height} viewBox={`0 0 ${size} ${height}`}>
        <defs>
          <filter id={`shadow-${isSelected ? 'selected' : 'normal'}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3"/>
          </filter>
        </defs>
        <g filter={`url(#shadow-${isSelected ? 'selected' : 'normal'})`}>
          <path 
            d={isSelected 
              ? "M18 0C18 0 3 10 3 18c0 8 6 12 15 12s15-4 15-12C33 10 18 0 18 0z"
              : "M15 0C15 0 3 8 3 15c0 7 5 10 12 10s12-3 12-10C27 8 15 0 15 0z"
            }
            fill={color}
          />
          <circle 
            cx={isSelected ? 18 : 15} 
            cy={isSelected ? 16 : 13} 
            r={isSelected ? 6 : 5} 
            fill="white"
          />
        </g>
      </svg>
    </div>
  );
};

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
      
      console.log('🌍 Nominatim response status:', response.status);
      const data = await response.json();
      console.log('🌍 Nominatim response data:', data);
      
      if (data && data.display_name) {
        // Extract meaningful parts of the address
        const addressParts = data.display_name.split(',');
        // Take first 2-3 parts for a concise address
        const shortAddress = addressParts.slice(0, 3).join(',').trim();
        console.log('✅ Address found:', shortAddress);
        setUserAddress(shortAddress);
      } else {
        console.log('❌ No address found in response');
        setUserAddress('Address not found');
      }
    } catch (error) {
      console.error('❌ Reverse geocoding failed:', error);
      setUserAddress('Location detected');
    }
  };

  // Get user's location on mount
  useEffect(() => {
    console.log('🔍 Scout App mounted, initializing geolocation...');
    setUserAddress('Getting location...'); // Reset address state
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log('✅ Geolocation success:', position.coords.latitude, position.coords.longitude);
          const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newLocation);
          
          // Call reverse geocoding and wait for it
          await reverseGeocode(position.coords.latitude, position.coords.longitude);
          
          // Immediately fetch restaurants for the real location
          fetchRestaurants(position.coords.latitude, position.coords.longitude, searchDistance[0]);
        },
        (error) => {
          console.log("❌ Geolocation failed, using default San Francisco location:", error.message);
          // Only fetch with default location if geolocation fails
          const defaultLocation: [number, number] = [37.7849, -122.4094];
          setUserLocation(defaultLocation);
          setUserAddress('San Francisco, CA');
          fetchRestaurants(37.7849, -122.4094, searchDistance[0]);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      console.log("❌ Geolocation not supported, using default location");
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
            console.warn('⚠️ Google Maps API not configured in backend');
            toast.warning('Google Maps API not configured - using sample data');
          }
        } else {
          console.warn('⚠️ Backend service not available:', healthResponse.error);
          toast.warning('Backend service unavailable - using sample data');
        }
      } catch (error) {
        console.error('❌ Backend service test failed:', error);
        toast.warning('Backend service test failed - using sample data');
      }
    };
    
    testBackendService();
  }, []);

  // Fetch restaurants from Google Places API via backend service
  const fetchRestaurants = async (lat: number, lng: number, radiusKm: number, query?: string) => {
    setError(null);
    
    try {
      console.log(`🔍 Searching for restaurants${query ? ` matching "${query}"` : ''} within ${radiusKm}km of ${lat}, ${lng}`);
      
      let restaurants: Restaurant[] = [];
      let usingMockData = false;
      
      // First, try to use the backend service
      try {
        if (query && query.trim()) {
          // Use text search for specific queries
          console.log('🔍 Using backend text search for query:', query);
          const response = await backendService.searchPlacesByText(
            `${query} restaurant`, 
            { lat, lng }
          );
          
          if (response.success && response.data?.results) {
            restaurants = response.data.results.map((place: GooglePlace) => 
              formatGooglePlaceResult(place, { lat, lng })
            ).filter((restaurant: Restaurant) => 
              restaurant.distance !== undefined && restaurant.distance <= radiusKm
            );
            console.log(`✅ Backend text search found ${restaurants.length} restaurants`);
          } else {
            throw new Error(response.error || 'Backend text search failed');
          }
        } else {
          // Use nearby search for general location-based search
          console.log('🔍 Using backend nearby search');
          const radiusMeters = radiusKm * 1000; // Convert to meters for API
          const response = await backendService.searchNearbyPlaces(
            { lat, lng }, 
            radiusMeters, 
            'restaurant'
          );
          
          if (response.success && response.data?.results) {
            restaurants = response.data.results.map((place: GooglePlace) => 
              formatGooglePlaceResult(place, { lat, lng })
            );
            console.log(`✅ Backend nearby search found ${restaurants.length} restaurants`);
          } else {
            throw new Error(response.error || 'Backend nearby search failed');
          }
        }
      } catch (backendError) {
        console.warn('⚠️ Backend service failed, falling back to mock data:', backendError);
        usingMockData = true;
        
        // Fallback to enhanced mock data
        restaurants = mockRestaurants.filter((restaurant) => {
          const distance = calculateDistance(lat, lng, restaurant.lat, restaurant.lng);
          const withinRadius = distance <= radiusKm;
          
          if (!withinRadius) return false;
          
          if (query && query.trim()) {
            const searchTerm = query.toLowerCase();
            const cuisineText = Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(' ').toLowerCase() : (restaurant.cuisine || '').toLowerCase();
            return restaurant.name.toLowerCase().includes(searchTerm) || 
                   cuisineText.includes(searchTerm);
          }
          
          return true;
        }).map(restaurant => ({
          ...restaurant,
          distance: calculateDistance(lat, lng, restaurant.lat, restaurant.lng)
        }));
      }

      // Sort by distance
      restaurants.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setFilteredRestaurants(restaurants);

      console.log(`📍 Set ${restaurants.length} restaurants in state:`, restaurants.map(r => ({ 
        name: r.name, 
        lat: r.lat, 
        lng: r.lng, 
        distance: r.distance,
        hasValidCoords: !!(r.lat && r.lng && r.lat !== 0 && r.lng !== 0)
      })));
      
      // User feedback
      if (restaurants.length === 0) {
        if (query) {
          toast.info(`No restaurants found for "${query}" within ${radiusKm} km`);
        } else {
          toast.info(`No restaurants found within ${radiusKm} km. Try increasing the search radius.`);
        }
      } else {
        // Success - restaurants found and markers will be visible on map
        console.log(`✅ Found ${restaurants.length} restaurants ${query ? `matching "${query}"` : 'nearby'}${usingMockData ? ' (sample data)' : ''}`);
      }
        
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError('Failed to fetch restaurants. Using sample data.');
      
      // Final fallback to mock data on any error
      const mockResults = mockRestaurants.filter((restaurant) => {
        const distance = calculateDistance(lat, lng, restaurant.lat, restaurant.lng);
        return distance <= radiusKm;
      }).map(restaurant => ({
        ...restaurant,
        distance: calculateDistance(lat, lng, restaurant.lat, restaurant.lng)
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      setFilteredRestaurants(mockResults);
      toast.error('Network error - using sample data');
    }
  };

  // Filter restaurants based on distance and search query - Only trigger on user actions
  
  // Fetch detailed restaurant information from Google Places API
  const fetchRestaurantDetails = async (restaurant: Restaurant) => {
    if (!restaurant.id) {
      console.warn('No place ID available for restaurant:', restaurant.name);
      return;
    }

    setLoadingDetails(true);
    try {
      console.log('🔍 Fetching comprehensive details for restaurant:', restaurant.name, 'ID:', restaurant.id);
      
      // Use comprehensive Google Places API v1 service for all details
      const detailedData = await getPlaceDetails(restaurant.id, {
        includePhotos: true,
        includeReviews: true,
        maxPhotos: 5,
        maxReviews: 10
      });
      
      if (detailedData) {
        console.log('✅ Comprehensive restaurant details from Google Places API:', detailedData);
        
        // Format the data for the UI
        const processedDetails = {
          id: restaurant.id,
          name: detailedData.name,
          address: detailedData.address,
          phone: detailedData.phone,
          website: detailedData.website,
          
          // Use real Google Places API photos with fallbacks
          photos: detailedData.photos.length > 0 
            ? detailedData.photos
            : [{
                url: generateStaticMapFallback(restaurant.lat, restaurant.lng, 800, 600),
                reference: 'static-map-fallback',
                width: 800,
                height: 600
              }],
          
          // Use real reviews from Google Places API
          reviews: detailedData.reviews.map(review => ({
            author: review.author,
            rating: review.rating,
            text: review.text,
            time: 0, // Not available in new format
            relativeTimeDescription: review.relativeTimeDescription
          })),
          
          // Use real opening hours from Google Places API
          hours: detailedData.hours ? {
            weekdayText: detailedData.hours.weekdayText
          } : undefined,
          
          // Additional Google Places data
          formatted_phone_number: detailedData.phone,
          url: detailedData.googleMapsUrl
        };
        
        console.log('📊 Final processed restaurant details with Google Places API data:', processedDetails);
        setRestaurantDetails(processedDetails);
      } else {
        console.warn('❌ Google Places API returned no data, trying backend fallback');
        
        // Fallback to backend service
        const response = await backendService.getPlaceDetails(restaurant.id);
        
        if (response.success && response.data) {
          const rawData = response.data;
          
          // Process backend data with photo enhancement
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
            
            reviews: rawData.reviews?.length > 0 
              ? rawData.reviews.map((review: RawReviewData) => ({
                  author: review.author_name || review.author || 'Anonymous',
                  rating: review.rating || 0,
                  text: review.text || '',
                  time: 0,
                  relativeTimeDescription: review.relative_time_description || review.relativeTimeDescription || 'Recently'
                }))
              : [],
            
            hours: rawData.opening_hours ? {
              weekdayText: rawData.opening_hours.weekday_text || rawData.opening_hours.weekdayText || []
            } : (rawData.hours ? {
              weekdayText: rawData.hours.weekday_text || rawData.hours.weekdayText || []
            } : undefined),
            
            formatted_phone_number: rawData.formatted_phone_number || rawData.phone,
            url: undefined
          };
          
          console.log('📊 Backend fallback details processed:', processedDetails);
          setRestaurantDetails(processedDetails);
        } else {
          throw new Error('Both Google Places API and backend failed');
        }
      }
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
  useEffect(() => {
    // Only trigger if userLocation has been set and is not the initial default
    if (userLocation[0] === 37.7849 && userLocation[1] === -122.4094) {
      // Skip if this is the initial San Francisco coordinates
      return;
    }
    
    console.log('🎯 useEffect triggered by user action:', { 
      userLocation, 
      searchDistance: searchDistance[0], 
      searchQuery,
      hasUserLocation: userLocation[0] !== 0 && userLocation[1] !== 0
    });
    
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchRestaurants(userLocation[0], userLocation[1], searchDistance[0], searchQuery);
      setZoom(calculateZoom(searchDistance[0]));
    }, searchQuery ? 500 : 0); // 500ms debounce for search queries, immediate for distance changes

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, [searchDistance, searchQuery]); // Intentionally limited dependencies to prevent infinite loops

  const handleShowDistance = () => {
    if (selectedRestaurant) {
      setShowRoute(!showRoute);
    }
  };

  const handleSetRoute = () => {
    if (selectedRestaurant) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${selectedRestaurant.lat},${selectedRestaurant.lng}`;
      window.open(url, '_blank');
    }
  };

  const handleSaveToPlate = async () => {
    console.log('🍽️ Save to Plate triggered');
    console.log('👤 Current user from useAuth:', user);
    
    if (!user) {
      toast.error('Please sign in to save restaurants');
      console.log('❌ No user found in useAuth hook');
      return;
    }

    if (!selectedRestaurant) {
      toast.error('No restaurant selected');
      console.log('❌ No restaurant selected');
      return;
    }

    try {
      // Prepare restaurant metadata for saving
      const restaurantData = {
        place_id: selectedRestaurant.place_id || selectedRestaurant.id,
        name: selectedRestaurant.name,
        vicinity: selectedRestaurant.address,
        lat: selectedRestaurant.lat,
        lng: selectedRestaurant.lng,
        rating: selectedRestaurant.rating,
        price_level: selectedRestaurant.price_level,
        types: Array.isArray(selectedRestaurant.cuisine) ? selectedRestaurant.cuisine : [selectedRestaurant.cuisine],
        photos: selectedRestaurant.photos,
        phone: selectedRestaurant.phone,
        website: selectedRestaurant.website,
        opening_hours: selectedRestaurant.opening_hours
      };

      console.log('💾 Saving restaurant to plate:', restaurantData);

      const result = await savedItemsService.saveRestaurant(restaurantData);

      console.log('📤 Save result:', result);

      if (result.success) {
        toast.success(`${selectedRestaurant.name} saved to your plate!`);
        console.log('✅ Restaurant saved successfully');
      } else {
        if (result.error === 'Item already saved') {
          toast.info(`${selectedRestaurant.name} is already in your plate`);
          console.log('ℹ️ Restaurant already saved');
        } else {
          toast.error(result.error || 'Failed to save restaurant');
          console.log('❌ Failed to save:', result.error);
        }
      }
    } catch (error) {
      console.error('💥 Error saving restaurant:', error);
      toast.error('An error occurred while saving the restaurant');
    }
  };

  const handleShareWithFriend = () => {
    if (selectedRestaurant) {
      const cuisineText = Array.isArray(selectedRestaurant.cuisine) ? selectedRestaurant.cuisine[0] : (selectedRestaurant.cuisine || 'restaurant');
      const shareText = `Check out ${selectedRestaurant.name} - ${cuisineText} cuisine, rated ${selectedRestaurant.rating}⭐`;
      
      if (navigator.share) {
        navigator.share({
          title: selectedRestaurant.name,
          text: shareText,
          url: window.location.href
        }).catch(() => {
          navigator.clipboard.writeText(shareText);
          toast.success('Restaurant details copied to clipboard!');
        });
      } else {
        navigator.clipboard.writeText(shareText);
        toast.success('Restaurant details copied to clipboard!');
      }
    }
  };

  console.log('🎨 Rendering with filteredRestaurants:', filteredRestaurants.length, filteredRestaurants);

  return (
    <ErrorBoundary>
      <div className="h-screen w-full relative">      
        {/* Full screen map */}
      <div className="absolute inset-0">
        <Map
          center={userLocation}
          zoom={zoom}
        >
          {/* User location marker */}
          <Marker 
            anchor={userLocation}
          >
            <CustomMarker isUser />
          </Marker>
          
          {/* Restaurant markers */}
          {filteredRestaurants
            .filter(restaurant => restaurant.lat && restaurant.lng && restaurant.lat !== 0 && restaurant.lng !== 0)
            .map((restaurant) => {
              const handleMarkerClick = () => {
                try {
                  console.log('🎯 Marker clicked for restaurant:', restaurant.name, restaurant);
                  
                  // Validate restaurant data before setting
                  if (!restaurant || !restaurant.id) {
                    console.error('❌ Invalid restaurant data:', restaurant);
                    toast.error('Invalid restaurant data');
                    return;
                  }
                  
                  // Ensure required properties exist
                  const validatedRestaurant = {
                    ...restaurant,
                    name: restaurant.name || 'Unknown Restaurant',
                    cuisine: restaurant.cuisine || 'Restaurant',
                    rating: restaurant.rating || 0,
                    lat: restaurant.lat || 0,
                    lng: restaurant.lng || 0,
                    address: restaurant.address || 'Address not available'
                  };
                  
                  setSelectedRestaurant(validatedRestaurant);
                  setShowRoute(false);
                } catch (error) {
                  console.error('❌ Error handling marker click:', error);
                  toast.error('Error selecting restaurant');
                }
              };

              return (
                <Marker
                  key={restaurant.id}
                  anchor={[restaurant.lat, restaurant.lng]}
                  onClick={handleMarkerClick}
                >
                  <CustomMarker 
                    isSelected={selectedRestaurant?.id === restaurant.id}
                    onClick={handleMarkerClick}
                  />
                </Marker>
              );
            })}
          
          {/* Route line */}
          {showRoute && selectedRestaurant && (
            <Overlay anchor={userLocation} offset={[0, 0]}>
              <svg 
                width="100%" 
                height="100%" 
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0,
                  pointerEvents: 'none'
                }}
              >
                <line
                  x1="0"
                  y1="0"
                  x2={(selectedRestaurant.lng - userLocation[1]) * 10000}
                  y2={(selectedRestaurant.lat - userLocation[0]) * 10000}
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeDasharray="10,10"
                />
              </svg>
            </Overlay>
          )}
        </Map>
      </div>

      {/* Floating search control */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 lg:top-6 lg:left-6 lg:translate-x-0 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-xl border border-gray-200 w-80 max-w-[calc(100vw-2rem)] lg:max-w-sm z-1000">
          
          {/* Location Header */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 font-medium">Current Location</div>
              <div className="text-sm text-gray-800 truncate">{userAddress}</div>
            </div>
            {/* Refresh location button */}
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
                        await reverseGeocode(position.coords.latitude, position.coords.longitude);
                      },
                      (error) => {
                        console.log('🔄 Manual geolocation failed:', error.message);
                        setUserAddress('Location unavailable');
                      }
                    );
                  }
                }}
                className="p-1 hover:bg-gray-100 rounded shrink-0"
                title="Refresh location"
              >
                <Navigation className="w-3 h-3 text-gray-600" />
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search cuisine or restaurant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-sm"
              />
            </div>
            
            {/* Compact Search Distance */}
            <div className="bg-gray-50 p-2 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-600">Distance</span>
                <span className="text-xs font-semibold text-blue-600">{searchDistance[0]} km</span>
              </div>
              <Slider
                value={searchDistance}
                onValueChange={setSearchDistance}
                min={0.5}
                max={10}
                step={0.5}
                className="w-full *:data-[slot=slider-range]:bg-orange-600! *:data-[slot=slider-thumb]:bg-orange-600! *:data-[slot=slider-thumb]:border-orange-600!"
              />
            </div>

            {error && (
              <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                {error}
              </div>
            )}
          </div>
        </div>

      {/* Floating restaurant info card */}
      {selectedRestaurant && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 lg:bottom-20 lg:left-6 lg:translate-x-0 bg-white/35 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-200 w-80 max-w-[calc(100vw-2rem)] z-1000">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="truncate">{selectedRestaurant.name}</h3>
              <p className="text-gray-600 truncate">{Array.isArray(selectedRestaurant.cuisine) ? selectedRestaurant.cuisine.join(', ') : (selectedRestaurant.cuisine || 'Restaurant')}</p>
              <p className="text-gray-500 truncate">{selectedRestaurant.address}</p>
            </div>
            <button
              onClick={() => {
                setSelectedRestaurant(null);
                setShowRoute(false);
              }}
              className="p-1 hover:bg-gray-100 rounded ml-2 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-3 mb-3 text-gray-700">
            <div className="flex items-center gap-1">
              <span className="text-yellow-600">★</span>
              <span>{selectedRestaurant.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{selectedRestaurant.distance?.toFixed(1)} km</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                onClick={handleShowDistance}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                <Navigation className="w-4 h-4 mr-2" />
                {showRoute ? 'Hide Route' : 'Show Route'}
              </Button>
              <Button
                onClick={handleSetRoute}
                className="flex-1"
                size="sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Directions
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
                className="shrink-0"
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Restaurant Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={(open) => {
        setShowDetailsModal(open);
        if (!open) {
          setRestaurantDetails(null);
        }
      }}>
        <DialogContent 
          className="w-[calc(100vw-32px)]! sm:w-[calc(100vw-32px)]! md:w-[calc(100vw-32px)]! lg:w-[calc(100vw-32px)]! max-w-sm! left-1/2! translate-x-[-50%]! p-0 rounded-2xl"
          style={{ 
            zIndex: 9999,
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%) translateY(-50%)'
          }}
        >
          <ScrollArea className="max-h-[80vh] rounded-2xl">
            <div className="p-4 bg-white rounded-2xl overflow-hidden">
              <DialogHeader>
                <DialogTitle className="pr-6 text-base leading-tight wrap-break-word">{selectedRestaurant?.name}</DialogTitle>
                <DialogDescription className="text-sm wrap-break-word">
                  {selectedRestaurant?.cuisine} • {selectedRestaurant?.address}
                </DialogDescription>
              </DialogHeader>

              {selectedRestaurant && (
                <div className="mt-4 space-y-4">
                  {loadingDetails ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading restaurant details...</span>
                    </div>
                  ) : (
                    <>
                      {/* Restaurant Images */}
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

                      {/* Quick Info */}
                      <div className="flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-600" />
                          <span>{selectedRestaurant.rating} / 5.0</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <span>{'$'.repeat(selectedRestaurant.price_level || 2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          <span>{selectedRestaurant.distance?.toFixed(1)} km away</span>
                        </div>
                      </div>

                      <Separator />

                      {/* Contact Information */}
                      <div className="space-y-3">
                        <h3>Contact Information</h3>
                        
                        {restaurantDetails?.formatted_phone_number && (
                          <div className="flex items-center gap-3 text-gray-700">
                            <Phone className="w-5 h-5 text-gray-500" />
                            <a href={`tel:${restaurantDetails.formatted_phone_number}`} className="hover:underline">
                              {restaurantDetails.formatted_phone_number}
                            </a>
                          </div>
                        )}
                        
                        {restaurantDetails?.website && (
                          <div className="flex items-center gap-3 text-gray-700">
                            <Globe className="w-5 h-5 text-gray-500" />
                            <a 
                              href={restaurantDetails.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              Visit Website
                            </a>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 text-gray-700">
                          <MapPin className="w-5 h-5 text-gray-500" />
                          <span>{selectedRestaurant.address}</span>
                        </div>
                      </div>

                      <Separator />

                      {/* Hours */}
                      {restaurantDetails?.hours?.weekdayText && restaurantDetails.hours.weekdayText.length > 0 && (
                        <>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Clock className="w-5 h-5 text-gray-500" />
                              <h3>Hours</h3>
                            </div>
                            
                            <div className="space-y-2 text-gray-700">
                              {restaurantDetails.hours.weekdayText.map((hours: string, index: number) => (
                                <div key={index} className="flex justify-between py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                  <span className="capitalize">{hours}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Separator />
                        </>
                      )}                      {/* Reviews */}
                      {restaurantDetails?.reviews && restaurantDetails.reviews.length > 0 && (
                        <>
                          <div className="space-y-4">
                            <h3>Customer Reviews</h3>
                            
                            {restaurantDetails.reviews.slice(0, 3).map((review: { author: string; rating: number; text: string; relativeTimeDescription: string }, index: number) => (
                              <div key={index} className="border rounded-lg p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{review.author}</span>
                                  <span className="text-gray-500">{review.relativeTimeDescription}</span>
                                </div>
                                <div className="flex items-center gap-1 text-yellow-600">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className="w-4 h-4"
                                      fill={i < review.rating ? "currentColor" : "none"}
                                    />
                                  ))}
                                  <span className="ml-2 text-gray-700">{review.rating}</span>
                                </div>
                                <p className="text-gray-700">{review.text}</p>
                              </div>
                            ))}
                            
                            {restaurantDetails.reviews.length > 3 && (
                              <p className="text-xs text-gray-500 text-center">
                                +{restaurantDetails.reviews.length - 3} more reviews
                              </p>
                            )}
                          </div>

                          <Separator />
                        </>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-3 pt-4">
                        <div className="flex gap-3">
                          <Button 
                            onClick={() => {
                              handleSetRoute();
                              setShowDetailsModal(false);
                            }}
                            className="flex-1"
                          >
                            <Navigation className="w-4 h-4 mr-2" />
                            Get Directions
                          </Button>
                          {restaurantDetails?.website && (
                            <Button 
                              variant="outline"
                              onClick={() => window.open(restaurantDetails.website, '_blank')}
                              className="flex-1"
                            >
                              <Globe className="w-4 h-4 mr-2" />
                              Visit Website
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex gap-3">
                          <Button
                            onClick={() => {
                              handleSaveToPlate();
                              setShowDetailsModal(false);
                            }}
                            variant="default"
                            className="flex-1"
                          >
                            <Bookmark className="w-4 h-4 mr-2" />
                            SAVE TO PLATE
                          </Button>
                          <Button
                            onClick={() => {
                              handleShareWithFriend();
                            }}
                            variant="default"
                            className="flex-1"
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            SHARE WITH FRIEND
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
