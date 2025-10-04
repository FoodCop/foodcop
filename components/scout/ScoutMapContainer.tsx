'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { mapClasses, type MapViewState } from '@/lib/scout/mapLibreConfig';
import { getCurrentUserLocation, type LocationInfo, type GeolocationError } from '@/lib/scout/locationService';

// Dynamic import of MapLibre component with SSR disabled
const MapLibreMap = dynamic(
  () => import('./MapLibreMap').then((mod) => mod.MapLibreMap),
  {
    ssr: false,
    loading: () => (
      <div className={`${mapClasses.loading} scout-map-loading`}>
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            flexDirection: 'column',
            gap: '15px',
            color: '#6c757d'
          }}
        >
          <div 
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid #329937',
              borderTop: '4px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            Loading Interactive Map...
          </div>
          <div style={{ fontSize: '14px', textAlign: 'center', maxWidth: '300px' }}>
            Initializing MapLibre GL JS for restaurant discovery and navigation
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    ),
  }
);

// Dynamic import of UserLocationMarker with SSR disabled
const UserLocationMarker = dynamic(
  () => import('./UserLocationMarker').then((mod) => mod.UserLocationMarker),
  { ssr: false }
);

export interface ScoutMapContainerProps {
  userLocation?: { latitude: number; longitude: number };
  restaurants?: any[];
  selectedRestaurant?: any;
  routeData?: any;
  onRestaurantClick?: (restaurant: any) => void;
  onMapClick?: (event: any) => void;
  onViewStateChange?: (viewState: MapViewState) => void;
  onLocationFound?: (location: LocationInfo) => void;
  onLocationError?: (error: GeolocationError) => void;
  autoLocateUser?: boolean;
  showLocationAccuracy?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ScoutMapContainer: React.FC<ScoutMapContainerProps> = ({
  userLocation,
  restaurants = [],
  selectedRestaurant,
  routeData,
  onRestaurantClick,
  onMapClick,
  onViewStateChange,
  onLocationFound,
  onLocationError,
  autoLocateUser = true,
  showLocationAccuracy = true,
  className = '',
  style = { width: '100%', height: '400px' }
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<Error | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<GeolocationError | null>(null);

  // Function to get user's current location
  const locateUser = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      const location = await getCurrentUserLocation();
      setCurrentLocation(location);
      console.log('User location found:', location);
      
      // Call parent callback if provided
      if (onLocationFound) {
        onLocationFound(location);
      }
    } catch (error) {
      const geoError = error as GeolocationError;
      console.error('Location error:', geoError);
      setLocationError(geoError);
      
      // Call parent callback if provided
      if (onLocationError) {
        onLocationError(geoError);
      }
    } finally {
      setLocationLoading(false);
    }
  }, [onLocationFound, onLocationError]);

  // Auto-locate user when component mounts
  useEffect(() => {
    if (autoLocateUser && !currentLocation && !userLocation) {
      locateUser();
    }
  }, [autoLocateUser, currentLocation, userLocation, locateUser]);

  // Get effective user location (prop or detected location)
  const effectiveUserLocation = userLocation || (currentLocation ? {
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude
  } : null);

  // Handle map load event
  const handleMapLoad = useCallback((map: any) => {
    setMapLoaded(true);
    console.log('Scout map container: Map loaded successfully');
    
    // Here we can add initial data loading or setup
    if (restaurants.length > 0) {
      console.log(`Scout map: ${restaurants.length} restaurants ready to display`);
    }
  }, [restaurants]);

  // Handle map click events
  const handleMapClick = useCallback((event: any) => {
    console.log('Scout map clicked:', event.lngLat);
    
    // Call parent click handler if provided
    if (onMapClick) {
      onMapClick(event);
    }
    
    // Clear selected restaurant on map click (if not clicking a marker)
    if (onRestaurantClick && selectedRestaurant) {
      // This will be enhanced when we add restaurant markers
      console.log('Map click - could clear selection');
    }
  }, [onMapClick, onRestaurantClick, selectedRestaurant]);

  // Handle view state changes (pan, zoom, etc.) - throttled to reduce spam
  const handleViewStateChange = useCallback((viewState: MapViewState) => {
    // Log all zoom changes to debug the issue
    console.log('Scout map view state changed:', { 
      center: [Math.round(viewState.longitude * 10000) / 10000, Math.round(viewState.latitude * 10000) / 10000], 
      zoom: Math.round(viewState.zoom * 100) / 100,
      source: 'user interaction or animation'
    });
    
    if (onViewStateChange) {
      onViewStateChange(viewState);
    }
  }, [onViewStateChange]);

  // Handle map errors
  const handleMapError = useCallback((error: Error) => {
    setMapError(error);
    console.error('Scout map container error:', error);
  }, []);

  return (
    <div 
      className={`${mapClasses.container} ${className}`}
      style={style}
    >
      <MapLibreMap
        userLocation={effectiveUserLocation || undefined}
        onMapLoad={handleMapLoad}
        onViewStateChange={handleViewStateChange}
        onMapClick={handleMapClick}
        onMapError={handleMapError}
        style={{ width: '100%', height: '100%' }}
        className={mapClasses.map}
      >
        {/* User Location Marker */}
        {effectiveUserLocation && (
          <UserLocationMarker
            latitude={effectiveUserLocation.latitude}
            longitude={effectiveUserLocation.longitude}
            accuracy={currentLocation?.accuracy}
            address={currentLocation?.address}
            showAccuracyCircle={showLocationAccuracy}
            onClick={() => {
              console.log('User location clicked:', effectiveUserLocation);
              if (currentLocation) {
                console.log('Full location info:', currentLocation);
              }
            }}
          />
        )}
      </MapLibreMap>
      
      {/* Map status indicators */}
      {mapLoaded && (
        <div 
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            backgroundColor: 'rgba(50, 153, 55, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000
          }}
        >
          Map Ready
        </div>
      )}
      
      {mapError && (
        <div 
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            backgroundColor: 'rgba(220, 38, 38, 0.9)',
            color: 'white',
            padding: '10px',
            borderRadius: '6px',
            fontSize: '14px',
            zIndex: 1000
          }}
        >
          <strong>Map Error:</strong> {mapError.message}
          <button 
            onClick={() => setMapError(null)}
            style={{
              marginLeft: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              padding: '2px 6px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Location Status and Controls */}
      {locationLoading && (
        <div 
          style={{
            position: 'absolute',
            top: '50px',
            left: '10px',
            backgroundColor: 'rgba(59, 130, 246, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <div 
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          Finding your location...
        </div>
      )}

      {locationError && (
        <div 
          style={{
            position: 'absolute',
            top: '50px',
            left: '10px',
            right: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            color: 'white',
            padding: '10px',
            borderRadius: '6px',
            fontSize: '13px',
            zIndex: 1000
          }}
        >
          <strong>Location Error:</strong> {locationError.message}
          <button 
            onClick={() => setLocationError(null)}
            style={{
              marginLeft: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              padding: '2px 6px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {currentLocation && !locationLoading && (
        <div 
          style={{
            position: 'absolute',
            top: '50px',
            left: '10px',
            backgroundColor: 'rgba(34, 197, 94, 0.9)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            zIndex: 1000,
            maxWidth: '250px'
          }}
        >
          📍 {currentLocation.address || `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
          {currentLocation.accuracy && (
            <div style={{ fontSize: '10px', opacity: 0.8 }}>
              ±{Math.round(currentLocation.accuracy)}m accuracy
            </div>
          )}
        </div>
      )}

      {/* Manual Location Button */}
      {!locationLoading && !effectiveUserLocation && (
        <button
          onClick={locateUser}
          style={{
            position: 'absolute',
            top: '50px',
            left: '10px',
            backgroundColor: 'rgba(59, 130, 246, 0.9)',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📍 Find My Location
        </button>
      )}
      
      {/* Future feature indicators */}
      {restaurants.length > 0 && mapLoaded && (
        <div 
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            backgroundColor: 'rgba(4, 125, 212, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000
          }}
        >
          {restaurants.length} Restaurants Ready
        </div>
      )}
      
      {selectedRestaurant && (
        <div 
          style={{
            position: 'absolute',
            bottom: '35px',
            right: '10px',
            backgroundColor: 'rgba(255, 126, 39, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000
          }}
        >
          Selected: {selectedRestaurant.name || 'Restaurant'}
        </div>
      )}
      
      {routeData && (
        <div 
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(50, 153, 55, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000
          }}
        >
          Route Active
        </div>
      )}
    </div>
  );
};

export default ScoutMapContainer;