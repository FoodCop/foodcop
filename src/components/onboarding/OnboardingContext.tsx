import React, { createContext, useContext, useState, useCallback } from 'react';
import { OnboardingState, LocationData, FoodPreferencesData } from '../../types/onboarding';

interface OnboardingContextType {
  state: OnboardingState;
  setCurrentStep: (step: number) => void;
  setLocation: (location: LocationData) => void;
  setFoodPreferences: (preferences: FoodPreferencesData) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const initialState: OnboardingState = {
  currentStep: 0, // 0=Welcome, 1=Location, 2=Food Preferences
  location: null,
  foodPreferences: null,
};

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OnboardingState>(initialState);

  const setCurrentStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const setLocation = useCallback((location: LocationData) => {
    setState(prev => ({ ...prev, location }));
  }, []);

  const setFoodPreferences = useCallback((preferences: FoodPreferencesData) => {
    setState(prev => ({ ...prev, foodPreferences: preferences }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        state,
        setCurrentStep,
        setLocation,
        setFoodPreferences,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};
