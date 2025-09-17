import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Phone, ExternalLink, Star, Route } from 'lucide-react';
import { motion } from 'motion/react';
import { locationService, Restaurant, Location, RouteInfo } from './services/locationService';
import { isGoogleAPIAvailable } from './config/apiConfig';
import { APIErrorHandler, useGoogleMapsErrorDetection } from './config/APIErrorHandler';
import { FuzoButton } from './FuzoButton';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface GoogleMapsDemoProps {
  onNavigateBack?: () => void;
}

export function GoogleMapsDemo({ onNavigateBack }: GoogleMapsDemoProps) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [detailedRestaurant, setDetailedRestaurant] = useState<Restaurant | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDemo, setActiveDemo] = useState<'search' | 'details' | 'route'>('search');
  const [apiError, setApiError] = useState<string | null>(null);
  const { error: detectedError, clearError } = useGoogleMapsErrorDetection();

  // Get current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  };

  const searchNearbyRestaurants = async () => {
    if (!currentLocation) return;

    setLoading(true);
    setApiError(null);
    try {
      const results = await locationService.searchNearbyRestaurants(currentLocation, 2000);
      setRestaurants(results.slice(0, 5)); // Limit to 5 for demo
      
      if (results.length === 0) {
        setApiError('No restaurants found in this area. The API might have billing restrictions.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      setApiError('API request failed. This might be due to billing restrictions or CORS policies.');
    } finally {
      setLoading(false);
    }
  };

  const searchRestaurantsByQuery = async () => {
    if (!currentLocation || !searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await locationService.searchRestaurants(searchQuery, currentLocation);
      setRestaurants(results.slice(0, 5));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRestaurantDetails = async (restaurant: Restaurant) => {
    if (!restaurant.placeId) return;

    setLoading(true);
    try {
      const details = await locationService.getRestaurantDetails(restaurant.placeId);
      if (details) {
        setDetailedRestaurant(details);
        setActiveDemo('details');
      }
    } catch (error) {
      console.error('Failed to get details:', error);
    } finally {
      setLoading(false);
    }
  };

  const planRoute = async (restaurant: Restaurant) => {
    if (!currentLocation) return;

    setLoading(true);
    try {
      const route = await locationService.getRouteInfo(currentLocation, restaurant.location);
      if (route) {
        setRouteInfo(route);
        setSelectedRestaurant(restaurant);
        setActiveDemo('route');
      }
    } catch (error) {
      console.error('Failed to plan route:', error);
    } finally {
      setLoading(false);
    }
  };

  const demoTabs = [
    { id: 'search', label: 'Places Search', icon: MapPin },
    { id: 'details', label: 'Place Details', icon: Star },
    { id: 'route', label: 'Route Planning', icon: Route }
  ];

  // Show error handler if billing or other critical API errors are detected
  if (detectedError) {
    return (
      <APIErrorHandler 
        error={detectedError}
        apiType="google-maps"
        onRetry={clearError}
      >
        <div />
      </APIErrorHandler>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          {onNavigateBack && (
            <button 
              onClick={onNavigateBack}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              ←
            </button>
          )}
          
          <div className="text-center flex-1">
            <h1 className="font-bold text-[#0B1F3A]">Google Maps API Demo</h1>
            <p className="text-sm text-gray-600">
              {isGoogleAPIAvailable() ? '✅ Universal API Key Active' : '❌ Using Mock Data Only'}
            </p>
            {apiError && (
              <p className="text-xs text-red-600 mt-1">⚠️ API Issue Detected</p>
            )}
          </div>

          <div className="w-10" />
        </div>

        {/* Demo Tabs */}
        <div className="flex">
          {demoTabs.map((tab) => {
            const isActive = activeDemo === tab.id;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveDemo(tab.id as any)}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center space-x-2 ${
                  isActive
                    ? 'border-[#F14C35] text-[#F14C35]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeDemo === 'search' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="font-bold text-[#0B1F3A] mb-2">Google Places Search API</h2>
              <p className="text-gray-600 mb-4">Search for restaurants using nearby search or text search.</p>
              
              {/* API Status */}
              <div className="bg-[#F8F9FA] rounded-xl p-4 mb-4">
                <h3 className="font-medium text-[#0B1F3A] mb-2">Integrated Google APIs:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isGoogleAPIAvailable() ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span>Places API</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isGoogleAPIAvailable() ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span>Maps JavaScript API</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isGoogleAPIAvailable() ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span>Place Details API</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isGoogleAPIAvailable() ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span>Distance Matrix API</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isGoogleAPIAvailable() ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span>Directions API</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isGoogleAPIAvailable() ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span>Place Photos API</span>
                  </div>
                </div>
              </div>
              
              {/* Location Info */}
              {currentLocation && (
                <div className="bg-[#F8F9FA] rounded-xl p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Navigation className="w-4 h-4 text-[#F14C35]" />
                    <span className="font-medium text-[#0B1F3A]">Current Location</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {currentLocation.city || 'Unknown City'}, {currentLocation.country || 'Unknown Country'}
                  </p>
                </div>
              )}

              {/* API Error Display */}
              {apiError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 text-red-600 mt-0.5">⚠️</div>
                    <div>
                      <h4 className="font-medium text-red-800 mb-1">API Issue Detected</h4>
                      <p className="text-sm text-red-700 mb-2">{apiError}</p>
                      <p className="text-xs text-red-600">
                        Common causes: Billing not enabled, quota exceeded, or API restrictions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Controls */}
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    placeholder="Search for specific restaurants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
                  />
                  <FuzoButton
                    onClick={searchRestaurantsByQuery}
                    disabled={!searchQuery.trim() || loading}
                    variant="primary"
                  >
                    Search
                  </FuzoButton>
                </div>
                
                <FuzoButton
                  onClick={searchNearbyRestaurants}
                  disabled={!currentLocation || loading}
                  variant="secondary"
                  className="w-full"
                >
                  {loading ? 'Searching...' : 'Find Nearby Restaurants'}
                </FuzoButton>
              </div>
            </div>

            {/* Results */}
            {restaurants.length > 0 && (
              <div>
                <h3 className="font-medium text-[#0B1F3A] mb-3">Search Results ({restaurants.length})</h3>
                <div className="space-y-3">
                  {restaurants.map((restaurant) => (
                    <div key={restaurant.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex space-x-4">
                        {restaurant.photos.length > 0 && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <ImageWithFallback
                              src={restaurant.photos[0]}
                              alt={restaurant.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <h4 className="font-medium text-[#0B1F3A] mb-1">{restaurant.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{restaurant.address}</p>
                          
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span>{restaurant.rating}</span>
                            </div>
                            <span>{'$'.repeat(restaurant.priceLevel)}</span>
                            <span>{restaurant.distance?.toFixed(1)} mi</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mt-2">
                            {restaurant.cuisine.map((type, idx) => (
                              <span key={idx} className="px-2 py-1 bg-[#F14C35]/10 text-[#F14C35] text-xs rounded-full">
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <FuzoButton
                            onClick={() => getRestaurantDetails(restaurant)}
                            variant="primary"
                            size="sm"
                          >
                            Details
                          </FuzoButton>
                          <FuzoButton
                            onClick={() => planRoute(restaurant)}
                            variant="secondary"
                            size="sm"
                          >
                            Route
                          </FuzoButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeDemo === 'details' && detailedRestaurant && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="font-bold text-[#0B1F3A] mb-2">Google Place Details API</h2>
              <p className="text-gray-600 mb-4">Detailed information including photos, reviews, and hours.</p>
            </div>

            {/* Restaurant Photos */}
            {detailedRestaurant.photos.length > 0 && (
              <div>
                <h3 className="font-medium text-[#0B1F3A] mb-3">Photos</h3>
                <div className="grid grid-cols-2 gap-3">
                  {detailedRestaurant.photos.slice(0, 4).map((photo, idx) => (
                    <div key={idx} className="aspect-square rounded-xl overflow-hidden">
                      <ImageWithFallback
                        src={photo}
                        alt={`${detailedRestaurant.name} photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Restaurant Info */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-bold text-[#0B1F3A] text-xl mb-2">{detailedRestaurant.name}</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#0B1F3A]">Address</p>
                    <p className="text-gray-600">{detailedRestaurant.address}</p>
                  </div>
                </div>

                {detailedRestaurant.phoneNumber && (
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#0B1F3A]">Phone</p>
                      <p className="text-[#F14C35]">{detailedRestaurant.phoneNumber}</p>
                    </div>
                  </div>
                )}

                {detailedRestaurant.website && (
                  <div className="flex items-start space-x-3">
                    <ExternalLink className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#0B1F3A]">Website</p>
                      <p className="text-[#F14C35]">{detailedRestaurant.website}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Opening Hours */}
            {detailedRestaurant.openingHours && detailedRestaurant.openingHours.length > 0 && (
              <div>
                <h3 className="font-medium text-[#0B1F3A] mb-3">Opening Hours</h3>
                <div className="bg-[#F8F9FA] rounded-xl p-4">
                  {detailedRestaurant.openingHours.map((hours, idx) => (
                    <p key={idx} className="text-sm text-gray-700 mb-1">{hours}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {detailedRestaurant.reviews && detailedRestaurant.reviews.length > 0 && (
              <div>
                <h3 className="font-medium text-[#0B1F3A] mb-3">Recent Reviews</h3>
                <div className="space-y-4">
                  {detailedRestaurant.reviews.slice(0, 3).map((review, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <ImageWithFallback
                            src={review.profile_photo_url}
                            alt={review.author_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium text-[#0B1F3A]">{review.author_name}</p>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">{review.relative_time_description}</p>
                        </div>
                      </div>
                      <p className="text-gray-700">{review.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeDemo === 'route' && routeInfo && selectedRestaurant && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="font-bold text-[#0B1F3A] mb-2">Google Distance Matrix & Directions API</h2>
              <p className="text-gray-600 mb-4">Get route information and driving directions.</p>
            </div>

            {/* Route Info */}
            <div className="bg-gradient-to-r from-[#F14C35] to-[#A6471E] rounded-xl p-6 text-white">
              <h3 className="font-bold text-lg mb-4">Route to {selectedRestaurant.name}</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">{routeInfo.distance.text}</div>
                  <div className="text-white/80">Distance</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">{routeInfo.duration.text}</div>
                  <div className="text-white/80">Drive Time</div>
                </div>
              </div>
            </div>

            {/* Restaurant Info */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex space-x-4">
                {selectedRestaurant.photos.length > 0 && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden">
                    <ImageWithFallback
                      src={selectedRestaurant.photos[0]}
                      alt={selectedRestaurant.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="flex-1">
                  <h4 className="font-bold text-[#0B1F3A] mb-2">{selectedRestaurant.name}</h4>
                  <p className="text-gray-600 mb-2">{selectedRestaurant.address}</p>
                  
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{selectedRestaurant.rating}</span>
                    </div>
                    <span>{'$'.repeat(selectedRestaurant.priceLevel)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <FuzoButton
                onClick={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation?.lat},${currentLocation?.lng}&destination=${selectedRestaurant.location.lat},${selectedRestaurant.location.lng}`;
                  window.open(url, '_blank');
                }}
                variant="primary"
                className="w-full"
              >
                Open in Google Maps
              </FuzoButton>
              
              <FuzoButton
                onClick={() => setActiveDemo('search')}
                variant="secondary"
                className="w-full"
              >
                Back to Search
              </FuzoButton>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
