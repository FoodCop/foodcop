import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Clock, Phone, Globe, Calendar, Navigation, Plus, Minus, Heart, Share2 } from 'lucide-react';
import { savedItemsService } from '../../services/savedItemsService';
import { useAuth } from '../auth/AuthProvider';
import { toast } from 'sonner';

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

  // Mock data for initial load
  const mockRestaurants: Restaurant[] = [
    {
      id: '1',
      name: 'Bella Italia',
      address: '123 Main Street, Downtown',
      lat: 34.0522,
      lng: -118.2437,
      rating: 4.7,
      userRatingsTotal: 342,
      price_level: 2,
      cuisine: 'Italian · Pizza',
      distance: 1.2,
      deliveryTime: '30 min',
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/8d8afb5d6e-70831253bfe73c698a45.png',
      opening_hours: { open_now: true },
      description: 'Authentic Italian cuisine featuring wood-fired pizzas, handmade pasta, and classic Italian dishes. Family-owned restaurant with a warm, inviting atmosphere.',
      phone: '(555) 123-4567',
      website: 'https://bellaitalia.com',
      reviews: [
        {
          author_name: 'John Smith',
          rating: 5,
          text: 'Amazing pizza! The crust was perfect and the ingredients were fresh. Service was excellent too.',
          time: '2 days ago'
        },
        {
          author_name: 'Sarah Johnson',
          rating: 4,
          text: 'Great atmosphere and delicious food. The pasta carbonara is a must-try!',
          time: '1 week ago'
        }
      ]
    },
    {
      id: '2',
      name: 'Sakura Sushi',
      address: '456 Oak Avenue',
      lat: 34.0532,
      lng: -118.2447,
      rating: 4.9,
      userRatingsTotal: 521,
      price_level: 3,
      cuisine: 'Japanese · Sushi',
      distance: 0.8,
      deliveryTime: '25 min',
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/190d35c4cc-f6ba82cc89e8919b3c4e.png',
      opening_hours: { open_now: true }
    },
    {
      id: '3',
      name: 'El Taco Loco',
      address: '789 Pine Street',
      lat: 34.0512,
      lng: -118.2427,
      rating: 4.3,
      userRatingsTotal: 287,
      price_level: 1,
      cuisine: 'Mexican · Tacos',
      distance: 1.5,
      deliveryTime: '20 min',
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/140a8811f1-88b4466a4f1f9e92d811.png',
      opening_hours: { open_now: false }
    },
    {
      id: '4',
      name: 'Le Petit Bistro',
      address: '321 Elm Boulevard',
      lat: 34.0542,
      lng: -118.2457,
      rating: 4.6,
      userRatingsTotal: 198,
      price_level: 4,
      cuisine: 'French · Fine Dining',
      distance: 2.1,
      deliveryTime: '45 min',
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/0c8ad221cf-ec02e5e7754e72eb76e8.png',
      opening_hours: { open_now: true }
    },
    {
      id: '5',
      name: 'The Burger Joint',
      address: '654 Maple Drive',
      lat: 34.0502,
      lng: -118.2417,
      rating: 4.4,
      userRatingsTotal: 456,
      price_level: 2,
      cuisine: 'American · Burgers',
      distance: 0.6,
      deliveryTime: '15 min',
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/700f4b139b-7e26430c422269fd1ff0.png',
      opening_hours: { open_now: true }
    },
    {
      id: '6',
      name: 'Bangkok Street Food',
      address: '987 Cedar Lane',
      lat: 34.0552,
      lng: -118.2467,
      rating: 4.8,
      userRatingsTotal: 389,
      price_level: 2,
      cuisine: 'Thai · Asian',
      distance: 1.8,
      deliveryTime: '35 min',
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/488d559203-21b03884721723276e0e.png',
      opening_hours: { open_now: true }
    }
  ];

  useEffect(() => {
    setRestaurants(mockRestaurants);
    setSelectedRestaurant(mockRestaurants[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowDirections(false);
    setActiveTab('overview');
  };

  const handleGetDirections = () => {
    setShowDirections(true);
  };

  const handleStartNavigation = () => {
    if (selectedRestaurant) {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedRestaurant.lat},${selectedRestaurant.lng}`;
      globalThis.open(googleMapsUrl, '_blank');
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
        toast.success(`${selectedRestaurant.name} saved to your plate!`);
      } else if (result.error === 'Item already saved') {
        toast.info(`${selectedRestaurant.name} is already in your plate`);
      } else {
        toast.error(result.error || 'Failed to save restaurant');
      }
    } catch (error) {
      console.error('Error saving restaurant:', error);
      toast.error('An error occurred while saving the restaurant');
    }
  };

  const priceLevel = selectedRestaurant?.price_level ? '$'.repeat(selectedRestaurant.price_level) : '$$';

  return (
    <div className="flex h-screen bg-gray-50">
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
              <span className="text-sm font-medium text-gray-700">Distance</span>
              <span className="text-sm font-semibold text-orange-600">{distance} km</span>
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
          {restaurants.map((restaurant) => (
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
                    <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="text-gray-400" size={32} />
                    </div>
                  )}
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
                    <span className="text-xs text-gray-600">{restaurant.distance} km</span>
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
          ))}
        </div>
      </aside>

      {/* Map Container */}
      <div className="flex-1 relative bg-gray-200">
        {/* Placeholder Map */}
        <div className="w-full h-full bg-linear-to-br from-gray-100 to-gray-300 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPin size={64} className="mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">Interactive Map</p>
            <p className="text-sm">Google Maps integration coming soon</p>
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
            <Plus className="text-gray-700" size={20} />
          </button>
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
            <Minus className="text-gray-700" size={20} />
          </button>
        </div>

        {/* Search This Area Button */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
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
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin className="text-gray-400" size={64} />
                </div>
              )}
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
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveToPlate}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <Heart size={20} className="text-gray-700" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <Share2 size={20} className="text-gray-700" />
                  </button>
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
                <button className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  <Calendar size={18} />
                  Book
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
                  <div className="text-2xl font-bold text-gray-900 mb-1">{selectedRestaurant.distance}km</div>
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
                    <div className="text-center text-gray-500 py-8">
                      <p>Reviews content coming soon</p>
                    </div>
                  )}

                  {/* Photos Tab */}
                  {activeTab === 'photos' && (
                    <div className="text-center text-gray-500 py-8">
                      <p>Photos gallery coming soon</p>
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
                    onClick={() => setShowDirections(false)}
                    className="text-orange-500 text-sm font-medium mb-4 hover:text-orange-600"
                  >
                    ← Back to overview
                  </button>

                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Directions</h3>

                  {/* Travel Modes */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="p-3 border-2 border-orange-500 bg-orange-50 rounded-lg text-center">
                      <div className="text-2xl mb-1">🚗</div>
                      <div className="text-sm font-semibold text-gray-900">12 min</div>
                      <div className="text-xs text-gray-600">Driving</div>
                    </div>
                    <div className="p-3 border-2 border-gray-200 rounded-lg text-center hover:border-gray-300 cursor-pointer transition-colors">
                      <div className="text-2xl mb-1">🚶</div>
                      <div className="text-sm font-semibold text-gray-900">25 min</div>
                      <div className="text-xs text-gray-600">Walking</div>
                    </div>
                    <div className="p-3 border-2 border-gray-200 rounded-lg text-center hover:border-gray-300 cursor-pointer transition-colors">
                      <div className="text-2xl mb-1">🚴</div>
                      <div className="text-sm font-semibold text-gray-900">15 min</div>
                      <div className="text-xs text-gray-600">Cycling</div>
                    </div>
                  </div>

                  {/* Route Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Your location</div>
                        <div className="text-xs text-gray-600">Downtown, Los Angeles</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{selectedRestaurant.name}</div>
                        <div className="text-xs text-gray-600">{selectedRestaurant.address}</div>
                      </div>
                    </div>
                  </div>

                  {/* Start Navigation Button */}
                  <button
                    onClick={handleStartNavigation}
                    className="w-full bg-orange-500 text-white font-semibold py-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Navigation size={20} />
                    Start Navigation
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
