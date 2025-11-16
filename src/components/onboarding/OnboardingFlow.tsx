import React from 'react';
import { OnboardingProvider, useOnboarding } from './OnboardingContext';
import WelcomeStep from './steps/WelcomeStep';
import PreferencesStep from './steps/PreferencesStep';

const OnboardingFlowContent: React.FC = () => {
  const { state } = useOnboarding();

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <PreferencesStep />;
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {renderStep()}
    </div>
  );
};

const OnboardingFlow: React.FC = () => {
  return (
    <OnboardingProvider>
      <OnboardingFlowContent />
    </OnboardingProvider>
  );
};

export default OnboardingFlow;