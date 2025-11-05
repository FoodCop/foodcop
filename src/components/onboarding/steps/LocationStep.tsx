import React, { useState, useEffect } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { OnboardingService } from '../../../services/onboardingService';
import { useAuth } from '../../auth/AuthProvider';
import { LocationData } from '../../../types/onboarding';

const LocationStep: React.FC = () => {
  const { setCurrentStep, setLocation } = useOnboarding();
  const { user } = useAuth();
  const [address, setAddress] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [error, setError] = useState('');

  const detectLocation = async () => {
    setIsDetecting(true);
    setError('');

    try {
      // Get user's coordinates
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode using Google Maps Geocoding API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.results && data.results[0]) {
        const result = data.results[0];
        const addressComponents = result.address_components;

        // Extract city, state, country
        const city = addressComponents.find((c: any) => c.types.includes('locality'))?.long_name || '';
        const state = addressComponents.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name || '';
        const country = addressComponents.find((c: any) => c.types.includes('country'))?.long_name || '';

        const location: LocationData = {
          latitude,
          longitude,
          address: result.formatted_address,
          city,
          state,
          country,
        };

        setLocationData(location);
        setAddress(result.formatted_address);
      } else {
        setError('Could not detect your location. Please enter manually.');
      }
    } catch (err) {
      console.error('Location detection error:', err);
      setError('Location detection failed. Please enter your address manually.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleConfirm = async () => {
    if (!locationData || !user?.id) return;

    try {
      await OnboardingService.saveLocation(user.id, locationData);
      setLocation(locationData);
      setCurrentStep(2);
    } catch (err) {
      console.error('Error saving location:', err);
      setError('Failed to save location. Please try again.');
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Where are you located?</h2>
          <p className="text-gray-600">We'll use this to find nearby restaurants and food spots</p>
        </div>

        {/* Map Placeholder */}
        <div className="mb-6">
          <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center relative overflow-hidden">
            {isDetecting ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-fuzo-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-gray-600">Detecting your location...</p>
              </div>
            ) : locationData ? (
              <div className="absolute inset-0">
                {/* Google Maps Embed with marker */}
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${locationData.latitude},${locationData.longitude}&zoom=14`}
                  className="rounded-xl"
                />
              </div>
            ) : (
              <p className="text-gray-500">No location detected</p>
            )}
          </div>
        </div>

        {/* Address Display */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Location</label>
          <div className="relative">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fuzo-primary focus:border-transparent"
            />
          </div>
          {locationData && (
            <p className="text-sm text-gray-500 mt-2">
              {locationData.city}, {locationData.state}, {locationData.country}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={detectLocation}
            disabled={isDetecting}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            Detect Again
          </button>
          <button
            onClick={handleConfirm}
            disabled={!locationData}
            className="flex-1 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: locationData ? '#ff6900' : '#999' }}
            onMouseEnter={(e) => !locationData ? null : e.currentTarget.style.backgroundColor = '#e05e00'}
            onMouseLeave={(e) => !locationData ? null : e.currentTarget.style.backgroundColor = '#ff6900'}
          >
            Confirm & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationStep;
