import { useState, useEffect, useRef } from 'react';
import type { UserData } from '../../App';
import { Button } from '../ui/button-simple';
import { MapPin, Loader2 } from 'lucide-react';
import { config } from '../../../../config/config';

// Google Maps type definitions
interface LatLngLiteral {
  lat: number;
  lng: number;
}

interface MapEvent {
  latLng: {
    lat(): number;
    lng(): number;
  };
}

interface GoogleMap {
  setCenter(latlng: LatLngLiteral): void;
  addListener(eventName: string, handler: (event: MapEvent) => void): void;
}

interface GoogleMarker {
  setPosition(latlng: LatLngLiteral): void;
  addListener(eventName: string, handler: (event: MapEvent) => void): void;
}

interface GoogleMapOptions {
  zoom?: number;
  center?: LatLngLiteral;
  mapTypeControl?: boolean;
  streetViewControl?: boolean;
  fullscreenControl?: boolean;
}

interface GoogleMarkerOptions {
  position?: LatLngLiteral;
  map?: GoogleMap;
  draggable?: boolean;
}

interface GeocoderResult {
  formatted_address: string;
}

type GeocoderStatus = 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';

interface GoogleGeocoder {
  geocode(
    request: { location: LatLngLiteral },
    callback: (results: GeocoderResult[], status: GeocoderStatus) => void
  ): void;
}

interface GoogleMaps {
  Map: new (element: HTMLElement, options?: GoogleMapOptions) => GoogleMap;
  Marker: new (options?: GoogleMarkerOptions) => GoogleMarker;
  Geocoder: new () => GoogleGeocoder;
}

declare global {
  interface Window {
    google: {
      maps: GoogleMaps;
    };
  }
}

interface LocationStepProps {
  data: UserData;
  onNext: (data: Partial<UserData>) => void;
}

declare global {
  interface Window {
    google: {
      maps: GoogleMaps;
    };
  }
}

export function LocationStep({ data, onNext }: LocationStepProps) {
  const [location, setLocation] = useState(data.location || null);
  const [address, setAddress] = useState(data.location?.address || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [geolocationAvailable, setGeolocationAvailable] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<GoogleMap | null>(null);
  const markerRef = useRef<GoogleMarker | null>(null);

  // Fetch Google Maps API key
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const projectId = config.supabase.url.split('://')[1].split('.')[0];
        const publicAnonKey = config.supabase.anonKey;
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-a0939869/config/maps-api-key`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        const data = await response.json();
        if (data.apiKey) {
          setApiKey(data.apiKey);
        } else {
          setError('Unable to load map configuration');
          console.error('Failed to fetch API key:', data);
        }
      } catch (err) {
        setError('Unable to load map configuration');
        console.error('Error fetching API key:', err);
      }
    };
    fetchApiKey();
  }, []);

  // Check geolocation availability
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeolocationAvailable(false);
    }
  }, []);

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey) return;

    if (window.google) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => {
      setError('Failed to load Google Maps');
      console.error('Error loading Google Maps script');
    };
    document.head.appendChild(script);
  }, [apiKey]);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || googleMapRef.current) return;

    const defaultCenter = location || { lat: 37.7749, lng: -122.4194 }; // San Francisco

    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    // Create marker
    markerRef.current = new window.google.maps.Marker({
      position: defaultCenter,
      map: googleMapRef.current,
      draggable: true,
    });

    if (location) {
      setLocation(location);
    }

    // Add click listener to map
    googleMapRef.current.addListener('click', (e: MapEvent) => {
      const newLocation = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      if (markerRef.current) {
        markerRef.current.setPosition(newLocation);
      }
      setLocation(newLocation);
      getAddressFromCoordinates(newLocation);
    });

    // Add drag listener to marker
    if (markerRef.current) {
      markerRef.current.addListener('dragend', (e: MapEvent) => {
        const newLocation = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        };
        setLocation(newLocation);
        getAddressFromCoordinates(newLocation);
      });
    }
  }, [mapLoaded, location]);

  const getAddressFromCoordinates = async (coords: { lat: number; lng: number }) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat: coords.lat, lng: coords.lng } },
        (results: GeocoderResult[], status: GeocoderStatus) => {
          if (status === 'OK' && results[0]) {
            setAddress(results[0].formatted_address);
          }
        }
      );
    } catch (err) {
      console.error('Error getting address:', err);
    }
  };

  const handleGetCurrentLocation = () => {
    setIsLoading(true);
    setError(null);

    if (!geolocationAvailable) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(newLocation);
        
        if (googleMapRef.current && markerRef.current) {
          googleMapRef.current.setCenter(newLocation);
          markerRef.current.setPosition(newLocation);
          getAddressFromCoordinates(newLocation);
        }
        
        setIsLoading(false);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location. Please select manually on the map.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access or select manually on the map.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please select manually on the map.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again or select manually on the map.';
            break;
        }
        
        console.error('Error getting location:', {
          code: error.code,
          message: error.message,
          errorType: error.code === 1 ? 'PERMISSION_DENIED' : 
                     error.code === 2 ? 'POSITION_UNAVAILABLE' : 
                     error.code === 3 ? 'TIMEOUT' : 'UNKNOWN'
        });
        setError(errorMessage);
        setIsLoading(false);
      }
    );
  };

  const handleSubmit = () => {
    if (location) {
      onNext({
        location: {
          ...location,
          address: address || undefined,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-gray-600">
          Click or drag the marker on the map to select your location.
        </p>
      </div>

      {geolocationAvailable && (
        <Button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLoading || !mapLoaded}
          variant="outline"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Getting Location...
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 mr-2" />
              Use My Current Location
            </>
          )}
        </Button>
      )}

      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <div
          ref={mapRef}
          className="w-full h-[400px] rounded-lg border border-gray-200 bg-gray-100"
        />
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {address && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded">
          <p className="text-sm text-gray-600 mb-1">Selected Location</p>
          <p>{address}</p>
        </div>
      )}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={!location}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
}