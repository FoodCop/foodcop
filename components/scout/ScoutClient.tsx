'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapViewDynamic } from './MapViewDynamic';

interface ScoutClientProps {
  className?: string;
  style?: React.CSSProperties;
}

export function ScoutClient({ className, style }: ScoutClientProps) {
  const [locationData, setLocationData] = useState<any>(null);
  const [mapError, setMapError] = useState<Error | null>(null);
  const [initialLocation, setInitialLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [focusedRestaurant, setFocusedRestaurant] = useState<{
    name: string;
    coordinates: { lat: number; lng: number };
    rating?: number;
    cuisine?: string;
    priceLevel?: string;
    address?: string;
  } | null>(null);
  const searchParams = useSearchParams();

  // Check for URL parameters on mount
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const name = searchParams.get('name');
    const rating = searchParams.get('rating');
    const cuisine = searchParams.get('cuisine');
    const priceLevel = searchParams.get('priceLevel');
    const address = searchParams.get('address');
    const focus = searchParams.get('focus');

    if (lat && lng && focus === 'true') {
      const coordinates = {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };
      
      if (!isNaN(coordinates.lat) && !isNaN(coordinates.lng)) {
        setInitialLocation(coordinates);
        
        // Set focused restaurant data
        setFocusedRestaurant({
          name: name || 'Unknown Restaurant',
          coordinates,
          rating: rating ? parseFloat(rating) : undefined,
          cuisine: cuisine || undefined,
          priceLevel: priceLevel || undefined,
          address: address || undefined
        });
        
        console.log(`🗺️ Focusing on restaurant: ${name || 'Unknown'} at`, coordinates);
      }
    }
  }, [searchParams]);

  return (
    <div className="space-y-4">
      <MapViewDynamic
        style={style}
        className={className}
        currentLocation={initialLocation || { lat: 13.1262, lng: 80.2335 }}
        searchRadius={5000}
        focusedRestaurant={focusedRestaurant}
        onLocationFound={(location) => {
          console.log('✅ Location detected:', location);
          setLocationData(location);
        }}
        onMapError={(error) => {
          console.error('❌ Map error:', error);
          setMapError(error);
        }}
      />
      
      {/* Show info if we're focusing on a specific restaurant */}
      {initialLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">📍 Showing Restaurant Location</h3>
          <div className="space-y-1 text-sm text-blue-800">
            <div>
              <span className="font-medium">Restaurant:</span>{' '}
              <span className="text-blue-900">{searchParams.get('name') || 'Selected Restaurant'}</span>
            </div>
            <div>
              <span className="font-medium">Coordinates:</span>{' '}
              <span className="text-blue-900">{initialLocation.lat.toFixed(6)}, {initialLocation.lng.toFixed(6)}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Location Debug Information - Commented out for now */}
      {/*
      {locationData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">📍 Location Detected</h3>
          <div className="space-y-2 text-sm text-gray-800">
            <div>
              <span className="font-medium text-green-700">Coordinates:</span>{' '}
              <span className="text-gray-900">{locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}</span>
            </div>
            <div>
              <span className="font-medium text-green-700">Accuracy:</span>{' '}
              <span className="text-gray-900">±{(locationData.accuracy / 1000).toFixed(1)} km</span>
            </div>
            <div>
              <span className="font-medium text-green-700">Address:</span>{' '}
              <span className="text-gray-900">{locationData.address}</span>
            </div>
            {locationData.formatted_address && locationData.formatted_address !== locationData.address && (
              <div>
                <span className="font-medium text-green-700">Full Address:</span>{' '}
                <span className="text-gray-900">{locationData.formatted_address}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-green-700">Timestamp:</span>{' '}
              <span className="text-gray-900">{locationData.timestamp}</span>
            </div>
            <div>
              <span className="font-medium text-green-700">Geocoding:</span>{' '}
              <span className="text-gray-900">{locationData.geocoding_success ? '✅ Success' : '❌ Failed'}</span>
            </div>
            {locationData.address_components && (
              <details className="mt-2">
                <summary className="font-medium text-green-700 cursor-pointer">
                  Address Components
                </summary>
                <div className="mt-1 pl-4 space-y-1 text-xs text-gray-700">
                  {Object.entries(locationData.address_components).map(([key, value]) => (
                    value ? (
                      <div key={key}>
                        <span className="font-medium text-gray-800">{key.replace(/_/g, ' ')}:</span>{' '}
                        <span className="text-gray-900">{value as string}</span>
                      </div>
                    ) : null
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      )}
      */}
      
      {/* Map Error Information */}
      {mapError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">❌ Map Error</h3>
          <p className="text-sm text-gray-800">{mapError.message}</p>
        </div>
      )}
    </div>
  );
}