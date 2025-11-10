import React from 'react';
import { useOnboarding } from '../OnboardingContext';

const WelcomeStep: React.FC = () => {
  const { setCurrentStep } = useOnboarding();

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      {/* Top Logo */}
      <div className="pt-8 px-6 flex justify-center">
        <img 
          src="/logo_white.png" 
          alt="FUZO" 
          className="w-20 h-20"
        />
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Hero Image Placeholder */}
        <div className="mb-8">
          <div className="w-64 h-64 flex items-center justify-center">
            <img 
              src="/welcome.png" 
              alt="Welcome to FUZO" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Main Text */}
        <h2 className="text-gray-500 text-xl mb-4 leading-tight">
          Discover amazing food experiences near you!
        </h2>
      </div>

      {/* Bottom Button Section */}
      <div className="px-6 pb-8">
        {/* Get Started Button */}
        <button
          onClick={() => setCurrentStep(1)}
          className="w-full bg-orange-500 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg text-lg hover:bg-orange-600"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomeStep;
