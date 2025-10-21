'use client';

import { Check } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface OnboardingProgressProps {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
  className?: string;
}

export function OnboardingProgress({
  steps,
  currentStep,
  completedSteps,
  className = ''
}: OnboardingProgressProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStep);
  const totalSteps = steps.length;

  return (
    <div className={`w-full ${className}`}>
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isCurrent
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                
                {/* Step Label */}
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-center">
                  <p
                    className={`text-xs font-medium whitespace-nowrap ${
                      isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-400 mt-1 max-w-20 mx-auto">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div className="flex-1 mx-4">
                  <div
                    className={`h-0.5 transition-all duration-300 ${
                      completedSteps.includes(steps[index + 1]?.id) || 
                      (isCompleted && index < currentIndex)
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Text */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Step {currentIndex + 1} of {totalSteps}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / totalSteps) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Default onboarding steps
export const defaultOnboardingSteps: Step[] = [
  {
    id: 'intro',
    title: 'Welcome',
    description: 'App intro'
  },
  {
    id: 'profile',
    title: 'Profile',
    description: 'Basic info'
  },
  {
    id: 'preferences',
    title: 'Preferences',
    description: 'Food choices'
  },
  {
    id: 'plate-intro',
    title: 'Your Plate',
    description: 'Learn concept'
  },
  {
    id: 'plate-setup',
    title: 'Setup',
    description: 'Add favorites'
  },
  {
    id: 'complete',
    title: 'Complete',
    description: 'All done!'
  }
];

export default OnboardingProgress;