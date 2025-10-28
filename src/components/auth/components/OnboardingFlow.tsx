import { useState } from 'react';
import type { UserData } from '../App';
import { BasicInfoStep } from './onboarding/BasicInfoStep';
import { LocationStep } from './onboarding/LocationStep-simple';
// import { ChevronLeft } from 'lucide-react'; // Removed - not available

interface OnboardingFlowProps {
  userData: UserData;
  onComplete: (data: UserData) => void;
}

export function OnboardingFlow({ userData, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<UserData>({
    ...userData,
  });

  const steps = [
    {
      title: 'Basic Information',
      component: BasicInfoStep,
    },
    {
      title: 'Your Location',
      component: LocationStep,
    },
  ];

  const handleStepComplete = (data: Partial<UserData>) => {
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(updatedData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-lg">←</span>
              </button>
            )}
            <div className="flex-1">
              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      index <= currentStep ? 'bg-gray-900' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="mb-8">{steps[currentStep].title}</h2>
        <CurrentStepComponent
          data={formData}
          onNext={handleStepComplete}
        />
      </div>
    </div>
  );
}
