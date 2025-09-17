import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader, MapPin, Search, Navigation } from 'lucide-react';
import { API_CONFIG, isGoogleAPIAvailable } from './config/apiConfig';
import { locationService } from './services/locationService';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export function GoogleAPITest() {
  const [tests, setTests] = useState<TestResult[]>([
    { test: 'API Key Configuration', status: 'pending', message: 'Checking API key...' },
    { test: 'Maps JavaScript API', status: 'pending', message: 'Loading Maps API...' },
    { test: 'Places API', status: 'pending', message: 'Testing Places API...' },
    { test: 'Geolocation', status: 'pending', message: 'Getting location...' },
    { test: 'Nearby Search', status: 'pending', message: 'Searching restaurants...' }
  ]);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (testName: string, status: 'success' | 'error', message: string, details?: any) => {
    setTests(prev => prev.map(test => 
      test.test === testName 
        ? { ...test, status, message, details }
        : test
    ));
  };

  const runTests = async () => {
    setIsRunning(true);
    
    // Test 1: API Key Configuration
    console.log('🔍 Testing API Key Configuration...');
    const apiKey = API_CONFIG.GOOGLE_API_KEY;
    if (apiKey && apiKey !== "YOUR_GOOGLE_API_KEY_HERE" && apiKey.startsWith('AIza')) {
      updateTest('API Key Configuration', 'success', `✅ Google API key configured: ${apiKey.substring(0, 8)}...`);
    } else {
      updateTest('API Key Configuration', 'error', `❌ Invalid API key: ${apiKey || 'missing'}`);
      setIsRunning(false);
      return;
    }

    // Test 2: Maps JavaScript API
    console.log('🗺️ Testing Google Maps API loading...');
    try {
      await new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
          updateTest('Maps JavaScript API', 'success', '✅ Google Maps API already loaded');
          resolve(true);
          return;
        }

        // Remove any existing scripts first
        const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
        existingScripts.forEach(script => script.remove());

        const script = document.createElement('script');
        script.src = `${API_CONFIG.GOOGLE_MAPS_API_URL}?key=${API_CONFIG.GOOGLE_API_KEY}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log('✅ Google Maps script loaded');
          // Wait a bit for Google Maps to initialize
          setTimeout(() => {
            if (window.google && window.google.maps) {
              updateTest('Maps JavaScript API', 'success', '✅ Google Maps API loaded successfully');
              resolve(true);
            } else {
              updateTest('Maps JavaScript API', 'error', '❌ Google Maps API failed to initialize');
              reject(new Error('Google Maps API failed to initialize'));
            }
          }, 1000);
        };
        
        script.onerror = (event) => {
          console.error('❌ Google Maps script failed to load:', event);
          updateTest('Maps JavaScript API', 'error', '❌ Failed to load Google Maps API - Check API key and billing');
          reject(new Error('Failed to load Maps API - possibly billing issue'));
        };
        
        document.head.appendChild(script);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          if (!window.google) {
            updateTest('Maps JavaScript API', 'error', '❌ Google Maps API load timeout');
            reject(new Error('API load timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      console.error('Maps API Error:', error);
      updateTest('Maps JavaScript API', 'error', `❌ Maps API error: ${error.message}`);
      setIsRunning(false);
      return;
    }

    // Test 3: Places API
    console.log('📍 Testing Places API...');
    try {
      await new Promise((resolve) => {
        setTimeout(() => {
          if (window.google && window.google.maps && window.google.maps.places) {
            updateTest('Places API', 'success', '✅ Places API library loaded');
            resolve(true);
          } else {
            updateTest('Places API', 'error', '❌ Places API library not available - Check if Places API is enabled');
          }
        }, 500);
      });
    } catch (error) {
      updateTest('Places API', 'error', `❌ Places API error: ${error.message}`);
    }

    // Test 4: Geolocation
    console.log('🌍 Testing Geolocation...');
    try {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
      
      if (location.lat === API_CONFIG.DEFAULT_LOCATION.lat && 
          location.lng === API_CONFIG.DEFAULT_LOCATION.lng) {
        updateTest('Geolocation', 'success', '⚠️ Using default location (San Francisco)', location);
      } else {
        updateTest('Geolocation', 'success', '✅ Got user location', location);
      }
    } catch (error) {
      console.error('Geolocation Error:', error);
      updateTest('Geolocation', 'error', `❌ Location error: ${error.message}`);
    }

    // Test 5: Nearby Search
    console.log('🔍 Testing Nearby Search...');
    const locationForSearch = currentLocation || API_CONFIG.DEFAULT_LOCATION;
    try {
      const nearbyRestaurants = await locationService.searchNearbyRestaurants(locationForSearch, 2000);
      setRestaurants(nearbyRestaurants.slice(0, 3)); // Show first 3
      
      if (nearbyRestaurants.length > 0) {
        updateTest('Nearby Search', 'success', `✅ Found ${nearbyRestaurants.length} restaurants`, nearbyRestaurants.slice(0, 3));
      } else {
        updateTest('Nearby Search', 'error', '❌ No restaurants found - Using mock data');
      }
    } catch (error) {
      console.error('Search Error:', error);
      updateTest('Nearby Search', 'error', `❌ Search error: ${error.message}`);
    }

    console.log('🎉 API tests completed');
    setIsRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  const allTestsPassed = tests.every(test => test.status === 'success');
  const hasErrors = tests.some(test => test.status === 'error');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-[#F14C35] rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F3A]">Google API Test Suite</h1>
              <p className="text-gray-600">Testing your Google Maps & Places API integration</p>
            </div>
          </div>

          {/* Overall Status */}
          <div className={`p-4 rounded-xl mb-6 border ${
            isRunning 
              ? 'bg-blue-50 border-blue-200' 
              : allTestsPassed 
                ? 'bg-green-50 border-green-200'
                : hasErrors
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              {isRunning ? (
                <>
                  <Loader className="w-6 h-6 text-blue-500 animate-spin" />
                  <span className="font-medium text-blue-700">Running tests...</span>
                </>
              ) : allTestsPassed ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="font-medium text-green-700">All tests passed! 🎉</span>
                </>
              ) : hasErrors ? (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  <span className="font-medium text-red-700">Some tests failed</span>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 rounded-full bg-gray-300" />
                  <span className="font-medium text-gray-700">Ready to test</span>
                </>
              )}
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-4 mb-6">
            {tests.map((test, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-xl">
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(test.status)}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-[#0B1F3A] mb-1">{test.test}</h3>
                  <p className="text-sm text-gray-600 mb-2">{test.message}</p>
                  {test.details && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <pre className="text-xs text-gray-700 overflow-x-auto">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Sample Results */}
          {restaurants.length > 0 && (
            <div className="border-t pt-6">
              <h2 className="font-bold text-[#0B1F3A] mb-4 flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Sample Restaurant Results</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {restaurants.map((restaurant, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                    <img 
                      src={restaurant.photos[0]} 
                      alt={restaurant.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-medium text-[#0B1F3A] mb-2">{restaurant.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <span>⭐ {restaurant.rating}</span>
                        <span>•</span>
                        <span>${'$'.repeat(restaurant.priceLevel)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{restaurant.address}</p>
                      <div className="flex flex-wrap gap-1">
                        {restaurant.cuisine.map((c, i) => (
                          <span key={i} className="px-2 py-1 bg-[#F14C35]/10 text-[#F14C35] text-xs rounded-full">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-6 flex space-x-4">
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-6 py-3 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isRunning && <Loader className="w-4 h-4 animate-spin" />}
              <span>Run Tests Again</span>
            </button>
            
            {allTestsPassed && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Ready to use Google APIs!</span>
              </div>
            )}
          </div>

          {/* Debug Info */}
          <div className="border-t pt-6 mt-6">
            <details className="cursor-pointer">
              <summary className="font-medium text-[#0B1F3A] mb-2">Debug Information</summary>
              <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                <p><strong>API Key Status:</strong> {isGoogleAPIAvailable() ? 'Configured' : 'Missing'}</p>
                <p><strong>API Key Preview:</strong> {API_CONFIG.GOOGLE_API_KEY ? `${API_CONFIG.GOOGLE_API_KEY.substring(0, 8)}...` : 'Not set'}</p>
                <p><strong>Environment:</strong> {import.meta?.env?.MODE || 'Unknown'}</p>
                <p><strong>Current Location:</strong> {currentLocation ? `${currentLocation.lat}, ${currentLocation.lng}` : 'None'}</p>
                <p><strong>Default Location:</strong> {API_CONFIG.DEFAULT_LOCATION.lat}, {API_CONFIG.DEFAULT_LOCATION.lng}</p>
                <p><strong>Google Maps Loaded:</strong> {typeof window !== 'undefined' && window.google ? 'Yes' : 'No'}</p>
                <p><strong>Places API Available:</strong> {typeof window !== 'undefined' && window.google?.maps?.places ? 'Yes' : 'No'}</p>
              </div>
            </details>
          </div>

          {/* Common Issues Help */}
          {hasErrors && (
            <div className="border-t pt-6 mt-6">
              <h3 className="font-medium text-[#0B1F3A] mb-3">🔧 Common Issues & Solutions</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm space-y-3">
                <div>
                  <strong className="text-red-700">API Key Issues:</strong>
                  <ul className="list-disc list-inside text-red-600 mt-1 space-y-1">
                    <li>Make sure your API key starts with "AIza" and is properly set in .env</li>
                    <li>Ensure Places API and Maps JavaScript API are enabled in Google Cloud Console</li>
                    <li>Check that billing is enabled on your Google Cloud project</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-red-700">Billing Issues:</strong>
                  <ul className="list-disc list-inside text-red-600 mt-1 space-y-1">
                    <li>Google Maps requires a billing account even for free tier usage</li>
                    <li>Go to Google Cloud Console → Billing to set up payment</li>
                    <li>You get $200 free credits monthly for Maps usage</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-red-700">Restrictions:</strong>
                  <ul className="list-disc list-inside text-red-600 mt-1 space-y-1">
                    <li>If using HTTP referrer restrictions, add your domain to allowed referrers</li>
                    <li>For local development, add "localhost" to referrer restrictions</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
