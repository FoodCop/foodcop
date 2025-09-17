import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, MapPin, Search, Navigation } from 'lucide-react';
import { API_CONFIG, getGoogleApiKeySafe } from './config/apiConfig';
import { FEATURES } from '../utils/env';

interface ModernGoogleMapsProps {
  onNavigateBack?: () => void;
}

// Extend the global interface to include the Google Maps Extended Components
declare global {
  interface Window {
    google: any;
  }
  
  namespace JSX {
    interface IntrinsicElements {
      'gmpx-api-loader': any;
      'gmp-map': any;
      'gmp-advanced-marker': any;
      'gmpx-place-picker': any;
    }
  }
}

export const ModernGoogleMaps: React.FC<ModernGoogleMapsProps> = ({
  onNavigateBack
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const placePickerRef = useRef<any>(null);
  const [infoWindow, setInfoWindow] = useState<any>(null);

  useEffect(() => {
    if (!FEATURES.GOOGLE_MAPS) {
      setError('Google Maps not configured. Please set VITE_GOOGLE_MAPS_API_KEY environment variable.');
      setIsLoading(false);
      return;
    }

    const apiKey = getGoogleApiKeySafe();
    if (!apiKey) {
      setError('Google API key not properly configured');
      setIsLoading(false);
      return;
    }

    loadGoogleMapsExtendedComponents();
  }, []);

  const loadGoogleMapsExtendedComponents = async () => {
    console.log('🚀 ModernGoogleMaps: Loading Extended Component Library...');
    const apiKey = getGoogleApiKeySafe();
    console.log('🔧 API Key configured:', !!apiKey);
    console.log('🔧 API Key preview:', apiKey ? `${apiKey.substring(0, 8)}...` : 'None');
    
    try {
      // Load the Extended Component Library
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js';
      
      console.log('📝 Creating Extended Component Library script');
      
      script.onload = () => {
        console.log('✅ Extended Component Library script loaded');
        initializeComponents();
      };
      script.onerror = (event) => {
        console.error('❌ Failed to load Extended Component Library:', event);
        setError('Failed to load Google Maps Extended Component Library');
        setIsLoading(false);
      };
      
      // Check if script already exists
      const existingScript = document.querySelector(`script[src="${script.src}"]`);
      if (!existingScript) {
        console.log('📋 Appending Extended Component Library script to head');
        document.head.appendChild(script);
      } else {
        console.log('✅ Extended Component Library script already exists, initializing...');
        initializeComponents();
      }
    } catch (err: any) {
      console.error('❌ Error loading Google Maps Extended Components:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack
      });
      setError('Failed to initialize Google Maps');
      setIsLoading(false);
    }
  };

  const initializeComponents = async () => {
    console.log('🧩 ModernGoogleMaps: Initializing web components...');
    
    try {
      // Wait for custom elements to be defined
      console.log('⏳ Waiting for gmp-map to be defined...');
      await customElements.whenDefined('gmp-map');
      console.log('✅ gmp-map defined');
      
      console.log('⏳ Waiting for gmpx-place-picker to be defined...');
      await customElements.whenDefined('gmpx-place-picker');
      console.log('✅ gmpx-place-picker defined');
      
      console.log('⏳ Waiting for gmp-advanced-marker to be defined...');
      await customElements.whenDefined('gmp-advanced-marker');
      console.log('✅ gmp-advanced-marker defined');
      
      console.log('✅ All web components ready');
      setIsLoading(false);
      
      // Add a small delay to ensure components are fully loaded
      console.log('⏳ Setting up map interactions in 100ms...');
      setTimeout(() => {
        setupMapInteractions();
      }, 100);
    } catch (err: any) {
      console.error('❌ Error initializing components:', err);
      console.error('Component initialization error details:', {
        message: err.message,
        stack: err.stack
      });
      setError('Failed to initialize map components');
      setIsLoading(false);
    }
  };

  const setupMapInteractions = () => {
    console.log('🔧 ModernGoogleMaps: Setting up map interactions...');
    
    const map = mapRef.current;
    const marker = markerRef.current;
    const placePicker = placePickerRef.current;

    console.log('🔍 Component refs check:', {
      mapExists: !!map,
      markerExists: !!marker,
      placePickerExists: !!placePicker
    });

    if (!map || !marker || !placePicker) {
      console.warn('⚠️ Missing component refs, retrying in 500ms...');
      setTimeout(setupMapInteractions, 500);
      return;
    }

    try {
      // Configure map options
      console.log('🗺️ Configuring map options...');
      if (map.innerMap) {
        console.log('✅ innerMap available, setting options');
        map.innerMap.setOptions({
          mapTypeControl: false,
          streetViewControl: true,
          fullscreenControl: true
        });
      } else {
        console.warn('⚠️ innerMap not yet available');
      }

      // Set up info window
      console.log('📍 Setting up info window...');
      const newInfoWindow = new window.google.maps.InfoWindow();
      setInfoWindow(newInfoWindow);
      console.log('✅ Info window created');

      // Listen for place changes
      console.log('👂 Setting up place picker event listener...');
      placePicker.addEventListener('gmpx-placechange', () => {
        console.log('🎯 Place change event fired');
        const place = placePicker.value;
        console.log('📍 Selected place:', place);
        handlePlaceChange(place, map, marker, newInfoWindow);
      });

      console.log('✅ Modern Google Maps initialized successfully');
    } catch (err: any) {
      console.error('❌ Error setting up map interactions:', err);
      console.error('Setup error details:', {
        message: err.message,
        stack: err.stack
      });
    }
  };

  const handlePlaceChange = (place: any, map: any, marker: any, infoWindow: any) => {
    console.log('🎯 ModernGoogleMaps: Place changed event handler');
    console.log('📍 Place details:', {
      name: place.displayName || place.name,
      formattedAddress: place.formattedAddress,
      location: place.location,
      rating: place.rating,
      hasGeometry: !!place.geometry,
      viewport: place.viewport
    });
    
    if (!place.location) {
      console.warn('⚠️ No location data for place:', place.name || 'Unknown');
      alert(`No details available for input: '${place.name}'`);
      infoWindow.close();
      marker.position = null;
      return;
    }

    // Update map view
    if (place.viewport) {
      map.innerMap.fitBounds(place.viewport);
    } else {
      map.center = place.location;
      map.zoom = 17;
    }

    // Update marker position
    marker.position = place.location;
    
    // Update info window
    const content = `
      <div class="p-3 max-w-xs">
        <strong class="text-[#0B1F3A] block mb-1">${place.displayName}</strong>
        <span class="text-gray-600 text-sm">${place.formattedAddress || 'Address not available'}</span>
        ${place.rating ? `<div class="mt-2 text-sm"><span class="text-yellow-500">⭐</span> ${place.rating}</div>` : ''}
      </div>
    `;
    
    infoWindow.setContent(content);
    infoWindow.open(map.innerMap, marker);
    
    setSelectedPlace(place);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const map = mapRef.current;
        
        if (map) {
          map.center = { lat: latitude, lng: longitude };
          map.zoom = 15;
          
          const marker = markerRef.current;
          if (marker) {
            marker.position = { lat: latitude, lng: longitude };
          }
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to retrieve your location');
      }
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-red-700 mb-2">Map Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              className="px-4 py-2 bg-[#F14C35] text-white rounded-lg hover:bg-[#A6471E] transition-colors"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        {onNavigateBack && (
          <button
            onClick={onNavigateBack}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        
        <h1 className="text-lg font-semibold text-[#0B1F3A]">Modern Google Maps</h1>
        
        <button
          onClick={getCurrentLocation}
          className="w-10 h-10 rounded-full bg-[#F14C35] flex items-center justify-center hover:bg-[#A6471E] transition-colors"
          title="Get current location"
        >
          <Navigation className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/90 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#F14C35] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-[#0B1F3A] font-medium">Loading Modern Google Maps...</p>
          </div>
        </div>
      )}

      {/* Google Maps API Loader */}
      <gmpx-api-loader 
        key={getGoogleApiKeySafe() || 'no-key'} 
        solution-channel="GMP_GE_mapsandplacesautocomplete_v2"
      />

      {/* Map Container */}
      <div className="h-[calc(100vh-80px)] relative">
        <gmp-map
          ref={mapRef}
          center="37.7749,-122.4194"
          zoom="13"
          map-id="FUZO_MAP_ID"
          className="w-full h-full"
        >
          {/* Search Control */}
          <div slot="control-block-start-inline-start" className="m-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 min-w-[300px]">
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-[#0B1F3A]">Find Restaurants</span>
              </div>
              <gmpx-place-picker
                ref={placePickerRef}
                placeholder="Search for restaurants, cafes, food..."
                className="w-full"
              />
            </div>
          </div>

          {/* Advanced Marker */}
          <gmp-advanced-marker ref={markerRef} />
        </gmp-map>

        {/* Selected Place Info */}
        {selectedPlace && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-[#0B1F3A] mb-1">{selectedPlace.displayName}</h3>
                <p className="text-sm text-gray-600 mb-2">{selectedPlace.formattedAddress}</p>
                {selectedPlace.rating && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-sm font-medium">{selectedPlace.rating}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedPlace(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <span className="text-gray-400">×</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute top-20 right-4 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-3 max-w-xs shadow-sm">
        <h4 className="font-medium text-[#0B1F3A] mb-2">🗺️ Modern Maps</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Uses Google's Extended Component Library</li>
          <li>• Search for restaurants and places</li>
          <li>• Click locations for details</li>
          <li>• Tap 📍 for current location</li>
        </ul>
      </div>
    </div>
  );
};

export default ModernGoogleMaps;
