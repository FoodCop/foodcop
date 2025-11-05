import React from 'react';
import { useOnboarding } from '../OnboardingContext';

const WelcomeStep: React.FC = () => {
  const { setCurrentStep } = useOnboarding();

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: '#ff6900' }}>
      {/* Top Logo */}
      <div className="pt-8 px-6 flex justify-center">
        <img 
          src="/logo_mobile.png" 
          alt="FUZO" 
          className="w-20 h-20"
        />
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Hero Image Placeholder */}
        <div className="mb-8">
          <div className="w-64 h-64 flex items-center justify-center">
            {/* Placeholder for food illustration - you can replace with actual image */}
            <div className="text-8xl">🍽️</div>
          </div>
        </div>

        {/* Main Text */}
        <h2 className="text-white text-3xl font-bold mb-4 leading-tight">
          Discover amazing food experiences near you!
        </h2>
      </div>

      {/* Bottom USP Section */}
      <div className="px-6 pb-8">
        {/* USP Stats Box */}
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-4 mb-6">
          <div className="flex justify-around text-white">
            <div className="text-center">
              <div className="text-2xl font-bold">1000+</div>
              <div className="text-xs opacity-90">Restaurants</div>
            </div>
            <div className="w-px bg-white opacity-30"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">500+</div>
              <div className="text-xs opacity-90">Recipes</div>
            </div>
            <div className="w-px bg-white opacity-30"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">AI</div>
              <div className="text-xs opacity-90">Powered</div>
            </div>
          </div>
        </div>

        {/* Get Started Button */}
        <button
          onClick={() => setCurrentStep(1)}
          className="w-full bg-white text-gray-900 font-bold py-4 px-8 rounded-xl transition-all shadow-lg text-lg"
          style={{ color: '#ff6900' }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomeStep;
