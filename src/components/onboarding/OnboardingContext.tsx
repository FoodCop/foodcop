import React, { createContext, useContext, useState, useCallback } from 'react';
import { OnboardingState, LocationData, ProfileData, QuestionResponse, ExtractedPreferences } from '../../types/onboarding';

interface OnboardingContextType {
  state: OnboardingState;
  setCurrentStep: (step: number) => void;
  setLocation: (location: LocationData) => void;
  setProfile: (profile: ProfileData) => void;
  addResponse: (response: QuestionResponse) => void;
  setPreferences: (preferences: ExtractedPreferences) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const initialState: OnboardingState = {
  currentStep: 0,
  location: null,
  profile: null,
  responses: [],
  preferences: null,
};

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OnboardingState>(initialState);

  const setCurrentStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const setLocation = useCallback((location: LocationData) => {
    setState(prev => ({ ...prev, location }));
  }, []);

  const setProfile = useCallback((profile: ProfileData) => {
    setState(prev => ({ ...prev, profile }));
  }, []);

  const addResponse = useCallback((response: QuestionResponse) => {
    setState(prev => ({
      ...prev,
      responses: [...prev.responses, response]
    }));
  }, []);

  const setPreferences = useCallback((preferences: ExtractedPreferences) => {
    setState(prev => ({ ...prev, preferences }));
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
        setProfile,
        addResponse,
        setPreferences,
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
