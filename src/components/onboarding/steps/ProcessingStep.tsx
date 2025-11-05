import React, { useEffect, useState } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { AIPreferenceService } from '../../../services/aiPreferenceService';
import { OnboardingService } from '../../../services/onboardingService';
import { useAuth } from '../../auth/AuthProvider';

const ProcessingStep: React.FC = () => {
  const { state } = useOnboarding();
  const { user } = useAuth();
  // useNavigate removed to avoid adding react-router-dom as a hard dependency for this app's hash-based routing
  // We'll use hash navigation to integrate with the existing routing in App.tsx
  const [stage, setStage] = useState<'analyzing' | 'prefetching' | 'complete' | 'error'>('analyzing');
  const [statusMessage, setStatusMessage] = useState('Analyzing your preferences...');

  useEffect(() => {
    const processOnboarding = async () => {
      if (!user?.id) return;

      try {
        // Stage 1: AI Preference Extraction
        setStage('analyzing');
        setStatusMessage('Analyzing your preferences...');
        
        const preferences = await AIPreferenceService.extractPreferences(state.responses);
        
        // Stage 2: Save to Database
        setStatusMessage('Setting up your profile...');
        await OnboardingService.savePreferences(user.id, preferences);

        // Stage 3: Prefetch Dashboard Data
        setStage('prefetching');
        setStatusMessage('Loading personalized recommendations...');
        
        // Simulate prefetch time for UX
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Stage 4: Complete
        setStage('complete');
        setStatusMessage('All set! Taking you to your dashboard...');
        
        // Redirect to dashboard after brief delay using hash routing
        setTimeout(() => {
          window.location.hash = '#dash';
        }, 1500);

      } catch (error) {
        console.error('Onboarding processing error:', error);
        setStage('error');
        setStatusMessage('Something went wrong. Please try again.');
      }
    };

    processOnboarding();
  }, [state.responses, user?.id]);

  const getProgressPercentage = () => {
    switch (stage) {
      case 'analyzing': return 33;
      case 'prefetching': return 66;
      case 'complete': return 100;
      case 'error': return 0;
      default: return 0;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full">
        {/* Animation */}
        <div className="flex justify-center mb-8">
          {stage === 'error' ? (
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-500 text-4xl">✕</span>
            </div>
          ) : stage === 'complete' ? (
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
              <span className="text-green-500 text-4xl">✓</span>
            </div>
          ) : (
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-gray-200"></div>
              <div className="w-20 h-20 rounded-full border-4 border-fuzo-primary border-t-transparent absolute top-0 left-0 animate-spin"></div>
            </div>
          )}
        </div>

        {/* Status Message */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
          {stage === 'error' ? 'Oops!' : stage === 'complete' ? 'Welcome to FUZO!' : 'Setting Up Your Profile'}
        </h2>
        <p className="text-gray-600 text-center mb-8">{statusMessage}</p>

        {/* Progress Bar */}
        {stage !== 'error' && (
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-fuzo-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              {getProgressPercentage()}% complete
            </p>
          </div>
        )}

        {/* Stage Indicators */}
        {stage !== 'error' && (
          <div className="space-y-3">
            <div className={`flex items-center gap-3 ${stage === 'analyzing' ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                getProgressPercentage() >= 33 ? 'bg-fuzo-primary' : 'bg-gray-300'
              }`}>
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-sm text-gray-700">Analyzing food preferences</span>
            </div>
            <div className={`flex items-center gap-3 ${stage === 'prefetching' ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                getProgressPercentage() >= 66 ? 'bg-fuzo-primary' : 'bg-gray-300'
              }`}>
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-sm text-gray-700">Finding personalized content</span>
            </div>
            <div className={`flex items-center gap-3 ${stage === 'complete' ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                getProgressPercentage() >= 100 ? 'bg-fuzo-primary' : 'bg-gray-300'
              }`}>
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-sm text-gray-700">Setting up your dashboard</span>
            </div>
          </div>
        )}

        {/* Error Retry Button */}
        {stage === 'error' && (
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-fuzo-primary hover:bg-fuzo-primary-dark text-white font-semibold py-3 rounded-xl transition-all"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ProcessingStep;
