'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { mapClasses, type MapViewState } from '@/lib/scout/mapLibreConfig';
import { getCurrentUserLocation, type LocationInfo, type GeolocationError } from '@/lib/scout/locationService';
import RestaurantMarkers from './RestaurantMarkers';
import RouteDisplay from './RouteDisplay';
import type { Restaurant } from './RestaurantMarkers';

// Dynamic import of MapLibre component with SSR disabled
const MapLibreMap = dynamic(
  () => import('./MapLibreMap').then((mod) => mod.MapLibreMap),
  {
    ssr: false,
    loading: () => (
      <div className={`${mapClasses.loading} scout-map-loading`}>
        <div className="loading-content">
          <div className="loading-spinner" />
          <div className="loading-title">Loading Interactive Map...</div>
          <div className="loading-description">
            Initializing MapLibre GL JS for restaurant discovery and navigation
          </div>
        </div>
      </div>
    ),
  }
);

interface ScoutMapContainerProps {
  restaurants?: Restaurant[];
  selectedRestaurant?: Restaurant | null;
  onRestaurantSelect?: (restaurant: Restaurant) => void;
  onSaveToPlate?: (restaurant: Restaurant) => void;
  showRoute?: boolean;
  routeDestination?: { lat: number; lng: number; name?: string };
  travelMode?: 'driving' | 'walking' | 'bicycling' | 'transit';
  className?: string;
}

export default function ScoutMapContainer({
  restaurants = [],
  selectedRestaurant,
  onRestaurantSelect,
  onSaveToPlate,
  showRoute = false,
  routeDestination,
  travelMode = 'driving',
  className = ''
}: ScoutMapContainerProps) {
  // Map state
  const [viewState, setViewState] = useState<MapViewState>({
    longitude: -73.935242,
    latitude: 40.730610,
    zoom: 13,
    bearing: 0,
    pitch: 0
  });

  // Location state
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [locationError, setLocationError] = useState<GeolocationError | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Route state
  const [routeBounds, setRouteBounds] = useState<[[number, number], [number, number]] | null>(null);

  // Get user location on mount
  useEffect(() => {
    const getLocation = async () => {
      setIsLoadingLocation(true);
      setLocationError(null);
      
      try {
        const location = await getCurrentUserLocation();
        setLocationInfo(location);
        
        // Update map center to user location
        setViewState(prev => ({
          ...prev,
          longitude: location.longitude,
          latitude: location.latitude,
          zoom: 15
        }));
      } catch (error) {
        console.error('Failed to get user location:', error);
        setLocationError(error as GeolocationError);
        
        // Fallback to NYC coordinates
        setViewState(prev => ({
          ...prev,
          longitude: -73.935242,
          latitude: 40.730610,
          zoom: 13
        }));
      } finally {
        setIsLoadingLocation(false);
      }
    };

    getLocation();
  }, []);

  const handleViewStateChange = useCallback((newViewState: MapViewState) => {
    setViewState(newViewState);
  }, []);

  const handleRestaurantClick = useCallback((restaurant: Restaurant) => {
    onRestaurantSelect?.(restaurant);
    
    // Center map on selected restaurant
    setViewState(prev => ({
      ...prev,
      longitude: restaurant.geometry.location.lng,
      latitude: restaurant.geometry.location.lat,
      zoom: Math.max(prev.zoom, 16)
    }));
  }, [onRestaurantSelect]);

  const handleRouteBoundsChange = useCallback((bounds: [[number, number], [number, number]]) => {
    setRouteBounds(bounds);
  }, []);

  const userLocation = locationInfo ? {
    lat: locationInfo.latitude,
    lng: locationInfo.longitude
  } : undefined;

  const routeOrigin = userLocation && showRoute ? userLocation : undefined;
  const routeDestinationData = showRoute && routeDestination ? routeDestination : 
    (showRoute && selectedRestaurant ? {
      lat: selectedRestaurant.geometry.location.lat,
      lng: selectedRestaurant.geometry.location.lng,
      name: selectedRestaurant.name
    } : undefined);

  return (
    <div className={`scout-map-container ${className}`}>
      {/* Loading and error states */}
      {isLoadingLocation && (
        <div className="location-status loading">
          <span className="status-icon">📍</span>
          Getting your location...
        </div>
      )}
      
      {locationError && (
        <div className="location-status error">
          <span className="status-icon">⚠️</span>
          {locationError.message}
          {locationError.code === 1 && (
            <div className="error-help">
              Please enable location access in your browser settings
            </div>
          )}
        </div>
      )}

      {/* Main map component */}
      <MapLibreMap
        userLocation={userLocation ? {
          latitude: userLocation.lat,
          longitude: userLocation.lng
        } : undefined}
        onViewStateChange={handleViewStateChange}
        className="scout-map-inner"
      >
        {/* Restaurant markers */}
        {restaurants.length > 0 && (
          <RestaurantMarkers
            restaurants={restaurants}
            userLocation={userLocation}
            onMarkerClick={handleRestaurantClick}
            onSaveToPlate={onSaveToPlate}
            selectedRestaurant={selectedRestaurant}
            showClusters={true}
          />
        )}

        {/* Route display */}
        {showRoute && routeOrigin && routeDestinationData && (
          <RouteDisplay
            origin={routeOrigin}
            destination={routeDestinationData}
            travelMode={travelMode}
            onBoundsChange={handleRouteBoundsChange}
            showDirections={false}
            className="scout-route"
          />
        )}
      </MapLibreMap>

      {/* Map controls overlay */}
      <div className="map-controls-overlay">
        {/* Travel mode selector when route is active */}
        {showRoute && (
          <div className="travel-mode-selector">
            {(['driving', 'walking', 'bicycling'] as const).map(mode => (
              <button
                key={mode}
                className={`travel-mode-btn ${travelMode === mode ? 'active' : ''}`}
                onClick={() => {
                  // This would need to be handled by parent component
                  // onTravelModeChange?.(mode);
                }}
                title={mode.charAt(0).toUpperCase() + mode.slice(1)}
              >
                {mode === 'driving' && '🚗'}
                {mode === 'walking' && '🚶'}
                {mode === 'bicycling' && '🚴'}
              </button>
            ))}
          </div>
        )}
        
        {/* Location accuracy indicator */}
        {locationInfo && (
          <div className="location-accuracy">
            <span className="accuracy-icon">📍</span>
            <span className="accuracy-text">
              ±{Math.round(locationInfo.accuracy)}m
            </span>
          </div>
        )}
      </div>
    </div>
  );
}