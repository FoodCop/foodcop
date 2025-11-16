import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { useAuth } from '../../auth/AuthProvider';
import { OnboardingService } from '../../../services/onboardingService';
import { toast } from 'sonner';

const WelcomeStep: React.FC = () => {
  const { setCurrentStep } = useOnboarding();
  const { user } = useAuth();
  const [showSkipAlert, setShowSkipAlert] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  // Extract user's first name from Google metadata
  const firstName = user?.user_metadata?.given_name || 
                    user?.user_metadata?.name?.split(' ')[0] || 
                    user?.email?.split('@')[0] || 
                    'there';

  const handleSkip = async () => {
    if (!user?.id) return;
    
    setIsSkipping(true);
    try {
      await OnboardingService.skipOnboarding(user.id);
      toast.success('You can set preferences later in Plate Settings');
      // Redirect to dashboard
      globalThis.location.hash = '#dash';
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      toast.error('Failed to skip. Please try again.');
    } finally {
      setIsSkipping(false);
      setShowSkipAlert(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 flex flex-col bg-white">
        {/* Top Logo */}
        <div className="pt-8 px-6 flex justify-center">
          <img 
            src="/logo_mobile.png" 
            alt="FUZO" 
            className="h-20"
          />
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          {/* User Avatar from Google */}
          {user?.user_metadata?.avatar_url && (
            <div className="mb-6">
              <img 
                src={user.user_metadata.avatar_url} 
                alt={firstName}
                className="w-24 h-24 rounded-full border-4 border-orange-500 shadow-lg"
              />
            </div>
          )}

          {/* Personalized Welcome */}
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome {firstName}!
          </h1>
          
          <p className="text-gray-600 text-lg font-medium mb-2">
            Let's set up your preferences
          </p>
          
          <p className="text-gray-500 text-sm">
            This will take 30 seconds
          </p>

          {/* Illustration */}
          <div className="mt-8 mb-8">
            <div className="w-48 h-48 flex items-center justify-center">
              <div className="text-8xl">🍽️</div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-1 bg-orange-500 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
          </div>
          <p className="text-xs text-gray-500">Step 1 of 2</p>
        </div>

        {/* Bottom Button Section */}
        <div className="px-6 pb-8 space-y-4">
          {/* Continue Button */}
          <button
            onClick={() => setCurrentStep(1)}
            className="w-full bg-orange-500 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg text-lg hover:bg-orange-600 active:scale-95"
          >
            Continue
          </button>

          {/* Skip Button */}
          <button
            onClick={() => setShowSkipAlert(true)}
            className="w-full text-gray-600 font-medium py-3 hover:text-gray-900 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>

      {/* Skip Confirmation Alert */}
      {showSkipAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Skip Personalization?
            </h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              You can always set your food preferences later in Plate Settings to get better recommendations.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSkipAlert(false)}
                disabled={isSkipping}
                className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Continue Setup
              </button>
              <button
                onClick={handleSkip}
                disabled={isSkipping}
                className="flex-1 bg-orange-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {isSkipping ? 'Skipping...' : 'Skip to Dashboard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WelcomeStep;
