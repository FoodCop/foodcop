import React from 'react';
import { useOnboarding } from '../OnboardingContext';

const WelcomeStep: React.FC = () => {
  const { setCurrentStep } = useOnboarding();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold mb-2" style={{ color: '#ff6900' }}>FUZO</h1>
          <p className="text-gray-600 text-lg">Your Personalized Food Discovery App</p>
        </div>

        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Welcome to Your Food Journey
          </h2>
          <p className="text-gray-600 text-base leading-relaxed">
            Let's get to know your taste preferences so we can recommend the perfect
            restaurants, recipes, and food experiences just for you.
          </p>
        </div>

        {/* Features */}
        <div className="mb-8 space-y-3 text-left">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#ff6900' }}>
              <span className="text-white text-sm">✓</span>
            </div>
            <p className="text-gray-700 text-sm">Personalized restaurant recommendations</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#ff6900' }}>
              <span className="text-white text-sm">✓</span>
            </div>
            <p className="text-gray-700 text-sm">Custom recipe suggestions based on your preferences</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#ff6900' }}>
              <span className="text-white text-sm">✓</span>
            </div>
            <p className="text-gray-700 text-sm">Connect with friends and share food discoveries</p>
          </div>
        </div>

        {/* Get Started Button */}
        <button
          onClick={() => setCurrentStep(1)}
          className="w-full text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          style={{ backgroundColor: '#ff6900' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e05e00'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6900'}
        >
          Get Started
        </button>

        <p className="text-gray-500 text-xs mt-6">Takes less than 3 minutes</p>
      </div>
    </div>
  );
};

export default WelcomeStep;
