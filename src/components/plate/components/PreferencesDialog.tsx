import { useState } from 'react';
import { X, MapPin, Check } from 'lucide-react';
import { toast } from 'sonner';
import { GeolocationService, type LocationData } from '../../../services/geolocationService';
import { ProfileService } from '../../../services/profileService';
import { DIETARY_OPTIONS } from '../../../types/onboarding';

interface PreferencesDialogProps {
  userId: string;
  onComplete: () => void;
  onSkip: () => void;
  showLocationStep?: boolean;
  showDietaryStep?: boolean;
}

type Step = 'location' | 'dietary';

export function PreferencesDialog({ 
  userId: _userId, 
  onComplete, 
  onSkip,
  showLocationStep = true,
  showDietaryStep = true
}: Readonly<PreferencesDialogProps>) {
  const [currentStep, setCurrentStep] = useState<Step>(showLocationStep ? 'location' : 'dietary');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Location state
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualCity, setManualCity] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  
  // Dietary preferences state
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);

  // Request geolocation permission
  const handleRequestLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      const data = await GeolocationService.requestLocationPermission();
      
      if (data) {
        setLocationData(data);
        toast.success(`Location detected: ${data.city || data.country || 'Unknown'}`);
      } else {
        setLocationError('Could not detect location. Please enter manually.');
        setShowManualInput(true);
      }
    } catch (error) {
      console.error('Location error:', error);
      setLocationError('Permission denied. Please enter manually.');
      setShowManualInput(true);
    } finally {
      setLocationLoading(false);
    }
  };

  // Handle manual city input
  const handleManualCity = async () => {
    if (!manualCity.trim()) {
      toast.error('Please enter a city name');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    try {
      const data = await GeolocationService.parseManualLocation(manualCity.trim());
      
      if (data) {
        setLocationData(data);
        toast.success(`Location found: ${data.city || data.country || 'Unknown'}`);
        setShowManualInput(false);
      } else {
        setLocationError('Could not find this location. Please try again.');
      }
    } catch (error) {
      console.error('Manual location error:', error);
      setLocationError('Error finding location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Save location and proceed to dietary step
  const handleLocationNext = async () => {
    console.log('🎯 PreferencesDialog: handleLocationNext called', { locationData });
    
    if (!locationData) {
      toast.error('Please set your location first');
      return;
    }

    setLoading(true);

    try {
      console.log('💾 PreferencesDialog: Calling ProfileService.updateProfile with location data');
      
      // Save location to profile
      const result = await ProfileService.updateProfile({
        location_city: locationData.city,
        location_state: locationData.state,
        location_country: locationData.country
      });

      console.log('✅ PreferencesDialog: ProfileService.updateProfile result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to save location');
      }

      toast.success('Location saved!');

      // Move to dietary step if needed, otherwise complete
      if (showDietaryStep) {
        setCurrentStep('dietary');
      } else {
        // Mark onboarding complete if no dietary step
        await ProfileService.updateProfile({ onboarding_completed: true });
        onComplete();
      }
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Failed to save location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle dietary preference selection
  const toggleDietary = (option: string) => {
    setSelectedDietary(prev => {
      const normalized = option.toLowerCase();
      if (prev.includes(normalized)) {
        return prev.filter(item => item !== normalized);
      } else {
        // If selecting "No restrictions", clear all others
        if (normalized === 'no restrictions') {
          return [normalized];
        }
        // If selecting any other option, remove "No restrictions"
        return [...prev.filter(item => item !== 'no restrictions'), normalized];
      }
    });
  };

  // Save dietary preferences and complete
  const handleDietarySave = async () => {
    console.log('🎯 PreferencesDialog: handleDietarySave called', { selectedDietary });
    
    setLoading(true);

    try {
      console.log('💾 PreferencesDialog: Calling ProfileService.updateProfile with dietary data');
      
      // Save dietary preferences to profile
      const result = await ProfileService.updateProfile({
        dietary_preferences: selectedDietary,
        onboarding_completed: true
      });

      console.log('✅ PreferencesDialog: ProfileService.updateProfile result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to save preferences');
      }

      toast.success('Preferences saved!');
      onComplete();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {currentStep === 'location' ? 'Set Your Location' : 'Food Preferences'}
          </h2>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location Step */}
        {currentStep === 'location' && (
          <div className="p-6 space-y-6">
            <div>
              <p className="text-gray-600 mb-4">
                We need your location to recommend nearby restaurants and personalize your experience.
              </p>

              {!locationData && !showManualInput && (
                <button
                  onClick={handleRequestLocation}
                  disabled={locationLoading}
                  className="w-full py-3 px-4 bg-linear-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {locationLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Detecting Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5" />
                      Use My Location
                    </>
                  )}
                </button>
              )}

              {locationData && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-900">Location Detected</p>
                      <p className="text-sm text-green-700 mt-1">
                        {locationData.city && `${locationData.city}, `}
                        {locationData.state && `${locationData.state}, `}
                        {locationData.country}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {locationError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-red-700">{locationError}</p>
                </div>
              )}

              {showManualInput && !locationData && (
                <div className="space-y-3 mt-4">
                  <div>
                    <label htmlFor="manual-city" className="block text-sm font-medium text-gray-700 mb-2">
                      Enter your city
                    </label>
                    <input
                      id="manual-city"
                      type="text"
                      value={manualCity}
                      onChange={(e) => setManualCity(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualCity()}
                      placeholder="e.g. New York, USA"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <button
                    onClick={handleManualCity}
                    disabled={locationLoading}
                    className="w-full py-3 px-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {locationLoading ? 'Searching...' : 'Find Location'}
                  </button>
                </div>
              )}

              {!showManualInput && !locationData && (
                <button
                  onClick={() => setShowManualInput(true)}
                  className="w-full mt-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Or enter manually
                </button>
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={onSkip}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Skip for Now
              </button>
              <button
                onClick={handleLocationNext}
                disabled={!locationData || loading}
                className="flex-1 py-3 px-4 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {/* Dietary Step */}
        {currentStep === 'dietary' && (
          <div className="p-6 space-y-6">
            <div>
              <p className="text-gray-600 mb-4">
                Select your dietary preferences to get personalized food recommendations.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {DIETARY_OPTIONS.map((option) => {
                  const normalized = option.toLowerCase();
                  const isSelected = selectedDietary.includes(normalized);
                  
                  return (
                    <button
                      key={option}
                      onClick={() => toggleDietary(option)}
                      className={`py-3 px-4 rounded-xl font-medium transition-all ${
                        isSelected
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {selectedDietary.length > 0 && (
                <p className="text-sm text-gray-500 mt-3">
                  {selectedDietary.length} preference{selectedDietary.length === 1 ? '' : 's'} selected
                </p>
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={onSkip}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Skip for Now
              </button>
              <button
                onClick={handleDietarySave}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
