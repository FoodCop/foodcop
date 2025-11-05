import React from 'react';
import { useOnboarding } from '../OnboardingContext';

const WelcomeStep: React.FC = () => {
  const { setCurrentStep } = useOnboarding();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full">
        {/* Logo */}
        <div className="mb-12">
          <h1 className="text-8xl font-bold" style={{ color: '#ff6900' }}>FUZO</h1>
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
      </div>
    </div>
  );
};

export default WelcomeStep;
