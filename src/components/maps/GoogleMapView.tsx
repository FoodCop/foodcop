import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { loadGoogleMapsScript } from '../../utils/googleMapsLoader';
import {
  MapMarker,
  createUserLocationIcon,
  createRestaurantMarkerIcon,
  fitMapBounds,
  decodePolyline,
} from './mapUtils';

export interface GoogleMapViewProps {
  /** Center coordinates for the map */
  center: google.maps.LatLngLiteral;
  /** Initial zoom level (1-20) */
  zoom?: number;
  /** Array of markers to display */
  markers?: MapMarker[];
  /** User location marker */
  userLocation?: google.maps.LatLngLiteral;
  /** Selected marker ID */
  selectedMarkerId?: string;
  /** Callback when a marker is clicked */
  onMarkerClick?: (markerId: string, data?: unknown) => void;
  /** Callback when the map is clicked */
  onMapClick?: () => void;
  /** Callback when map bounds change */
  onBoundsChanged?: (bounds: google.maps.LatLngBounds) => void;
  /** Route polyline (encoded string or array of coordinates) */
  route?: string | google.maps.LatLngLiteral[];
  /** Whether to enable marker clustering */
  enableClustering?: boolean;
  /** Map container class name */
  className?: string;
  /** Map height */
  height?: string;
  /** Whether to show zoom controls */
  showZoomControls?: boolean;
  /** Whether to show map type controls */
  showMapTypeControls?: boolean;
  /** Whether to show street view controls */
  showStreetViewControls?: boolean;
  /** Map type ID */
  mapTypeId?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
}

/**
 * GoogleMapView Component
 * Renders an interactive Google Map with markers, user location, and routes
 */
export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  center,
  zoom = 14,
  markers = [],
  userLocation,
  selectedMarkerId,
  onMarkerClick,
  onMapClick,
  onBoundsChanged,
  route,
  enableClustering = false,
  className = '',
  height = '100%',
  showZoomControls = true,
  showMapTypeControls = false,
  showStreetViewControls = false,
  mapTypeId = 'roadmap',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        // Use centralized script loader to prevent multiple loads
        await loadGoogleMapsScript();
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load Google Maps:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Google Maps');
      }
    };

    initMap();
  }, []);

  // Create map instance
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    // Double-check that google.maps.Map is fully loaded
    if (!window.google?.maps?.Map) {
      console.warn('Google Maps API not fully loaded yet, retrying...');
      // Retry after a short delay
      const timeoutId = setTimeout(() => {
        if (window.google?.maps?.Map && mapRef.current && !mapInstanceRef.current) {
          const mapOptions: google.maps.MapOptions = {
            center,
            zoom,
            mapTypeId,
            zoomControl: showZoomControls,
            mapTypeControl: showMapTypeControls,
            streetViewControl: showStreetViewControls,
            fullscreenControl: false,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }],
              },
            ],
          };

          try {
            mapInstanceRef.current = new google.maps.Map(mapRef.current, mapOptions);

            // Add map click listener
            if (onMapClick) {
              mapInstanceRef.current.addListener('click', onMapClick);
            }

            // Add bounds changed listener
            if (onBoundsChanged) {
              mapInstanceRef.current.addListener('bounds_changed', () => {
                const bounds = mapInstanceRef.current?.getBounds();
                if (bounds) {
                  onBoundsChanged(bounds);
                }
              });
            }

            // Initialize info window
            infoWindowRef.current = new google.maps.InfoWindow();
          } catch (err) {
            console.error('Error creating map instance:', err);
            setError(err instanceof Error ? err.message : 'Failed to create map');
          }
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }

    // Verify google.maps.Map is available before creating map
    if (!window.google?.maps?.Map) {
      console.error('Google Maps Map constructor not available');
      setError('Google Maps API not fully loaded');
      return;
    }

    const mapOptions: google.maps.MapOptions = {
      center,
      zoom,
      mapTypeId,
      zoomControl: showZoomControls,
      mapTypeControl: showMapTypeControls,
      streetViewControl: showStreetViewControls,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    };

    try {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, mapOptions);

      // Add map click listener
      if (onMapClick) {
        mapInstanceRef.current.addListener('click', onMapClick);
      }

      // Add bounds changed listener
      if (onBoundsChanged) {
        mapInstanceRef.current.addListener('bounds_changed', () => {
          const bounds = mapInstanceRef.current?.getBounds();
          if (bounds) {
            onBoundsChanged(bounds);
          }
        });
      }

      // Initialize info window
      infoWindowRef.current = new google.maps.InfoWindow();
    } catch (err) {
      console.error('Error creating map instance:', err);
      setError(err instanceof Error ? err.message : 'Failed to create map');
    }
  }, [isLoaded, center, zoom, mapTypeId, showZoomControls, showMapTypeControls, showStreetViewControls, onMapClick, onBoundsChanged]);

  // Update map center
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(center);
    }
  }, [center]);

  // Update user location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;

    // Remove old user marker safely
    if (userMarkerRef.current) {
      try {
        userMarkerRef.current.setMap(null);
      } catch (err) {
        console.warn('Error removing user marker:', err);
      }
    }

    // Create new user marker
    userMarkerRef.current = new google.maps.Marker({
      position: userLocation,
      map: mapInstanceRef.current,
      icon: createUserLocationIcon(),
      title: 'Your Location',
      zIndex: 1000,
    });
  }, [userLocation]);

  // Update restaurant markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear old markers safely
    for (const marker of markersRef.current) {
      try {
        if (marker) {
          marker.setMap(null);
        }
      } catch (err) {
        console.warn('Error removing marker:', err);
      }
    }
    markersRef.current = [];

    // Clear clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }

    // Create new markers
    const newMarkers = markers.map(markerData => {
      const isSelected = markerData.id === selectedMarkerId;
      
      const marker = new google.maps.Marker({
        position: markerData.position,
        map: mapInstanceRef.current,
        icon: markerData.icon || createRestaurantMarkerIcon(isSelected),
        title: markerData.title,
        zIndex: isSelected ? 999 : undefined,
      });

      // Add click listener
      marker.addListener('click', () => {
        if (onMarkerClick) {
          onMarkerClick(markerData.id, markerData.data);
        }

        // Show info window
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div style="padding: 8px;">
              <strong>${markerData.title}</strong>
            </div>
          `);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        }
      });

      return marker;
    });

    markersRef.current = newMarkers;

    // Enable clustering if requested
    if (enableClustering && newMarkers.length > 0) {
      clustererRef.current = new MarkerClusterer({
        map: mapInstanceRef.current,
        markers: newMarkers,
      });
    }

    // Fit bounds to show all markers - always include user location
    if (markers.length > 0 && !route) {
      const allMarkers = [...markers];
      // Always include user location in bounds
      if (userLocation) {
        allMarkers.push({
          id: 'user',
          position: userLocation,
          title: 'Your Location',
        });
      }
      fitMapBounds(mapInstanceRef.current, allMarkers);
    } else if (userLocation && markers.length === 0 && !route) {
      // If no markers, center on user
      mapInstanceRef.current.panTo(userLocation);
    }
  }, [markers, selectedMarkerId, onMarkerClick, enableClustering, userLocation, route]);

  // Update route polyline
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove old polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (!route) return;

    // Decode route if it's a string
    const path = typeof route === 'string' ? decodePolyline(route) : route;

    // Create polyline
    polylineRef.current = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map: mapInstanceRef.current,
    });

    // Fit bounds to show entire route
    if (path.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      for (const point of path) {
        bounds.extend(point);
      }
      mapInstanceRef.current.fitBounds(bounds, 50);
    }
  }, [route]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const marker of markersRef.current) {
        marker.setMap(null);
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, []);

  // Re-center map method
  const recenterMap = useCallback(() => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.panTo(userLocation);
      mapInstanceRef.current.setZoom(zoom);
    }
  }, [userLocation, zoom]);

  // Listen for recenter events
  useEffect(() => {
    const handleRecenter = (event: CustomEvent<{ lat: number; lng: number }>) => {
      if (mapInstanceRef.current && event.detail) {
        mapInstanceRef.current.panTo({ lat: event.detail.lat, lng: event.detail.lng });
        mapInstanceRef.current.setZoom(14);
      }
    };

    window.addEventListener('recenter-map', handleRecenter as EventListener);
    return () => {
      window.removeEventListener('recenter-map', handleRecenter as EventListener);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear markers safely
      try {
        for (const marker of markersRef.current) {
          if (marker && mapInstanceRef.current) {
            marker.setMap(null);
          }
        }
        markersRef.current = [];

        // Clear user marker
        if (userMarkerRef.current && mapInstanceRef.current) {
          userMarkerRef.current.setMap(null);
          userMarkerRef.current = null;
        }

        // Clear clusterer
        if (clustererRef.current) {
          clustererRef.current.clearMarkers();
          clustererRef.current = null;
        }

        // Clear info window
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
          infoWindowRef.current = null;
        }

        // Clear polyline
        if (polylineRef.current && mapInstanceRef.current) {
          polylineRef.current.setMap(null);
          polylineRef.current = null;
        }

        // Don't destroy the map instance itself - let it be garbage collected
        mapInstanceRef.current = null;
      } catch (err) {
        console.warn('Error during map cleanup:', err);
      }
    };
  }, []);

  // Expose recenter method via ref
  useEffect(() => {
    if (mapRef.current) {
      (mapRef.current as unknown as { recenterMap?: () => void }).recenterMap = recenterMap;
    }
  }, [recenterMap]);

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ height }}
      >
        <div className="text-center p-4">
          <p className="text-red-600 font-semibold mb-2">Map Error</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-600 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={className}
      style={{ width: '100%', height }}
    />
  );
};

export default GoogleMapView;
