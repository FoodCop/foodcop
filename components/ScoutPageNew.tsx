'use client';

import React, { useState, useCallback, useEffect } from 'react';
import ScoutMapContainerNew from './scout/ScoutMapContainerNew';
import type { Restaurant } from './scout/RestaurantMarkers';

// Restaurant type options (from ScoutDebug)
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

interface LocationInfo {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  address?: string;
}

export default function ScoutPage() {
  // Location state
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Search state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['all']));
  const [searchRadius, setSearchRadius] = useState('2000');
  
  // Route state
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [travelMode, setTravelMode] = useState<'driving' | 'walking' | 'bicycling'>('driving');
  
  // UI state
  const [showSearchPanel, setShowSearchPanel] = useState(true);
  
  // Get user location on mount
  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    
    try {
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

      // Get address
      try {
        const response = await fetch(`/api/debug/google-maps?lat=${geoData.latitude}&lng=${geoData.longitude}`);
        const data = await response.json();
        
        setLocationInfo({
          ...geoData,
          address: data.locationName || data.formatted_address || 'Address not available'
        });
      } catch {
        setLocationInfo(geoData);
      }
      
    } catch (error) {
      const errorMessage = error instanceof GeolocationPositionError 
        ? getGeolocationErrorMessage(error.code)
        : error instanceof Error ? error.message : "Unable to get location";
      setLocationError(errorMessage);
    } finally {
      setLocationLoading(false);
    }
  };

  const searchRestaurants = async () => {
    if (!locationInfo) {
      setSearchError('Please allow location access to search for restaurants');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const typeToSearch = Array.from(selectedTypes)[0] || 'all';
      let apiUrl = `/api/debug/scout-restaurant-search?latitude=${locationInfo.latitude}&longitude=${locationInfo.longitude}&radius=${searchRadius}&type=${typeToSearch}`;
      
      if (searchQuery) {
        apiUrl += `&query=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data.success) {
        setSearchError(data.error || 'Failed to search restaurants');
        return;
      }

      // Convert to Restaurant format
      const formattedRestaurants: Restaurant[] = (data.restaurants || []).map((r: any) => ({
        place_id: r.id,
        name: r.name,
        vicinity: r.address,
        geometry: {
          location: {
            lat: r.latitude,
            lng: r.longitude
          }
        },
        rating: r.rating,
        price_level: r.price_level,
        types: r.types || [],
        photos: r.photos || [],
        opening_hours: r.opening_hours ? {
          open_now: r.opening_hours.open_now
        } : undefined,
        user_ratings_total: r.user_ratings_total
      }));

      setRestaurants(formattedRestaurants);
      
      // Clear previous selection and route
      setSelectedRestaurant(null);
      setShowRoute(false);

    } catch (error) {
      console.error('Restaurant search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRestaurantSelect = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowRoute(true);
    
    // Hide search panel on mobile when showing route
    if (window.innerWidth < 768) {
      setShowSearchPanel(false);
    }
  }, []);

  const handleClearRoute = useCallback(() => {
    setSelectedRestaurant(null);
    setShowRoute(false);
    setShowSearchPanel(true);
  }, []);

  const handleSaveToPlate = useCallback(async (restaurant: Restaurant) => {
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
        // Show success feedback
        console.log('Restaurant saved to plate!');
      } else {
        console.error('Failed to save restaurant:', data.error);
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  }, []);

  return (
    <div className="scout-page">
      {/* Desktop: Sidebar layout */}
      <div className="scout-layout">
        {/* Search sidebar */}
        <div className={`scout-sidebar ${showSearchPanel ? 'open' : 'closed'}`}>
          <div className="search-header">
            <h1>🍽️ Food Scout</h1>
            <p>Discover restaurants near you</p>
            
            {/* Mobile toggle */}
            <button 
              className="mobile-toggle"
              onClick={() => setShowSearchPanel(!showSearchPanel)}
            >
              {showSearchPanel ? '✕' : '🔍'}
            </button>
          </div>

          {/* Location status */}
          {locationLoading && (
            <div className="location-status loading">
              📍 Getting your location...
            </div>
          )}
          
          {locationError && (
            <div className="location-status error">
              ⚠️ {locationError}
              <button onClick={getUserLocation} className="retry-btn">
                Try Again
              </button>
            </div>
          )}

          {locationInfo && (
            <div className="location-info">
              📍 <strong>{locationInfo.address || 'Location found'}</strong>
              <div className="location-accuracy">
                ±{Math.round(locationInfo.accuracy)}m accuracy
              </div>
            </div>
          )}

          {/* Search form */}
          <div className="search-form">
            <div className="search-input-group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchRestaurants()}
                placeholder="Search restaurants, cuisine, or dishes..."
                className="search-input"
              />
              <button
                onClick={searchRestaurants}
                disabled={!locationInfo || searchLoading}
                className="search-btn"
              >
                {searchLoading ? '⏳' : '🔍'}
              </button>
            </div>

            {/* Quick filters */}
            <div className="quick-filters">
              <label>Distance:</label>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(e.target.value)}
                className="filter-select"
              >
                <option value="500">500m</option>
                <option value="1000">1km</option>
                <option value="2000">2km</option>
                <option value="5000">5km</option>
              </select>
            </div>

            {/* Restaurant type filter */}
            <div className="type-filter">
              <label>Type:</label>
              <select
                value={Array.from(selectedTypes)[0] || 'all'}
                onChange={(e) => setSelectedTypes(new Set([e.target.value]))}
                className="filter-select"
              >
                {RESTAURANT_TYPES.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search error */}
          {searchError && (
            <div className="search-error">
              ❌ {searchError}
            </div>
          )}

          {/* Current route info */}
          {showRoute && selectedRestaurant && (
            <div className="current-route">
              <div className="route-header">
                <h3>📍 Route to:</h3>
                <button onClick={handleClearRoute} className="clear-route">
                  ✕
                </button>
              </div>
              <div className="route-restaurant">
                <strong>{selectedRestaurant.name}</strong>
                <div className="restaurant-details">
                  {selectedRestaurant.rating && (
                    <span>⭐ {selectedRestaurant.rating.toFixed(1)}</span>
                  )}
                  {selectedRestaurant.price_level && (
                    <span>💰 {'$'.repeat(selectedRestaurant.price_level)}</span>
                  )}
                </div>
              </div>
              
              {/* Travel mode selector */}
              <div className="travel-modes">
                {(['driving', 'walking', 'bicycling'] as const).map(mode => (
                  <button
                    key={mode}
                    className={`travel-mode ${travelMode === mode ? 'active' : ''}`}
                    onClick={() => setTravelMode(mode)}
                  >
                    {mode === 'driving' && '🚗'}
                    {mode === 'walking' && '🚶'}
                    {mode === 'bicycling' && '🚴'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Restaurant results list */}
          {restaurants.length > 0 && !showRoute && (
            <div className="restaurant-list">
              <div className="results-header">
                <h3>🍽️ Found {restaurants.length} restaurants</h3>
                <button 
                  onClick={() => setRestaurants([])}
                  className="clear-results"
                >
                  Clear
                </button>
              </div>
              
              <div className="restaurant-cards">
                {restaurants.map((restaurant) => (
                  <div 
                    key={restaurant.place_id} 
                    className="restaurant-card"
                    onClick={() => handleRestaurantSelect(restaurant)}
                  >
                    <div className="card-header">
                      <h4>{restaurant.name}</h4>
                      <div className="card-details">
                        {restaurant.rating && (
                          <span className="rating">⭐ {restaurant.rating.toFixed(1)}</span>
                        )}
                        {restaurant.price_level && (
                          <span className="price">{'$'.repeat(restaurant.price_level)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="card-address">
                      📍 {restaurant.vicinity}
                    </div>
                    
                    {restaurant.opening_hours && (
                      <div className={`status ${restaurant.opening_hours.open_now ? 'open' : 'closed'}`}>
                        {restaurant.opening_hours.open_now ? '🟢 Open now' : '🔴 Closed'}
                      </div>
                    )}
                    
                    <div className="card-action">
                      <span>👆 Tap to see route</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Map area */}
        <div className="scout-map-area">
          <ScoutMapContainerNew
            restaurants={selectedRestaurant ? [selectedRestaurant] : []}
            selectedRestaurant={selectedRestaurant}
            onRestaurantSelect={handleRestaurantSelect}
            onSaveToPlate={handleSaveToPlate}
            showRoute={showRoute}
            routeDestination={selectedRestaurant ? {
              lat: selectedRestaurant.geometry.location.lat,
              lng: selectedRestaurant.geometry.location.lng,
              name: selectedRestaurant.name
            } : undefined}
            travelMode={travelMode}
            className="scout-map"
          />
        </div>
      </div>
    </div>
  );
}

function getGeolocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return "Location access denied. Please enable location in your browser.";
    case 2:
      return "Location unavailable. Please check your GPS.";
    case 3:
      return "Location request timed out. Please try again.";
    default:
      return "Location error. Please try again.";
  }
}
