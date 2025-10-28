import { useState } from 'react';
import { WelcomeStep } from './WelcomeStep';
import { ProfileStep } from './ProfileStep';
import { LocationStep } from './LocationStep';
import { CompletionStep } from './CompletionStep';

interface OnboardingData {
  displayName: string;
  location: string;
}

interface BaseStepProps {
  data: OnboardingData;
  onNext: () => void;
  onPrev: () => void;
  onUpdateData: (data: Partial<OnboardingData>) => void;
  onComplete: () => void;
  canGoBack: boolean;
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    displayName: '',
    location: ''
  });

  const steps = [
    { component: WelcomeStep, title: 'Welcome to FUZO!' },
    { component: ProfileStep, title: 'Tell us about yourself' },
    { component: LocationStep, title: 'Where are you located?' },
    { component: CompletionStep, title: 'All set!' }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateData = (data: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
  };

  const handleComplete = () => {
    onComplete(onboardingData);
  };

  const CurrentStepComponent = steps[currentStep].component;
  const isLastStep = currentStep === steps.length - 1;
  const canGoBack = currentStep > 0;

  // Build props based on step component needs
  const stepProps: BaseStepProps = {
    data: onboardingData,
    onNext: nextStep,
    onPrev: prevStep,
    onUpdateData: updateData,
    onComplete: handleComplete,
    canGoBack
  };

  // Only add isLastStep for components that need it
  const finalProps = CurrentStepComponent.name !== 'CompletionStep' 
    ? { ...stepProps, isLastStep } 
    : stepProps;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm text-gray-500">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#F14C35] h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Current Step */}
        <CurrentStepComponent {...finalProps} />
      </div>
    </div>
  );
}