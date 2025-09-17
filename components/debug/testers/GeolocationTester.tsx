import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Search, Loader, CheckCircle, XCircle, Navigation } from 'lucide-react';
import { geolocationService } from './services/geolocationService';
import { backendService } from './services/backendService';

interface GeolocationTesterProps {
  onBack?: () => void;
}

export function GeolocationTester({ onBack }: GeolocationTesterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(5000);

  // Auto-get location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🗺️ Getting current location...');
      const location = await geolocationService.getCurrentLocation(false); // Force refresh
      setCurrentLocation(location);
      console.log('✅ Current location:', location);
    } catch (err: any) {
      console.error('❌ Location detection failed:', err);
      setError(err.message || 'Location detection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testLocationServices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🧪 Testing all location services...');
      const results = await geolocationService.testLocationServices();
      setTestResults(results);
      console.log('✅ Location services test results:', results);
    } catch (err: any) {
      console.error('❌ Location services test failed:', err);
      setError(err.message || 'Location services test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const searchNearbyRestaurants = async () => {
    if (!currentLocation) {
      setError('No location available. Please get location first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log('🍽️ Searching for nearby restaurants...');
      const results = await geolocationService.getNearbyRestaurants(radius, true);
      setNearbyRestaurants(results);
      console.log('✅ Nearby restaurants found:', results);
    } catch (err: any) {
      console.error('❌ Restaurant search failed:', err);
      setError(err.message || 'Restaurant search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testBackendHealth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🏥 Testing backend health...');
      const health = await backendService.healthCheck();
      console.log('✅ Backend health check:', health);
      
      if (health.success) {
        alert(`Backend is healthy!\n\nServices:\n- Google Maps: ${health.data.services.google_maps_configured ? '✅' : '❌'}\n- OpenAI: ${health.data.services.openai_configured ? '✅' : '❌'}\n- Spoonacular: ${health.data.services.spoonacular_configured ? '✅' : '❌'}`);
      } else {
        setError(`Backend health check failed: ${health.error}`);
      }
    } catch (err: any) {
      console.error('❌ Backend health check failed:', err);
      setError(err.message || 'Backend health check failed');
    } finally {
      setIsLoading(false);
    }
  };

  const clearLocationCache = () => {
    geolocationService.clearLocationCache();
    setCurrentLocation(null);
    setNearbyRestaurants(null);
    setTestResults(null);
    console.log('🗑️ Location cache cleared');
  };

  const StatusIcon = ({ status }: { status: boolean | null }) => {
    if (status === null) return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[#0B1F3A]" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F3A]">Geolocation Tester</h1>
              <p className="text-sm text-gray-600">Test location services and nearby restaurant search</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Current Location Section */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#0B1F3A] flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Current Location
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={getCurrentLocation}
                disabled={isLoading}
                className="px-4 py-2 bg-[#F14C35] text-white rounded-lg hover:bg-[#E63E26] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                <span>Get Location</span>
              </button>
              <button
                onClick={clearLocationCache}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Cache
              </button>
            </div>
          </div>

          {currentLocation && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-medium text-[#0B1F3A] mb-2">Location Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">City:</span> {currentLocation.city || 'Unknown'}</div>
                    <div><span className="font-medium">Region:</span> {currentLocation.region || 'Unknown'}</div>
                    <div><span className="font-medium">Country:</span> {currentLocation.country || 'Unknown'}</div>
                    <div><span className="font-medium">Method:</span> {currentLocation.method}</div>
                    <div><span className="font-medium">Timestamp:</span> {new Date(currentLocation.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-medium text-[#0B1F3A] mb-2">Coordinates</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Latitude:</span> {currentLocation.latitude?.toFixed(6)}</div>
                    <div><span className="font-medium">Longitude:</span> {currentLocation.longitude?.toFixed(6)}</div>
                    {currentLocation.accuracy && (
                      <div><span className="font-medium">Accuracy:</span> {currentLocation.accuracy}m</div>
                    )}
                    <div><span className="font-medium">Fallback:</span> {currentLocation.fallback ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nearby Restaurants Section */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#0B1F3A] flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Nearby Restaurants
            </h2>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Radius:</label>
                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#F14C35]"
                >
                  <option value={1000}>1km</option>
                  <option value={2500}>2.5km</option>
                  <option value={5000}>5km</option>
                  <option value={10000}>10km</option>
                  <option value={25000}>25km</option>
                </select>
              </div>
              <button
                onClick={searchNearbyRestaurants}
                disabled={isLoading || !currentLocation}
                className="px-4 py-2 bg-[#F14C35] text-white rounded-lg hover:bg-[#E63E26] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Search</span>
              </button>
            </div>
          </div>

          {nearbyRestaurants && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-medium text-[#0B1F3A] mb-2">Search Results</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><span className="font-medium">Found:</span> {nearbyRestaurants.totalResults}</div>
                  <div><span className="font-medium">Method:</span> {nearbyRestaurants.method}</div>
                  <div><span className="font-medium">Radius:</span> {nearbyRestaurants.searchRadius}m</div>
                  <div><span className="font-medium">Time:</span> {new Date(nearbyRestaurants.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>

              {nearbyRestaurants.restaurants && nearbyRestaurants.restaurants.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nearbyRestaurants.restaurants.slice(0, 6).map((restaurant: any, index: number) => (
                    <div key={restaurant.place_id || index} className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-[#0B1F3A] mb-2">{restaurant.name}</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>{restaurant.vicinity}</div>
                        {restaurant.rating && <div>⭐ {restaurant.rating}</div>}
                        {restaurant.price_level && <div>💰 {'$'.repeat(restaurant.price_level)}</div>}
                        {restaurant.opening_hours && (
                          <div className={restaurant.opening_hours.open_now ? 'text-green-600' : 'text-red-600'}>
                            {restaurant.opening_hours.open_now ? '🟢 Open' : '🔴 Closed'}
                          </div>
                        )}
                        {restaurant.distance_text && <div>📍 {restaurant.distance_text}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Testing Section */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-[#0B1F3A] mb-4">Testing & Diagnostics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={testLocationServices}
              disabled={isLoading}
              className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-[#F14C35] transition-colors text-left"
            >
              <h3 className="font-medium text-[#0B1F3A] mb-2">Test Location Services</h3>
              <p className="text-sm text-gray-600">Test browser, IP, and backend location detection</p>
            </button>

            <button
              onClick={testBackendHealth}
              disabled={isLoading}
              className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-[#F14C35] transition-colors text-left"
            >
              <h3 className="font-medium text-[#0B1F3A] mb-2">Test Backend Health</h3>
              <p className="text-sm text-gray-600">Check backend services and API keys</p>
            </button>
          </div>

          {testResults && (
            <div className="mt-4 bg-white rounded-lg p-4">
              <h3 className="font-medium text-[#0B1F3A] mb-3">Test Results</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <StatusIcon status={testResults.browser !== null} />
                  <span>Browser Geolocation</span>
                  {testResults.browser && (
                    <span className="text-sm text-gray-500">
                      ({testResults.browser.city}, {testResults.browser.region})
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <StatusIcon status={testResults.ip !== null} />
                  <span>IP Geolocation</span>
                  {testResults.ip && (
                    <span className="text-sm text-gray-500">
                      ({testResults.ip.city}, {testResults.ip.region})
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <StatusIcon status={testResults.backendAvailable} />
                  <span>Backend Available</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="font-medium text-red-800">Error</span>
            </div>
            <p className="text-red-700 text-sm mt-2">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-900 mb-2">How to Test</h3>
          <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
            <li>Click "Get Location" to detect your current location</li>
            <li>Adjust the search radius and click "Search" to find nearby restaurants</li>
            <li>Use "Test Location Services" to diagnose location detection issues</li>
            <li>Use "Test Backend Health" to verify API keys and backend connectivity</li>
            <li>If location fails, check browser permissions and try "Clear Cache"</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
