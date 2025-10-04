'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import Map, { 
  NavigationControl, 
  ScaleControl, 
  FullscreenControl, 
  GeolocateControl,
  MapRef 
} from 'react-map-gl/maplibre';
import { mapConfig, mapStyles, getInitialViewState, brandColors, type MapViewState } from '@/lib/scout/mapLibreConfig';

export interface MapLibreMapProps {
  userLocation?: { latitude: number; longitude: number };
  onMapLoad?: (map: MapRef) => void;
  onViewStateChange?: (viewState: MapViewState) => void;
  onMapClick?: (event: any) => void;
  onMapError?: (error: Error) => void;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}

export const MapLibreMap: React.FC<MapLibreMapProps> = ({
  userLocation,
  onMapLoad,
  onViewStateChange,
  onMapClick,
  onMapError,
  style = { width: '100%', height: '400px' },
  className = '',
  children
}) => {
  const mapRef = useRef<MapRef>(null);
  const hasFlownToUserLocation = useRef(false);
  const [mapStyle, setMapStyle] = useState(mapConfig.defaultStyle);
  const [viewState, setViewState] = useState<MapViewState>(
    getInitialViewState(userLocation)
  );
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<Error | null>(null);

  // Update view state when user location changes (only once)
  useEffect(() => {
    if (userLocation && mapRef.current && mapLoaded && !hasFlownToUserLocation.current) {
      // Get current map state for debugging
      const currentCenter = mapRef.current.getCenter();
      const currentZoom = mapRef.current.getZoom();
      console.log('Current map state before animation:', {
        center: [currentCenter.lng, currentCenter.lat],
        zoom: currentZoom
      });
      
      // Target location
      const newViewState = getInitialViewState(userLocation);
      console.log('Animating to user location:', newViewState);
      
      // Mark that we've flown to user location to prevent loops
      hasFlownToUserLocation.current = true;
      
      // Use smooth easeTo animation (confirmed working coordinates)
      mapRef.current.easeTo({
        center: [newViewState.longitude, newViewState.latitude],
        zoom: newViewState.zoom,
        pitch: newViewState.pitch,
        bearing: newViewState.bearing,
        duration: 2000, // 2 second smooth animation
        essential: true
      });
      
      console.log('Smooth animation started to user location');
      
      setTimeout(() => {
        if (mapRef.current) {
          const finalCenter = mapRef.current.getCenter();
          const finalZoom = mapRef.current.getZoom();
          console.log('Animation completed - final state:', {
            center: [Math.round(finalCenter.lng * 10000) / 10000, Math.round(finalCenter.lat * 10000) / 10000],
            zoom: Math.round(finalZoom * 100) / 100
          });
        }
      }, 2100);
    }
  }, [userLocation, mapLoaded]);

  // Reset the flag when userLocation changes (for new location detection)
  useEffect(() => {
    hasFlownToUserLocation.current = false;
  }, [userLocation?.latitude, userLocation?.longitude]);

  // Handle map load event
  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
    console.log('MapLibre map loaded successfully with style:', mapStyle);
    
    if (onMapLoad && mapRef.current) {
      onMapLoad(mapRef.current);
    }
  }, [onMapLoad, mapStyle]);

  // Handle view state changes
  const handleViewStateChange = useCallback((evt: any) => {
    const newViewState = evt.viewState;
    // No longer need to call setViewState since we're using initialViewState
    
    if (onViewStateChange) {
      onViewStateChange(newViewState);
    }
  }, [onViewStateChange]);

  // Handle map click events
  const handleMapClick = useCallback((event: any) => {
    console.log('Map clicked at:', event.lngLat);
    if (onMapClick) {
      onMapClick(event);
    }
  }, [onMapClick]);

  // Handle map errors
  const handleMapError = useCallback((event: any) => {
    const error = new Error(`Map error: ${event.error?.message || 'Unknown map error'}`);
    console.error('MapLibre error:', error);
    setMapError(error);
    
    if (onMapError) {
      onMapError(error);
    }
  }, [onMapError]);

  // Style switcher function (will be used by MapControls component)
  const switchMapStyle = useCallback((styleName: keyof typeof mapStyles) => {
    const newStyle = mapStyles[styleName];
    if (newStyle) {
      setMapStyle(newStyle.url);
      console.log(`Switched to ${newStyle.label} map style`);
    }
  }, []);

  // Expose map methods via ref (for parent components)
  const getMapInstance = useCallback(() => {
    return mapRef.current?.getMap();
  }, []);

  const flyToLocation = useCallback((options: any) => {
    const map = mapRef.current?.getMap();
    if (map) {
      map.flyTo(options);
    }
  }, []);

  const fitMapBounds = useCallback((bounds: any, options?: any) => {
    const map = mapRef.current?.getMap();
    if (map) {
      map.fitBounds(bounds, options);
    }
  }, []);

  // Error state display
  if (mapError) {
    return (
      <div 
        className={`scout-map-error ${className}`}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          color: brandColors.error
        }}
      >
        <div className="error-content" style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🗺️</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
            Map Loading Error
          </div>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>
            {mapError.message}
          </div>
          <button 
            onClick={() => {
              setMapError(null);
              window.location.reload();
            }}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: brandColors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`scout-map-container ${className}`} style={style}>
      <Map
        ref={mapRef}
        initialViewState={viewState}
        onMove={handleViewStateChange}
        onClick={handleMapClick}
        onLoad={handleMapLoad}
        onError={handleMapError}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
        maxZoom={mapConfig.performance.maxZoom}
        minZoom={mapConfig.performance.minZoom}
        cursor="default"
        doubleClickZoom={false}
      >
        {/* Navigation Controls (zoom, rotate) */}
        {mapConfig.controls.navigation && (
          <NavigationControl 
            position="top-right" 
            showCompass={true}
            showZoom={true}
          />
        )}

        {/* Scale Control */}
        {mapConfig.controls.scale && (
          <ScaleControl 
            position="bottom-left"
            maxWidth={100}
            unit="metric"
          />
        )}

        {/* Fullscreen Control */}
        {mapConfig.controls.fullscreen && (
          <FullscreenControl position="top-right" />
        )}

        {/* Geolocation Control */}
        {mapConfig.controls.geolocate && (
          <GeolocateControl
            position="top-right"
            trackUserLocation={true}
            showAccuracyCircle={true}
            style={{
              backgroundColor: brandColors.primary,
              color: 'white'
            }}
          />
        )}

        {/* Loading indicator */}
        {!mapLoaded && (
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              zIndex: 1000
            }}
          >
            <div 
              style={{
                width: '40px',
                height: '40px',
                border: `3px solid ${brandColors.primary}`,
                borderTop: '3px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 10px auto'
              }}
            />
            <div style={{ fontSize: '14px', color: '#666' }}>Loading Map...</div>
          </div>
        )}

        {/* Render child components (markers, popups, etc.) */}
        {children}
      </Map>

      {/* Add CSS animation for loading spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .scout-map-container {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
        }
        
        .scout-map-container .maplibregl-map {
          border-radius: 8px;
        }
        
        .scout-map-container .maplibregl-ctrl-group {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        .scout-map-container .maplibregl-ctrl-group button {
          background-color: white;
          border: none;
        }
        
        .scout-map-container .maplibregl-ctrl-group button:hover {
          background-color: ${brandColors.primary};
          color: white;
        }
      `}</style>
    </div>
  );
};

export default MapLibreMap;