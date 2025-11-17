import { useState, useEffect } from 'react';
import { Search, MapPin, Navigation, Star, Clock, SlidersHorizontal, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { backendService, formatGooglePlaceResult } from '../../services/backendService';
import type { GooglePlace } from '../../types';
import { RestaurantDetailDialog } from './components/RestaurantDetailDialog';

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

// Mock restaurant data for fallback
const mockRestaurants: Restaurant[] = [
  { id: "1", name: "The Golden Fork", cuisine: "Italian", rating: 4.5, lat: 37.7849, lng: -122.4094, address: "123 Market St" },
  { id: "2", name: "Sushi Paradise", cuisine: "Japanese", rating: 4.8, lat: 37.7899, lng: -122.4012, address: "456 Mission St" },
  { id: "3", name: "Taco Fiesta", cuisine: "Mexican", rating: 4.3, lat: 37.7779, lng: -122.4177, address: "789 Valencia St" },
  { id: "4", name: "Le Petit Bistro", cuisine: "French", rating: 4.7, lat: 37.7829, lng: -122.419, address: "321 Hayes St" },
  { id: "5", name: "Spice Route", cuisine: "Indian", rating: 4.4, lat: 37.7889, lng: -122.4074, address: "654 Folsom St" },
  { id: "6", name: "Dragon Wok", cuisine: "Chinese", rating: 4.6, lat: 37.7809, lng: -122.4134, address: "987 Geary St" },
  { id: "7", name: "Mediterranean Delight", cuisine: "Mediterranean", rating: 4.5, lat: 37.7859, lng: -122.402, address: "147 Howard St" },
  { id: "8", name: "BBQ Haven", cuisine: "American", rating: 4.2, lat: 37.7799, lng: -122.405, address: "258 3rd St" },
];

// Calculate distance between two points
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Cuisine categories
const CUISINE_CATEGORIES = [
  { id: 'all', label: 'All 🍽️', query: '' },
  { id: 'italian', label: 'Italian 🍝', query: 'italian' },
  { id: 'japanese', label: 'Japanese 🍣', query: 'japanese sushi' },
  { id: 'mexican', label: 'Mexican 🌮', query: 'mexican' },
  { id: 'chinese', label: 'Chinese 🥡', query: 'chinese' },
  { id: 'indian', label: 'Indian 🍛', query: 'indian' },
  { id: 'american', label: 'American 🍔', query: 'american burger' },
];

export default function ScoutNew() {
  const [userLocation, setUserLocation] = useState<[number, number]>([37.7849, -122.4094]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(2);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch full restaurant details when clicked
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
        
        // Merge basic info with detailed info
        const enrichedRestaurant: Restaurant = {
          ...restaurant,
          photos: details.photos ? details.photos.slice(0, 5).map((photo: { photo_reference: string }) => photo.photo_reference) : restaurant.photos,
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newLocation);
          await reverseGeocode(position.coords.latitude, position.coords.longitude);
          fetchRestaurants(position.coords.latitude, position.coords.longitude, radiusKm);
        },
        () => {
          const defaultLocation: [number, number] = [37.7849, -122.4094];
          setUserLocation(defaultLocation);
          fetchRestaurants(37.7849, -122.4094, radiusKm);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, [radiusKm]);

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
      
      try {
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
          }
        }
      } catch (backendError) {
        console.warn('Backend service failed, using mock data:', backendError);
        results = mockRestaurants.filter((restaurant) => {
          const distance = calculateDistance(lat, lng, restaurant.lat, restaurant.lng);
          return distance <= radius;
        }).map(restaurant => ({
          ...restaurant,
          distance: calculateDistance(lat, lng, restaurant.lat, restaurant.lng)
        }));
      }
      
      results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      console.log('Setting restaurants:', results.length);
      setRestaurants(results);
      
      if (results.length === 0) {
        toast.error(`No restaurants found within ${radius}km`);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError('Failed to load restaurants');
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

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Container - Max width for mobile view */}
      <div className="max-w-md mx-auto bg-white min-h-screen md:max-w-full">
        
        {/* Header */}
        <header className="bg-white px-5 pt-6 pb-4 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-bold text-gray-900">Find Restaurants</h1>
            <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <SlidersHorizontal className="text-gray-700 text-lg" />
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search restaurants, cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-2xl bg-gray-50 border border-gray-100 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </header>

        {/* Distance Control */}
        <section className="px-5 py-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Distance</span>
            <span className="text-sm font-bold text-gray-900">{radiusKm} km</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.5"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number.parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-900 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gray-900 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-400">0 km</span>
            <span className="text-xs text-gray-400">10 km</span>
          </div>
        </section>

        {/* Map Section */}
        <section className="px-5 py-4">
          <div className="relative w-full h-80 rounded-3xl overflow-hidden shadow-lg bg-gray-50">
            {/* Map placeholder - you can integrate real map here */}
            <div className="w-full h-full bg-linear-to-br from-blue-50 to-gray-100 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Map View</p>
              </div>
            </div>
            
            {/* Your Location Badge */}
            <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-full shadow-md flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-gray-900">Your Location</span>
            </div>
            
            {/* Center marker - You */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Navigation className="text-white text-lg" />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full opacity-50"></div>
              </div>
            </div>
            
            {/* Restaurant pins - dynamically positioned based on actual restaurants */}
            {restaurants.slice(0, 4).map((restaurant, idx) => {
              const positions = [
                { top: '20%', right: '15%' },
                { bottom: '30%', left: '10%' },
                { top: '35%', left: '20%' },
                { bottom: '20%', right: '20%' }
              ];
              return (
                <div key={restaurant.id} className="absolute" style={positions[idx]}>
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
                    <MapPin className="text-white text-sm fill-current" />
                  </div>
                </div>
              );
            })}
            
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
              className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
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
            <div className="px-5 mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Nearby Restaurants</h2>
              <button className="text-sm font-medium text-gray-500 hover:text-gray-700">View All</button>
            </div>
            
            <div className="flex overflow-x-auto space-x-4 px-5 pb-2 hide-scrollbar">
              {restaurants.slice(0, 6).map((restaurant) => (
                <RestaurantCarouselCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onClick={() => fetchRestaurantDetails(restaurant)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Featured Restaurant */}
        {!loading && !error && restaurants.length > 0 && (
          <section className="px-5 py-6 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Featured Restaurant</h2>
            <FeaturedRestaurantCard
              restaurant={restaurants[0]}
              onClick={() => fetchRestaurantDetails(restaurants[0])}
            />
          </section>
        )}

        {/* Quick Filters */}
        <section className="px-5 py-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Filters</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleCategoryClick('all')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-50 text-gray-700 border border-gray-100 hover:bg-gray-100'
              }`}
            >
              <Star className="inline w-4 h-4 mr-2" />
              Popular
            </button>
            <button
              onClick={() => handleCategoryClick('italian')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === 'italian'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-50 text-gray-700 border border-gray-100 hover:bg-gray-100'
              }`}
            >
              <Star className="inline w-4 h-4 mr-2" />
              Top Rated
            </button>
            <button className="px-5 py-2.5 bg-gray-50 text-gray-700 rounded-full text-sm font-medium border border-gray-100 hover:bg-gray-100">
              <Clock className="inline w-4 h-4 mr-2" />
              Fast Delivery
            </button>
            <button className="px-5 py-2.5 bg-gray-50 text-gray-700 rounded-full text-sm font-medium border border-gray-100 hover:bg-gray-100">
              🌱 Vegetarian
            </button>
            <button className="px-5 py-2.5 bg-gray-50 text-gray-700 rounded-full text-sm font-medium border border-gray-100 hover:bg-gray-100">
              🏷️ Offers
            </button>
          </div>
        </section>

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
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <RestaurantDetailDialog
        restaurant={selectedRestaurant}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

// Carousel Card Component (for horizontal scroll)
function RestaurantCarouselCard({ restaurant, onClick }: Readonly<{ restaurant: Restaurant; onClick?: () => void }>) {
  const [liked, setLiked] = useState(false);
  
  const priceLevel = restaurant.price_level ? '$'.repeat(restaurant.price_level) : '$$';
  
  const getDistanceText = () => {
    if (!restaurant.distance) return '0.8km';
    if (restaurant.distance < 1) return `${(restaurant.distance * 1000).toFixed(0)}m`;
    return `${restaurant.distance.toFixed(1)}km`;
  };
  const distanceText = getDistanceText();

  return (
    <button
      onClick={onClick}
      className="shrink-0 w-72 bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow text-left"
    >
      {/* Image placeholder */}
      <div className="relative h-40 overflow-hidden bg-linear-to-br from-gray-100 to-gray-200">
        <div className="w-full h-full flex items-center justify-center">
          <MapPin className="w-12 h-12 text-gray-300" />
        </div>
        
        {/* Rating badge */}
        <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full flex items-center space-x-1">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-bold text-gray-900">{restaurant.rating}</span>
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
              setLiked(!liked);
            }}
            className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
        </div>
      </div>
    </button>
  );
}

// Featured Restaurant Card Component
function FeaturedRestaurantCard({ restaurant, onClick }: Readonly<{ restaurant: Restaurant; onClick?: () => void }>) {
  const priceLevel = restaurant.price_level ? '$'.repeat(restaurant.price_level) : '$$$';
  
  const getDistanceText = () => {
    if (!restaurant.distance) return '0.5km away';
    if (restaurant.distance < 1) return `${(restaurant.distance * 1000).toFixed(0)}m away`;
    return `${restaurant.distance.toFixed(1)}km away`;
  };
  const distanceText = getDistanceText();
  
  const cuisineTypes: string[] = Array.isArray(restaurant.cuisine) ? restaurant.cuisine : [restaurant.cuisine || 'Restaurant'];
  
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow text-left w-full"
    >
      {/* Hero image with gradient overlay */}
      <div className="relative h-56 overflow-hidden bg-linear-to-br from-gray-200 to-gray-300">
        <div className="w-full h-full flex items-center justify-center">
          <MapPin className="w-16 h-16 text-gray-400" />
        </div>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent"></div>
        
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
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Navigation className="text-gray-700 text-lg" />
            </div>
            <span className="text-xs text-gray-500">Navigate</span>
            <p className="text-sm font-semibold text-gray-900">5 mins</p>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex space-x-3">
          <button className="flex-1 h-12 bg-gray-900 text-white rounded-2xl font-semibold flex items-center justify-center space-x-2 hover:bg-gray-800 transition-colors">
            <span>📋</span>
            <span>Book Table</span>
          </button>
          <button className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-gray-100 transition-colors">
            <span className="text-gray-700 text-lg">🔗</span>
          </button>
        </div>
      </div>
    </button>
  );
}
