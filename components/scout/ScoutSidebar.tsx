"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { reverseGeocodingService } from "@/lib/scout/reverseGeocodingService";

function getGeolocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return "Permission denied - Please allow location access";
    case 2:
      return "Position unavailable - Unable to determine location";
    case 3:
      return "Request timeout - Location request timed out";
    default:
      return "Unknown geolocation error";
  }
}

// Restaurant type options
const RESTAURANT_TYPES = [
  { id: "all", label: "All Restaurants", description: "All restaurants and eateries" },
  { id: "fast-food", label: "Fast Food", description: "Fast food and quick service" },
  { id: "fine-dining", label: "Fine Dining", description: "Fine dining and upscale restaurants" },
  { id: "casual-dining", label: "Casual Dining", description: "Casual dining restaurants" },
  { id: "coffee-cafe", label: "Coffee & Cafe", description: "Coffee shops and cafes" },
  { id: "pizza", label: "Pizza", description: "Pizza restaurants" },
  { id: "asian", label: "Asian Cuisine", description: "Asian cuisine restaurants" },
  { id: "mexican", label: "Mexican", description: "Mexican and Tex-Mex restaurants" },
  { id: "bars-pubs", label: "Bars & Pubs", description: "Bars and pubs" }
];

export function ScoutSidebar() {
  const searchParams = useSearchParams();
  
  // Location state
  const [locationInfo, setLocationInfo] = useState<any>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Restaurant search state
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['all']));
  const [searchRadius, setSearchRadius] = useState('2000'); // 2km default
  const [minRating, setMinRating] = useState('any');
  const [priceLevel, setPriceLevel] = useState('any');
  const [openNow, setOpenNow] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSearchMethod, setLastSearchMethod] = useState<string>('');
  
  // Save-to-plate state
  const [savingRestaurantIds, setSavingRestaurantIds] = useState<Set<string>>(new Set());
  const [savedRestaurantIds, setSavedRestaurantIds] = useState<Set<string>>(new Set());
  const [saveMessages, setSaveMessages] = useState<{ [key: string]: string }>({});

  // Check for URL parameters and automatically set location if coming from Plate
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const name = searchParams.get('name');
    const focus = searchParams.get('focus');

    if (lat && lng && focus === 'true') {
      const coordinates = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng)
      };
      
      if (!isNaN(coordinates.latitude) && !isNaN(coordinates.longitude)) {
        // Set location info directly from URL parameters
        setLocationInfo({
          ...coordinates,
          accuracy: 10, // Good accuracy for saved restaurants
          timestamp: new Date().toLocaleString(),
          address: `${name || 'Restaurant Location'}`,
          formatted_address: `Saved restaurant at ${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`,
          geocodingSuccess: true,
          geocoding_success: true,
          fromUrlParams: true
        });

        // Helper function to search restaurants at a specific location
        const searchRestaurantsAtLocation = async (lat: number, lng: number) => {
          setSearchLoading(true);
          setSearchError(null);

          try {
            const apiUrl = `/api/debug/scout-restaurant-search?latitude=${lat}&longitude=${lng}&radius=${searchRadius}&type=all`;
            
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (!data.success) {
              setSearchError(data.error || 'Failed to search restaurants');
              return;
            }

            setRestaurants(data.restaurants || []);
            setLastSearchMethod('url_focus');
            console.log(`🗺️ Found ${data.restaurants?.length || 0} restaurants near focused location`);
          } catch (error) {
            console.error('Restaurant search error:', error);
            setSearchError(error instanceof Error ? error.message : 'Failed to search restaurants');
          } finally {
            setSearchLoading(false);
          }
        };

        // Automatically search for restaurants at this location
        setTimeout(() => {
          searchRestaurantsAtLocation(coordinates.latitude, coordinates.longitude);
        }, 500);
      }
    } else {
      // Automatically detect location on first load if no URL parameters
      refreshLocation();
    }
  }, [searchParams, searchRadius]);

  const refreshLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    
    try {
      // Get current geolocation
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });
      
      const geoData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp).toLocaleString()
      };

      // Test reverse geocoding using the same service as MapViewDynamic
      try {
        const addressResult = await reverseGeocodingService.getAddressFromCoordinates(
          geoData.latitude, 
          geoData.longitude
        );
        
        const formattedAddress = reverseGeocodingService.formatAddressForDisplay(addressResult);
        
        setLocationInfo({
          ...geoData,
          address: formattedAddress,
          formatted_address: addressResult.formatted_address,
          geocodingSuccess: addressResult.success,
          geocoding_success: addressResult.success
        });
      } catch (error) {
        setLocationInfo({
          ...geoData,
          address: 'Reverse geocoding failed',
          geocodingSuccess: false
        });
      }
      
    } catch (error) {
      const errorMessage = error instanceof GeolocationPositionError 
        ? getGeolocationErrorMessage(error.code)
        : error instanceof Error ? error.message : "Unknown geolocation error";
      setLocationError(errorMessage);
    } finally {
      setLocationLoading(false);
    }
  };

  const searchRestaurants = async (restaurantType?: string) => {
    if (!locationInfo) {
      setSearchError('Please get your location first');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const searchMethod = restaurantType || (searchQuery ? 'search' : 'location');
      const typeToSearch = restaurantType || Array.from(selectedTypes)[0] || 'all';
      
      let apiUrl = `/api/debug/scout-restaurant-search?latitude=${locationInfo.latitude}&longitude=${locationInfo.longitude}&radius=${searchRadius}&type=${typeToSearch}`;
      
      // Add additional parameters
      if (searchQuery && !restaurantType) {
        apiUrl += `&query=${encodeURIComponent(searchQuery)}`;
      }
      if (minRating !== 'any') {
        apiUrl += `&rating=${minRating}`;
      }
      if (priceLevel !== 'any') {
        apiUrl += `&priceLevel=${priceLevel}`;
      }
      if (openNow) {
        apiUrl += `&openNow=true`;
      }

      console.log('Restaurant search URL:', apiUrl);

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data.success) {
        setSearchError(data.error || 'Failed to search restaurants');
        return;
      }

      setRestaurants(data.restaurants || []);
      setLastSearchMethod(restaurantType ? `${restaurantType}_type` : searchMethod);

      // Clear any previous messages
      setSaveMessages({});

    } catch (error) {
      console.error('Restaurant search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Unknown search error');
    } finally {
      setSearchLoading(false);
    }
  };

  const saveRestaurantToPlate = async (restaurant: any) => {
    const restaurantId = restaurant.id;
    setSavingRestaurantIds(prev => new Set([...prev, restaurantId]));

    try {
      const response = await fetch('/api/save-restaurant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ restaurant }),
      });

      const data = await response.json();

      if (data.success) {
        setSavedRestaurantIds(prev => new Set([...prev, restaurantId]));
        setSaveMessages(prev => ({
          ...prev,
          [restaurantId]: '✅ Saved to plate!'
        }));

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSaveMessages(prev => {
            const newMessages = { ...prev };
            delete newMessages[restaurantId];
            return newMessages;
          });
        }, 3000);
      } else {
        setSaveMessages(prev => ({
          ...prev,
          [restaurantId]: `❌ Error: ${data.error}`
        }));

        // Clear error message after 5 seconds
        setTimeout(() => {
          setSaveMessages(prev => {
            const newMessages = { ...prev };
            delete newMessages[restaurantId];
            return newMessages;
          });
        }, 5000);
      }
    } catch (error) {
      console.error('Save restaurant error:', error);
      setSaveMessages(prev => ({
        ...prev,
        [restaurantId]: `❌ Network error`
      }));

      setTimeout(() => {
        setSaveMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[restaurantId];
          return newMessages;
        });
      }, 5000);
    } finally {
      setSavingRestaurantIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(restaurantId);
        return newSet;
      });
    }
  };

  const handleTypeToggle = (typeId: string) => {
    if (typeId === 'all') {
      setSelectedTypes(new Set(['all']));
    } else {
      const newSelected = new Set(selectedTypes);
      newSelected.delete('all'); // Remove 'all' when selecting specific types
      
      if (newSelected.has(typeId)) {
        newSelected.delete(typeId);
      } else {
        newSelected.add(typeId);
      }
      
      if (newSelected.size === 0) {
        newSelected.add('all');
      }
      
      setSelectedTypes(newSelected);
    }
  };

  const clearResults = () => {
    setRestaurants([]);
    setSearchError(null);
    setSaveMessages({});
  };

  return (
    <div className="p-5 max-w-sm space-y-6">
      <h3 className="text-lg font-semibold text-foreground">🍽️ Restaurant Scout</h3>
      
      {/* Location Section */}
      <div className="space-y-3">

        {locationError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            <strong>Location Error:</strong> {locationError}
          </div>
        )}

        {locationInfo && (
          <div className={`p-3 rounded-lg border text-sm ${
            locationInfo.fromUrlParams 
              ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
              : 'bg-muted border-border'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-foreground mb-1">
                  {locationInfo.fromUrlParams ? "🗺️ Restaurant Location" : " Detected Location"}
                </div>
                <div className="text-muted-foreground text-xs leading-relaxed">
                  {locationInfo.address}
                </div>
                {locationInfo.fromUrlParams && (
                  <div className="text-amber-700 dark:text-amber-400 text-xs mt-1">
                    From your Plate
                  </div>
                )}
              </div>
              {!locationInfo.fromUrlParams && (
                <button
                  onClick={refreshLocation}
                  disabled={locationLoading}
                  className="ml-2 p-1.5 hover:bg-accent rounded-md transition-colors disabled:opacity-50"
                  title="Refresh location"
                >
                  <RefreshCw 
                    className={`h-4 w-4 text-muted-foreground ${locationLoading ? 'animate-spin' : ''}`} 
                  />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Show initial location detection on first load */}
        {!locationInfo && !locationError && (
          <div className="p-3 bg-muted border border-border rounded-lg text-sm">
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">
                📍 Detecting your location...
              </div>
              <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Search Section */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="space-y-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchRestaurants()}
            placeholder="Search restaurants..."
            className="w-full p-3 border-2 border-input rounded-lg text-sm focus:border-ring focus:outline-none"
          />
          <button
            onClick={() => searchRestaurants()}
            disabled={!locationInfo || searchLoading}
            className="w-full p-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed border-none rounded-lg text-sm font-semibold"
          >
            {searchLoading ? "Searching..." : "🔍 Find Restaurants"}
          </button>
        </div>

        {/* Quick Filters */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", fontWeight: "bold" }}>
            Search Radius:
          </label>
          <select
            value={searchRadius}
            onChange={(e) => setSearchRadius(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "8px", 
              border: "1px solid #e5e7eb", 
              borderRadius: "6px",
              fontSize: "14px"
            }}
          >
            <option value="500">500m</option>
            <option value="1000">1km</option>
            <option value="2000">2km</option>
            <option value="5000">5km</option>
            <option value="10000">10km</option>
          </select>
        </div>

        {/* Restaurant Types */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", fontWeight: "bold" }}>
            Restaurant Types:
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {RESTAURANT_TYPES.slice(0, 4).map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeToggle(type.id)}
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                  backgroundColor: selectedTypes.has(type.id) ? "#329937" : "white",
                  color: selectedTypes.has(type.id) ? "white" : "#666",
                  cursor: "pointer"
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchError && (
        <div style={{ 
          marginBottom: "20px",
          padding: "12px", 
          backgroundColor: "#fee", 
          border: "1px solid #fcc", 
          borderRadius: "8px", 
          color: "#900",
          fontSize: "14px"
        }}>
          <strong>Search Error:</strong> {searchError}
        </div>
      )}

      {restaurants.length > 0 && (
        <div>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "15px" 
          }}>
            <h4 style={{ margin: 0, fontSize: "16px" }}>
              🍴 Found {restaurants.length} restaurants
            </h4>
            <button
              onClick={clearResults}
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                border: "1px solid #e5e7eb",
                borderRadius: "4px",
                backgroundColor: "white",
                color: "#666",
                cursor: "pointer"
              }}
            >
              Clear
            </button>
          </div>
          
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {restaurants.map((restaurant, index) => (
              <div
                key={restaurant.id || index}
                style={{
                  padding: "12px",
                  marginBottom: "12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: "white"
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "4px" }}>
                  {restaurant.name}
                </div>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                  ⭐ {restaurant.rating || 'N/A'} • 📍 {restaurant.distance || 'N/A'}
                </div>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                  {restaurant.address}
                </div>
                
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => saveRestaurantToPlate(restaurant)}
                    disabled={savingRestaurantIds.has(restaurant.id)}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      backgroundColor: savedRestaurantIds.has(restaurant.id) ? "#22c55e" : "#329937",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: savingRestaurantIds.has(restaurant.id) ? "not-allowed" : "pointer",
                      opacity: savingRestaurantIds.has(restaurant.id) ? 0.6 : 1
                    }}
                  >
                    {savingRestaurantIds.has(restaurant.id) 
                      ? "Saving..." 
                      : savedRestaurantIds.has(restaurant.id) 
                        ? "✅ Saved" 
                        : "💾 Save"}
                  </button>
                  
                  {restaurant.coordinates && (
                    <a
                      href={`https://www.google.com/maps?q=${restaurant.coordinates.lat},${restaurant.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        backgroundColor: "#047DD4",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "4px"
                      }}
                    >
                      🗺️ View
                    </a>
                  )}
                </div>
                
                {saveMessages[restaurant.id] && (
                  <div style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: saveMessages[restaurant.id].includes('✅') ? "#22c55e" : "#dc2626"
                  }}>
                    {saveMessages[restaurant.id]}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Save Summary */}
          {savedRestaurantIds.size > 0 && (
            <div style={{
              marginTop: "15px",
              padding: "12px",
              backgroundColor: "#dcfce7",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              color: "#166534",
              fontSize: "14px",
              fontWeight: "bold",
              textAlign: "center"
            }}>
              📋 {savedRestaurantIds.size} restaurant{savedRestaurantIds.size !== 1 ? 's' : ''} saved to plate!
            </div>
          )}
        </div>
      )}
    </div>
  );
}