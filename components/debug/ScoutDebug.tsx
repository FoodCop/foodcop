"use client";

import { useState } from "react";
import { BaseDebug } from "./BaseDebug";
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

export function ScoutDebug() {
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

  const testLocation = async () => {
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

  const scoutTestingFeatures = (
    <>
      {/* Location Testing Section */}
      <h4>Location & Geocoding Testing</h4>
      
      <button
        onClick={testLocation}
        disabled={locationLoading}
        style={{
          padding: "12px 24px",
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
          border: "none",
          borderRadius: "4px",
          cursor: locationLoading ? "not-allowed" : "pointer",
          fontSize: "14px",
          opacity: locationLoading ? 0.6 : 1,
          marginBottom: "15px"
        }}
      >
        {locationLoading ? "Getting Location..." : "Test Location & Geocoding"}
      </button>

      {locationError && (
        <div style={{ 
          marginTop: "15px",
          padding: "10px", 
          backgroundColor: "var(--destructive)", 
          border: `1px solid var(--destructive)`, 
          borderRadius: "4px", 
          color: "var(--destructive-foreground)" 
        }}>
          <strong>Location Error:</strong> {locationError}
        </div>
      )}

      {locationInfo && (
        <div style={{ marginTop: "20px", marginBottom: "30px" }}>
          <h5>Location Results</h5>
          <div style={{ 
            border: `1px solid var(--border)`, 
            padding: "15px",
            borderRadius: "4px",
            backgroundColor: "var(--muted)",
            fontFamily: "monospace",
            fontSize: "13px"
          }}>
            <div><strong>Latitude:</strong> {locationInfo.latitude.toFixed(6)}</div>
            <div><strong>Longitude:</strong> {locationInfo.longitude.toFixed(6)}</div>
            <div><strong>Accuracy:</strong> {locationInfo.accuracy.toFixed(0)} meters</div>
            <div><strong>Timestamp:</strong> {locationInfo.timestamp}</div>
            {locationInfo.address && (
              <div style={{ marginTop: "10px" }}>
                <strong>Address:</strong> {locationInfo.address}
                <div style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                  Geocoding: {locationInfo.geocodingSuccess ? "✅ Success" : "❌ Failed"}
                </div>
              </div>
            )}
            <div style={{ marginTop: "10px" }}>
              <a 
                href={`https://www.google.com/maps?q=${locationInfo.latitude},${locationInfo.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--primary)", textDecoration: "underline" }}
              >
                View on Google Maps
              </a>
            </div>
          </div>
          
          <button
            onClick={() => setLocationInfo(null)}
            style={{
              padding: "8px 16px",
              backgroundColor: "var(--destructive)",
              color: "var(--destructive-foreground)",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              marginTop: "10px"
            }}
          >
            Clear Location Data
          </button>
        </div>
      )}

      {/* Restaurant Search Section */}
      <h4>Restaurant Search & Save-to-Plate Testing</h4>
      
      {/* Search Parameters */}
      <div style={{ marginBottom: "20px" }}>
        {/* Search Bar */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "bold" }}>
            Search Query (optional):
          </label>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchRestaurants()}
              placeholder="e.g., Italian restaurant, sushi, coffee shop..."
              style={{
                flex: 1,
                padding: "12px",
                border: `2px solid var(--border)`,
                borderRadius: "6px",
                fontSize: "14px"
              }}
            />
            <button
              onClick={() => searchRestaurants()}
              disabled={!locationInfo || searchLoading}
              style={{
                padding: "12px 24px",
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
                border: "none",
                borderRadius: "6px",
                cursor: (!locationInfo || searchLoading) ? "not-allowed" : "pointer",
                fontSize: "14px",
                opacity: (!locationInfo || searchLoading) ? 0.6 : 1
              }}
            >
              {searchLoading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {/* Search Filters */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "15px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>Radius:</label>
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(e.target.value)}
              style={{ width: "100%", padding: "8px", border: `1px solid var(--border)`, borderRadius: "4px" }}
            >
              <option value="500">500m</option>
              <option value="1000">1km</option>
              <option value="2000">2km</option>
              <option value="5000">5km</option>
              <option value="10000">10km</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>Min Rating:</label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              style={{ width: "100%", padding: "8px", border: `1px solid var(--border)`, borderRadius: "4px" }}
            >
              <option value="any">Any Rating</option>
              <option value="3">3+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>Price Level:</label>
            <select
              value={priceLevel}
              onChange={(e) => setPriceLevel(e.target.value)}
              style={{ width: "100%", padding: "8px", border: `1px solid var(--border)`, borderRadius: "4px" }}
            >
              <option value="any">Any Price</option>
              <option value="budget">Budget ($)</option>
              <option value="moderate">Moderate ($$)</option>
              <option value="expensive">Expensive ($$$)</option>
              <option value="luxury">Luxury ($$$$)</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: "flex", alignItems: "center", fontSize: "12px", fontWeight: "bold" }}>
              <input
                type="checkbox"
                checked={openNow}
                onChange={(e) => setOpenNow(e.target.checked)}
                style={{ marginRight: "8px" }}
              />
              Open Now Only
            </label>
          </div>
        </div>
      </div>

      {/* Restaurant Type Selection */}
      <div style={{ marginBottom: "20px" }}>
        <h5>Restaurant Types:</h5>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "15px" }}>
          {RESTAURANT_TYPES.map((type) => (
            <label key={type.id} style={{ display: "flex", alignItems: "center", fontSize: "13px" }}>
              <input
                type="checkbox"
                checked={selectedTypes.has(type.id)}
                onChange={() => handleTypeToggle(type.id)}
                style={{ marginRight: "8px" }}
              />
              <span style={{ fontWeight: selectedTypes.has(type.id) ? "bold" : "normal" }}>
                {type.label}
              </span>
            </label>
          ))}
        </div>

        {/* Individual Type Test Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px" }}>
          {RESTAURANT_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => searchRestaurants(type.id)}
              disabled={!locationInfo || searchLoading}
              style={{
                padding: "8px 12px",
                backgroundColor: "var(--accent)",
                color: "var(--accent-foreground)",
                border: "none",
                borderRadius: "4px",
                cursor: (!locationInfo || searchLoading) ? "not-allowed" : "pointer",
                fontSize: "12px",
                opacity: (!locationInfo || searchLoading) ? 0.6 : 1
              }}
            >
              Test {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => searchRestaurants()}
          disabled={!locationInfo || searchLoading}
          style={{
            padding: "12px 24px",
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
            border: "none",
            borderRadius: "4px",
            cursor: (!locationInfo || searchLoading) ? "not-allowed" : "pointer",
            fontSize: "14px",
            opacity: (!locationInfo || searchLoading) ? 0.6 : 1
          }}
        >
          {searchLoading ? "Searching..." : "Search Restaurants"}
        </button>
        
        {restaurants.length > 0 && (
          <button
            onClick={clearResults}
            style={{
              padding: "12px 24px",
              backgroundColor: "var(--destructive)",
              color: "var(--destructive-foreground)",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Clear Results
          </button>
        )}
      </div>

      {/* Search Error */}
      {searchError && (
        <div style={{ 
          marginBottom: "20px",
          padding: "10px", 
          backgroundColor: "var(--destructive)", 
          border: `1px solid var(--destructive)`, 
          borderRadius: "4px", 
          color: "var(--destructive-foreground)" 
        }}>
          <strong>Search Error:</strong> {searchError}
        </div>
      )}

      {/* Results Display */}
      {restaurants.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h5>Restaurant Results ({restaurants.length} found)</h5>
          {lastSearchMethod && (
            <p style={{ fontSize: "12px", color: "var(--muted-foreground)", marginBottom: "15px" }}>
              Search method: {lastSearchMethod.replace('_', ' ')}
            </p>
          )}
          
          <div style={{ 
            maxHeight: "600px", 
            overflowY: "auto",
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor: "#f9f9f9"
          }}>
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} style={{ 
                border: "1px solid #ddd",
                margin: "10px",
                padding: "15px",
                borderRadius: "6px",
                backgroundColor: "white"
              }}>
                {/* Restaurant Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <h6 style={{ margin: "0 0 5px 0", fontSize: "16px", fontWeight: "bold", color: "#333" }}>
                      {restaurant.name}
                    </h6>
                    <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>
                      📍 {restaurant.address}
                    </div>
                    
                    {/* Restaurant Details */}
                    <div style={{ fontSize: "12px", color: "#555", display: "flex", flexWrap: "wrap", gap: "15px" }}>
                      {restaurant.rating && (
                        <span>⭐ {restaurant.rating}/5 ({restaurant.user_ratings_total} reviews)</span>
                      )}
                      {restaurant.price_level && (
                        <span>💰 {"$".repeat(restaurant.price_level)}</span>
                      )}
                      {restaurant.distance && (
                        <span>📍 {restaurant.distance.toFixed(2)}km away</span>
                      )}
                    </div>
                    
                    {/* Restaurant Types */}
                    {restaurant.types && restaurant.types.length > 0 && (
                      <div style={{ marginTop: "8px" }}>
                        {restaurant.types.slice(0, 4).map((type: string, typeIndex: number) => (
                          <span key={typeIndex} style={{ 
                            display: "inline-block",
                            backgroundColor: "#e3f2fd",
                            color: "#1976d2",
                            padding: "2px 6px",
                            margin: "2px 4px 2px 0",
                            borderRadius: "12px",
                            fontSize: "11px"
                          }}>
                            {type.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Restaurant Photo */}
                  {restaurant.photos && restaurant.photos.length > 0 && (
                    <img 
                      src={restaurant.photos[0].photo_url} 
                      alt={restaurant.name}
                      style={{ 
                        width: "80px", 
                        height: "80px", 
                        objectFit: "cover", 
                        borderRadius: "6px",
                        marginLeft: "15px"
                      }}
                    />
                  )}
                </div>
                
                {/* Action Buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <a
                      href={restaurant.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#047DD4",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "4px",
                        fontSize: "12px"
                      }}
                    >
                      View on Maps
                    </a>
                  </div>
                  
                  {/* Save to Plate Button */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      onClick={() => saveRestaurantToPlate(restaurant)}
                      disabled={savingRestaurantIds.has(restaurant.id) || savedRestaurantIds.has(restaurant.id)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: savedRestaurantIds.has(restaurant.id) 
                          ? "#28a745" 
                          : savingRestaurantIds.has(restaurant.id) 
                            ? "#6c757d" 
                            : "#329937",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: (savingRestaurantIds.has(restaurant.id) || savedRestaurantIds.has(restaurant.id)) 
                          ? "not-allowed" 
                          : "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                        opacity: (savingRestaurantIds.has(restaurant.id) || savedRestaurantIds.has(restaurant.id)) ? 0.7 : 1
                      }}
                    >
                      {savingRestaurantIds.has(restaurant.id) ? "Saving..." : savedRestaurantIds.has(restaurant.id) ? "✓ Saved" : "Save to Plate"}
                    </button>
                    
                    {/* Save Message */}
                    {saveMessages[restaurant.id] && (
                      <div style={{ 
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "bold",
                        backgroundColor: saveMessages[restaurant.id].includes('✅') ? "#d4edda" : "#f8d7da",
                        color: saveMessages[restaurant.id].includes('✅') ? "#155724" : "#721c24",
                        border: `1px solid ${saveMessages[restaurant.id].includes('✅') ? "#c3e6cb" : "#f5c6cb"}`
                      }}>
                        {saveMessages[restaurant.id]}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Debug Info */}
                <div style={{ 
                  marginTop: "10px", 
                  padding: "8px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                  fontSize: "11px",
                  color: "#6c757d",
                  fontFamily: "monospace"
                }}>
                  ID: {restaurant.id} | Place ID: {restaurant.place_id} | Search: {restaurant.search_method}
                </div>
              </div>
            ))}
          </div>
          
          {/* Save Summary */}
          {savedRestaurantIds.size > 0 && (
            <div style={{
              marginTop: "15px",
              padding: "10px",
              backgroundColor: "#d4edda",
              border: "1px solid #c3e6cb",
              borderRadius: "4px",
              color: "#155724",
              fontSize: "14px",
              fontWeight: "bold"
            }}>
              📋 {savedRestaurantIds.size} restaurant{savedRestaurantIds.size !== 1 ? 's' : ''} saved to plate!
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <BaseDebug 
      title="Scout Page Debug Information" 
      pageSpecificFeatures={scoutTestingFeatures} 
    />
  );
}
