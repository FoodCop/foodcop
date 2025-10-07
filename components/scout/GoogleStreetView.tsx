'use client';

import React, { useEffect, useRef } from 'react';

interface GoogleStreetViewProps {
  latitude: number;
  longitude: number;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    initGoogleStreetView: () => void;
  }
}

export const GoogleStreetView: React.FC<GoogleStreetViewProps> = ({
  latitude,
  longitude,
  className = '',
  style = { width: '100%', height: '100%' }
}) => {
  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<any>(null);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initStreetView();
        return;
      }

      // Load Google Maps JavaScript API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      window.initGoogleStreetView = () => {
        initStreetView();
      };
      
      script.onload = () => {
        if (window.google && window.google.maps) {
          initStreetView();
        }
      };
      
      document.head.appendChild(script);
    };

    const initStreetView = () => {
      if (!streetViewRef.current || !window.google || !window.google.maps) {
        console.error('Street View container or Google Maps not available');
        return;
      }

      try {
        const position = new window.google.maps.LatLng(latitude, longitude);
        
        // Check if Street View is available at this location
        const streetViewService = new window.google.maps.StreetViewService();
        
        streetViewService.getPanoramaByLocation(position, 50, (data: any, status: any) => {
          if (status === window.google.maps.StreetViewStatus.OK) {
            // Street View is available
            panoramaRef.current = new window.google.maps.StreetViewPanorama(
              streetViewRef.current,
              {
                position: position,
                pov: {
                  heading: 0,
                  pitch: 0
                },
                zoom: 1,
                addressControl: false,
                panControl: true,
                zoomControl: true,
                enableCloseButton: false,
                fullscreenControl: false
              }
            );
            
            console.log('Street View initialized successfully');
          } else {
            console.warn('Street View not available at this location, falling back to map view');
            // Fallback to a simple map view
            const map = new window.google.maps.Map(streetViewRef.current, {
              center: position,
              zoom: 18,
              mapTypeId: 'satellite'
            });
            
            new window.google.maps.Marker({
              position: position,
              map: map
            });
          }
        });
        
      } catch (error) {
        console.error('Error initializing Street View:', error);
      }
    };

    loadGoogleMaps();

    return () => {
      // Cleanup
      panoramaRef.current = null;
    };
  }, [latitude, longitude]);

  return (
    <div 
      ref={streetViewRef}
      className={className}
      style={style}
    />
  );
};