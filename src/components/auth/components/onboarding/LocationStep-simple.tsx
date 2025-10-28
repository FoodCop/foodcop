import { useState } from 'react';
import type { UserData } from '../../App';
import { Button } from '../../../ui/button-simple';

interface LocationStepProps {
  data: UserData;
  onNext: (data: Partial<UserData>) => void;
}

export function LocationStep({ data, onNext }: LocationStepProps) {
  const [address, setAddress] = useState(data.location?.address || '');
  const [loading, setLoading] = useState(false);

  const handleGetCurrentLocation = () => {
    setLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Simple reverse geocoding using a mock address
          setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setLoading(false);
          
          // You could integrate with Google Maps Geocoding API here
          onNext({
            location: {
              lat: latitude,
              lng: longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            }
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoading(false);
          alert('Could not get your current location. Please enter manually.');
        }
      );
    } else {
      setLoading(false);
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleManualSubmit = () => {
    if (!address.trim()) {
      alert('Please enter your location');
      return;
    }

    onNext({
      location: {
        lat: 0, // Would normally geocode the address
        lng: 0,
        address: address.trim()
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          📍 Location Setup
        </h2>
        <p className="text-gray-600">
          Help us find great food options near you
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Location
          </label>
          
          <Button
            onClick={handleGetCurrentLocation}
            disabled={loading}
            className="w-full mb-4"
            variant="outline"
          >
            {loading ? (
              <>
                <span className="animate-spin">⟳</span>
                Getting location...
              </>
            ) : (
              <>
                📍 Use Current Location
              </>
            )}
          </Button>
        </div>

        <div className="text-center text-gray-500">or</div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Enter Address Manually
          </label>
          <input
            id="address"
            type="text"
            placeholder="Enter your city or address"
            value={address}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Button
          onClick={handleManualSubmit}
          className="w-full"
          disabled={!address.trim()}
        >
          Continue with this location
        </Button>
      </div>

      <div className="text-xs text-gray-500 text-center">
        We use your location to suggest nearby restaurants and food options.
        You can change this later in settings.
      </div>
    </div>
  );
}