import React, { useState, useEffect, useCallback } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { useAuth } from '../../auth/AuthProvider';
import { OnboardingService } from '../../../services/onboardingService';
import { DIETARY_OPTIONS } from '../../../types/onboarding';
import { toast } from 'sonner';

const PreferencesStep: React.FC = () => {
  const { setCurrentStep } = useOnboarding();
  const { user } = useAuth();
  const [detectedCountry, setDetectedCountry] = useState<string>('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(true);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [showSkipAlert, setShowSkipAlert] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const detectLocation = useCallback(async () => {
    setIsDetectingLocation(true);
    
    try {
      if (!navigator.geolocation) {
        setDetectedCountry('United States');
        setIsDetectingLocation(false);
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      });

      const { latitude, longitude } = position.coords;

      // Use free reverse geocoding API
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await response.json();

      const country = data.countryName || 'United States';
      setDetectedCountry(country);

      // Save location immediately
      if (user?.id) {
        await OnboardingService.saveLocation(user.id, { country });
      }
    } catch (error) {
      console.error('Location detection failed:', error);
      setDetectedCountry('United States');
      
      // Save default country
      if (user?.id) {
        try {
          await OnboardingService.saveLocation(user.id, { country: 'United States' });
        } catch (saveError) {
          console.error('Failed to save default location:', saveError);
        }
      }
    } finally {
      setIsDetectingLocation(false);
    }
  }, [user]);

  // Auto-detect location on mount
  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const togglePreference = (preference: string) => {
    setSelectedPreferences(prev => {
      if (prev.includes(preference)) {
        return prev.filter(p => p !== preference);
      } else {
        // If "No restrictions" is selected, deselect others
        if (preference === 'No restrictions') {
          return ['No restrictions'];
        }
        // If any other is selected, deselect "No restrictions"
        return prev.filter(p => p !== 'No restrictions').concat(preference);
      }
    });
  };

  const handleComplete = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      // Save dietary preferences
      await OnboardingService.saveDietaryPreferences(user.id, selectedPreferences);
      
      toast.success('Preferences saved successfully!');
      
      // Redirect to dashboard
      setTimeout(() => {
        globalThis.location.hash = '#dash';
      }, 500);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!user?.id) return;
    
    setIsSkipping(true);
    try {
      await OnboardingService.skipOnboarding(user.id);
      toast.success('You can set preferences later in Plate Settings');
      
      // Redirect to dashboard
      setTimeout(() => {
        globalThis.location.hash = '#dash';
      }, 500);
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      toast.error('Failed to skip. Please try again.');
    } finally {
      setIsSkipping(false);
      setShowSkipAlert(false);
    }
  };

  const getDietaryIcon = (option: string) => {
    const icons: Record<string, string> = {
      'Vegetarian': '🌿',
      'Vegan': '🥬',
      'Pescetarian': '🐟',
      'Ketogenic': '🔥',
      'Paleo': '🍖',
      'Gluten-Free': '🌾',
      'Dairy-Free': '🥛',
      'No restrictions': '✓'
    };
    return icons[option] || '🍴';
  };

  return (
    <>
      <div className="fixed inset-0 flex flex-col bg-white overflow-y-auto">
        {/* Header with Back Button */}
        <div className="pt-8 px-6 pb-4 sticky top-0 bg-white z-10 border-b border-gray-100">
          <button
            onClick={() => setCurrentStep(0)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back</span>
          </button>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Any dietary preferences?
          </h1>
          <p className="text-gray-600 text-sm">
            Select all that apply
          </p>
        </div>

        {/* Location Indicator */}
        <div className="px-6 pt-6 pb-4">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
            <div className="shrink-0">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                {isDetectingLocation ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-xl">📍</span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-gray-900 text-sm font-semibold">
                {isDetectingLocation ? 'Detecting your location...' : `You are in ${detectedCountry}`}
              </p>
              <p className="text-gray-600 text-xs">
                {isDetectingLocation ? 'Please wait' : 'Location detected automatically'}
              </p>
            </div>
          </div>
        </div>

        {/* Dietary Options */}
        <div className="flex-1 px-6 py-4 space-y-3 pb-40">
          {DIETARY_OPTIONS.map((option) => {
            const isSelected = selectedPreferences.includes(option);
            return (
              <button
                key={option}
                onClick={() => togglePreference(option)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-orange-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getDietaryIcon(option)}</span>
                  <span className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                    {option}
                  </span>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-gray-300'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Action Section - Fixed */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-6 space-y-4">
          {/* Progress Indicator */}
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
              <div className="w-8 h-1 bg-orange-500 rounded-full"></div>
            </div>
            <p className="text-xs text-gray-500">Step 2 of 2</p>
          </div>

          {/* Complete Button */}
          <button
            onClick={handleComplete}
            disabled={isSaving || isDetectingLocation}
            className="w-full bg-orange-500 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg text-lg hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Complete Setup'}
          </button>

          {/* Skip Button */}
          <button
            onClick={() => setShowSkipAlert(true)}
            disabled={isSaving || isSkipping}
            className="w-full text-gray-600 font-medium py-3 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      </div>

      {/* Skip Confirmation Alert */}
      {showSkipAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Skip Personalization?
            </h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              You can always set your food preferences later in Plate Settings to get better recommendations.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSkipAlert(false)}
                disabled={isSkipping}
                className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Continue Setup
              </button>
              <button
                onClick={handleSkip}
                disabled={isSkipping}
                className="flex-1 bg-orange-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {isSkipping ? 'Skipping...' : 'Skip to Dashboard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PreferencesStep;
