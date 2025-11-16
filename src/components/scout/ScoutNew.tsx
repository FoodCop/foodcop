import { useState, useEffect } from 'react';
import { Search, MapPin, Navigation, Star, Clock, SlidersHorizontal, Heart } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
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
  const { user } = useAuth();
  
  const [userLocation, setUserLocation] = useState<[number, number]>([37.7849, -122.4094]);
  const [userAddress, setUserAddress] = useState<string>('Getting location...');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(2);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
          setUserAddress('San Francisco, CA');
          fetchRestaurants(37.7849, -122.4094, radiusKm);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'FUZO-FoodApp/1.0' } }
      );
      const data = await response.json();
      
      if (data?.display_name) {
        const addressParts = data.display_name.split(',');
        const shortAddress = addressParts.slice(0, 3).join(',').trim();
        setUserAddress(shortAddress);
      } else {
        setUserAddress('Location detected');
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      setUserAddress('Location detected');
    }
  };

  const fetchRestaurants = async (lat: number, lng: number, radius: number, query?: string) => {
    setError(null);
    setLoading(true);
    
    try {
      let results: Restaurant[] = [];
      const radiusMeters = radius * 1000;
      
      try {
        if (query?.trim()) {
          const response = await backendService.searchPlacesByText(
            `${query} restaurant`,
            { lat, lng }
          );
          
          if (response.success && response.data?.results) {
            results = response.data.results.map((place: GooglePlace) => 
              formatGooglePlaceResult(place, { lat, lng })
            ).filter((restaurant: Restaurant) => 
              restaurant.distance !== undefined && restaurant.distance <= radius
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
  }, [searchQuery, radiusKm]);

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Container */}
      <div className="max-w-[375px] md:max-w-full lg:max-w-7xl mx-auto bg-white">
        
        {/* Header - Sticky */}
        <div className="bg-white shadow-sm px-5 md:px-8 lg:px-12 py-4 md:py-5 sticky top-0 z-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#EA580C] flex items-center justify-center shadow-md">
                <span className="text-white text-xl md:text-2xl">🕵️</span>
              </div>
              <h1 className="text-[#1A1A1A] font-bold text-xl md:text-2xl lg:text-3xl leading-7 font-[Poppins]">Scout</h1>
            </div>
            {user?.user_metadata?.avatar_url && (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Profile"
                className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#FF6B35]"
              />
            )}
          </div>

          {/* Location Bar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 flex items-center gap-2 bg-[#F5F5F5] rounded-xl px-3 md:px-4 py-2 md:py-2.5">
              <MapPin className="w-4 h-4 md:w-5 md:h-5 text-[#FF6B35]" />
              <span className="text-[#666666] text-sm md:text-base font-[Inter] truncate">{userAddress}</span>
            </div>
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  setUserAddress('Getting location...');
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
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center hover:bg-[#E8E8E8] transition-colors"
            >
              <Navigation className="w-5 h-5 md:w-6 md:h-6 text-[#666666]" />
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative md:max-w-2xl lg:max-w-3xl md:mx-auto">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-[#999999]" />
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 md:h-14 pl-10 md:pl-12 pr-12 md:pr-14 bg-[#F5F5F5] rounded-xl text-[#1A1A1A] text-base md:text-lg font-[Inter] placeholder:text-[#999999] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
            <button className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 md:w-6 md:h-6 text-[#666666]" />
            </button>
          </div>

          {/* Distance Slider */}
          <div className="mt-3 md:max-w-2xl lg:max-w-3xl md:mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#666666] text-xs md:text-sm font-[Inter]">Search radius</span>
              <span className="text-[#FF6B35] text-xs md:text-sm font-semibold font-[Inter]">{radiusKm} km</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
              className="w-full h-2 md:h-2.5 bg-[#E8E8E8] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 md:[&::-webkit-slider-thumb]:w-5 md:[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FF6B35] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
            />
          </div>
        </div>

        {/* Cuisine Categories - Horizontal Scroll */}
        <div className="px-5 md:px-8 lg:px-12 py-4 md:py-5 overflow-x-auto md:overflow-x-visible hide-scrollbar">
          <div className="flex md:flex-wrap gap-2 md:gap-3 md:justify-center">
            {CUISINE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`flex-shrink-0 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-sm md:text-base font-medium font-[Inter] transition-all ${
                  selectedCategory === category.id
                    ? 'bg-[#FF6B35] text-white shadow-md'
                    : 'bg-[#F5F5F5] text-[#666666] hover:bg-[#E8E8E8]'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 md:py-24">
            <div className="w-12 h-12 md:w-16 md:h-16 border-4 md:border-[5px] border-[#FF6B35] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[#666666] text-base md:text-lg font-[Inter]">Finding restaurants... 🔍</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 md:py-24 px-5 md:px-8">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-red-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-3xl md:text-4xl">⚠️</span>
            </div>
            <p className="text-[#1A1A1A] font-semibold text-base md:text-lg mb-1 font-[Poppins]">Failed to load restaurants</p>
            <p className="text-[#666666] text-sm md:text-base mb-4 font-[Inter] text-center">{error}</p>
            <button
              onClick={() => fetchRestaurants(userLocation[0], userLocation[1], radiusKm)}
              className="px-6 md:px-8 py-3 md:py-3.5 bg-[#FF6B35] text-white rounded-xl font-semibold text-sm md:text-base font-[Inter] shadow-md active:scale-95 transition-transform"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Restaurant List */}
        {!loading && !error && (
          <div className="px-5 md:px-8 lg:px-12 pb-6 md:pb-8">
            {restaurants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 md:py-24">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl md:text-5xl">🏪</span>
                </div>
                <p className="text-[#1A1A1A] font-semibold text-base md:text-lg mb-2 font-[Poppins]">No restaurants found</p>
                <p className="text-[#666666] text-sm md:text-base font-[Inter] text-center">
                  Try adjusting your search or increasing the radius
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[#666666] text-sm md:text-base font-[Inter]">
                    Found {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
                  {restaurants.map((restaurant) => (
                    <RestaurantCard 
                      key={restaurant.id} 
                      restaurant={restaurant}
                      onClick={() => {
                        setSelectedRestaurant(restaurant);
                        setDialogOpen(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
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
      `}</style>

      <RestaurantDetailDialog
        restaurant={selectedRestaurant}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

function RestaurantCard({ restaurant, onClick }: { restaurant: Restaurant; onClick?: () => void }) {
  const [liked, setLiked] = useState(false);

  const priceLevel = restaurant.price_level ? '$'.repeat(restaurant.price_level) : '$$';
  const distanceText = restaurant.distance 
    ? restaurant.distance < 1 
      ? `${Math.round(restaurant.distance * 1000)}m away`
      : `${restaurant.distance.toFixed(1)}km away`
    : '';

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_4px_0_rgba(0,0,0,0.1)] hover:shadow-[0_4px_8px_0_rgba(0,0,0,0.15)] transition-shadow cursor-pointer">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="text-[#1A1A1A] font-semibold text-base leading-5 mb-1 truncate font-[Poppins]">
              {restaurant.name}
            </h3>
            <p className="text-[#666666] text-sm font-[Inter] mb-2">
              {Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : restaurant.cuisine}
            </p>
            <p className="text-[#999999] text-xs font-[Inter] truncate">
              {restaurant.address}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLiked(!liked);
            }}
            className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center hover:bg-[#E8E8E8] transition-colors flex-shrink-0"
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : 'text-[#999999]'}`} />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-[#FFB800] fill-[#FFB800]" />
            <span className="text-[#1A1A1A] text-sm font-semibold font-[Inter]">{restaurant.rating}</span>
          </div>
          <span className="text-[#666666] text-sm font-[Inter]">{priceLevel}</span>
          {distanceText && (
            <>
              <span className="text-[#999999]">•</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#999999]" />
                <span className="text-[#666666] text-xs font-[Inter]">{distanceText}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.lat},${restaurant.lng}`;
              window.open(googleMapsUrl, '_blank');
            }}
            className="flex-1 h-10 bg-gradient-to-br from-[#FF6B35] to-[#EA580C] text-white rounded-xl font-semibold text-sm font-[Inter] shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-center gap-2">
              <Navigation className="w-4 h-4" />
              <span>Directions</span>
            </div>
          </button>
          <button className="h-10 px-4 bg-[#F5F5F5] text-[#666666] rounded-xl font-semibold text-sm font-[Inter] hover:bg-[#E8E8E8] transition-colors">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Open</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
