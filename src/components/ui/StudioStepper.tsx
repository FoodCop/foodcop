import React from 'react';
import { Check } from 'lucide-react';

interface StudioStepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export const StudioStepper: React.FC<StudioStepperProps> = ({ steps, currentStep, className = '' }) => {
  return (
    <div className={`studio-stepper ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <React.Fragment key={step}>
            <div className="studio-stepper__step">
              <div className={`studio-stepper__dot${isCompleted ? ' is-done' : isActive ? ' is-active' : ''}`}>
                {isCompleted ? <Check size={18} strokeWidth={3} /> : <span>{index + 1}</span>}
              </div>
              <span className={`studio-stepper__label${isActive ? ' is-active' : ''}`}>{step}</span>
            </div>

            {index < steps.length - 1 && (
              <div className={`studio-stepper__connector${isCompleted ? ' is-done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
