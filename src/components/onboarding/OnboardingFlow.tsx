import React from 'react';
import { OnboardingProvider, useOnboarding } from './OnboardingContext';
import WelcomeStep from './steps/WelcomeStep';
import LocationStep from './steps/LocationStep';
import ProfileStep from './steps/ProfileStep';
import QuestionsStep from './steps/QuestionsStep';
import ProcessingStep from './steps/ProcessingStep';

const OnboardingFlowContent: React.FC = () => {
  const { state } = useOnboarding();

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <LocationStep />;
      case 2:
        return <ProfileStep />;
      case 3:
        return <QuestionsStep />;
      case 4:
        return <ProcessingStep />;
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuzo-primary via-fuzo-secondary to-fuzo-accent">
      <div className="container mx-auto px-4 py-8">
        {renderStep()}
      </div>
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