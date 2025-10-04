"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  illustration: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Embark on Culinary Adventures",
    description: "Embark on an exciting culinary journey with our app.",
    illustration: "food-adventure"
  },
  {
    id: 2,
    title: "Craft Your Perfect Order",
    description: "Customize your cravings and place orders effortlessly.",
    illustration: "order-craft"
  },
  {
    id: 3,
    title: "Taste the Delivered Magic",
    description: "Enjoy the convenience of doorstep culinary delights.",
    illustration: "delivery-magic"
  }
];

interface OnboardingFlowProps {
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

export function OnboardingFlow({ onComplete, onSkip, className }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isLastStep = currentStep === onboardingSteps.length - 1;
  const step = onboardingSteps[currentStep];

  return (
    <div className={`min-h-screen bg-[#f6f9f9] relative ${className || ""}`}>
      {/* Status Bar Placeholder */}
      <div className="h-11 bg-white"></div>
      
      {/* Main Content */}
      <div className="px-5 pt-3 pb-8 flex flex-col h-[calc(100vh-44px)]">
        {/* Illustration Area */}
        <div className="flex-1 flex items-center justify-center mb-6">
          <div className="w-[335px] h-[344px] bg-[#dfeded] rounded-lg flex items-center justify-center">
            {/* Placeholder for illustration - replace with actual images */}
            <div className="text-[#748ba0] text-center">
              <div className="w-20 h-20 bg-[#ff9500] rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {step.id === 1 ? "🍽️" : step.id === 2 ? "📝" : "🚚"}
                </span>
              </div>
              <p className="text-sm">Illustration {step.id}</p>
            </div>
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center items-center mb-8">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`mx-1 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "w-5 h-5 bg-[#ff9500]"
                  : "w-2 h-2 bg-[#ff9500] opacity-30"
              }`}
            />
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-lg p-8 text-center mb-6">
          <h1 className="text-[#0c1d2e] text-[28px] font-bold leading-[1.3] font-['DM_Sans',_sans-serif] mb-6">
            {step.title}
          </h1>
          <p className="text-[#748ba0] text-base leading-[1.5] font-['DM_Sans',_sans-serif]">
            {step.description}
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 h-[50px] border-[#ff9500] text-[#ff9500] hover:bg-[#ff9500] hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            className={`h-[50px] bg-[#ff9500] hover:bg-[#ff9500]/90 text-white font-bold text-sm rounded-lg ${
              currentStep === 0 ? "flex-1" : "flex-1"
            }`}
          >
            {isLastStep ? "Get Started" : "Next"}
            {!isLastStep && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>

        {/* Skip Option */}
        {!isLastStep && (
          <button
            onClick={onSkip}
            className="text-[#748ba0] text-sm mt-4 text-center hover:text-[#ff9500] transition-colors"
          >
            Skip onboarding
          </button>
        )}
      </div>

      {/* Home Indicator */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
        <div className="w-[134px] h-[5px] bg-[#0c1d2e] rounded-full"></div>
      </div>
    </div>
  );
}

// Individual onboarding step component for more granular control
interface OnboardingStepProps {
  step: OnboardingStep;
  isActive: boolean;
  totalSteps: number;
  currentStepIndex: number;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  className?: string;
}

export function OnboardingStep({
  step,
  isActive,
  totalSteps,
  currentStepIndex,
  onNext,
  onBack,
  onSkip,
  className
}: OnboardingStepProps) {
  if (!isActive) return null;

  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;

  return (
    <div className={`min-h-screen bg-[#f6f9f9] relative ${className || ""}`}>
      {/* Status Bar */}
      <div className="h-11 bg-white"></div>
      
      {/* Content matching Figma exactly */}
      <div className="relative h-[calc(100vh-44px)]">
        {/* Illustration */}
        <div 
          className="absolute bg-[#dfeded] w-[335px] h-[344px] left-1/2 top-[54px] transform -translate-x-1/2 rounded-lg"
          style={{ left: "calc(50% - 0.5px)" }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-[#748ba0]">
              <div className="w-20 h-20 bg-[#ff9500] rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-3xl">
                  {step.id === 1 ? "🍽️" : step.id === 2 ? "📝" : "🚚"}
                </span>
              </div>
              <p className="text-sm">Illustration {step.id}</p>
            </div>
          </div>
        </div>

        {/* Progress Navigation */}
        <div 
          className="absolute bottom-[374px] left-1/2 transform -translate-x-1/2"
          style={{ left: "calc(50% - 0.5px)" }}
        >
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`rounded-full transition-all duration-300 ${
                  index === currentStepIndex
                    ? "w-5 h-5 bg-[#ff9500]"
                    : "w-2 h-2 bg-[#ff9500] opacity-30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content Card */}
        <div 
          className="absolute bg-white w-[335px] h-[230px] left-1/2 top-[468px] transform -translate-x-1/2 rounded-lg text-center"
        >
          <h1 
            className="absolute text-[#0c1d2e] text-[28px] font-bold leading-[1.3] font-['DM_Sans',_sans-serif] top-[50px] left-1/2 transform -translate-x-1/2 w-[295px]"
            style={{ fontVariationSettings: "'opsz' 14" }}
          >
            {step.title}
          </h1>
          <p 
            className="absolute text-[#748ba0] text-base leading-[1.5] font-['DM_Sans',_sans-serif] top-[142px] left-1/2 transform -translate-x-1/2 w-[270px]"
            style={{ fontVariationSettings: "'opsz' 14" }}
          >
            {step.description}
          </p>
        </div>

        {/* Get Started Button */}
        <div 
          className="absolute bg-[#ff9500] w-[335px] right-[20px] rounded-lg"
          style={{ top: "calc(50% + 337px)", transform: "translateY(-50%)" }}
        >
          <button
            onClick={onNext}
            className="w-full h-[50px] flex items-center justify-center text-white font-bold text-sm"
          >
            {isLastStep ? "Get Started" : "Next"}
          </button>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-0 left-0 w-full h-[34px]">
          <div 
            className="absolute bg-[#0c1d2e] bottom-[8px] h-[5px] rounded-full w-[134px]"
            style={{ left: "calc(50% + 0.5px)", transform: "translateX(-50%)" }}
          />
        </div>
      </div>
    </div>
  );
}

export default OnboardingFlow;