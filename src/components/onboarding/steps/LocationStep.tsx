import React, { useState } from 'react';
import { Map, Marker } from 'pigeon-maps';
import { useOnboarding } from '../OnboardingContext';
import { OnboardingService } from '../../../services/onboardingService';
import { useAuth } from '../../auth/AuthProvider';
import { LocationData } from '../../../types/onboarding';

const LocationStep: React.FC = () => {
  const { setCurrentStep, setLocation } = useOnboarding();
  const { user } = useAuth();
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [error, setError] = useState('');

  const detectLocation = async () => {
    setIsDetecting(true);
    setError('');

    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      // Get user's coordinates
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve, 
          (error) => {
            console.error('Geolocation error:', error);
            reject(error);
          }, 
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          }
        );
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
      } else {
        setError('Could not detect your location. Please enter manually.');
      }
    } catch (err) {
      console.error('Location detection error:', err);
      const errorMessage = err instanceof GeolocationPositionError 
        ? err.code === 1 ? 'Please allow location access in your browser settings'
        : err.code === 2 ? 'Unable to determine your location. Please check your connection.'
        : 'Location detection timed out. Please try again.'
        : 'Location detection failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleConfirm = async () => {
    if (!locationData || !user?.id) return;

    try {
      await OnboardingService.saveLocation(user.id, locationData);
      setLocation(locationData);
      setCurrentStep(2); // Go to phone step after location
    } catch (err) {
      console.error('Error saving location:', err);
      setError('Failed to save location. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full">
      {/* Full-screen Map */}
      <div className="absolute inset-0">
        {isDetecting ? (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: '#ff6900', borderTopColor: 'transparent' }}></div>
              <p className="text-gray-600 font-medium">Detecting your location...</p>
            </div>
          </div>
        ) : locationData ? (
          <Map
            center={[locationData.latitude, locationData.longitude]}
            zoom={15}
            height={window.innerHeight}
            defaultWidth={window.innerWidth}
          >
            <Marker 
              anchor={[locationData.latitude, locationData.longitude]} 
              color="#ff6900"
              width={50}
            />
          </Map>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <p className="text-gray-600 font-medium">Allow location access to continue</p>
              <button
                onClick={detectLocation}
                className="text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg"
                style={{ backgroundColor: '#ff6900' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e05e00'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6900'}
              >
                Enable Location
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet Overlay */}
      {locationData && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-6">
          {/* Location Details */}
          <div className="mb-4">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center mt-1" style={{ backgroundColor: '#ff6900' }}>
                <span className="text-white text-xs">📍</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-1">
                  {locationData.city || 'Your Location'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {locationData.address}
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            className="w-full text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg text-lg"
            style={{ backgroundColor: '#ff6900' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e05e00'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6900'}
          >
            Confirm & Proceed
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationStep;
