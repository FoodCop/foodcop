import { useAuth } from './AuthProvider';
import { SupabaseAuth } from './SupabaseAuth';
import { ProfileService } from '../../services/profileService';
import { useEffect, useState, useRef } from 'react';

export default function AuthPage() {
  const { user, session, loading } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const hasCheckedOnboarding = useRef(false);

  // Check onboarding status when user is authenticated (only once)
  useEffect(() => {
    if (user && session && !hasCheckedOnboarding.current) {
      hasCheckedOnboarding.current = true;
      setCheckingOnboarding(true);
      checkOnboardingStatus();
    }
  }, [user, session]);

  const checkOnboardingStatus = async () => {
    try {
      const result = await ProfileService.hasCompletedOnboarding();
      
      if (result.success && result.data === true) {
        // User has completed onboarding, redirect to dashboard
        console.log('✅ User has completed onboarding, redirecting to dashboard');
        window.location.hash = '#dash';
      } else {
        // User needs onboarding, redirect to onboarding flow
        console.log('🎯 User needs onboarding, redirecting to onboarding flow');
        window.location.hash = '#onboarding';
      }
    } catch (error) {
      console.error('❌ Error checking onboarding status:', error);
      // On error, assume user needs onboarding
      window.location.hash = '#onboarding';
    } finally {
      setCheckingOnboarding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    // Show loading while checking onboarding status
    if (checkingOnboarding) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-4">🔄</div>
            <div className="text-blue-600 font-bold text-xl mb-2">
              Setting up your account...
            </div>
            <p className="text-gray-600 mb-6">
              Just a moment while we prepare your personalized FUZO experience!
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F14C35] mx-auto"></div>
          </div>
        </div>
      );
    }

    // This should not be reached since we redirect immediately after auth
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-4xl sm:text-5xl md:text-6xl mb-4">🎉</div>
          <div className="text-green-600 font-bold text-xl mb-2">
            Welcome to FUZO!
          </div>
          <p className="text-gray-600 mb-6">
            Great to have you aboard! Redirecting you now...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="text-3xl sm:text-4xl mb-4">🍜</div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">Join the FUZO Community</h2>
          <p className="text-gray-600">Ready to discover amazing food? Sign in to start your culinary adventure with Tako!</p>
        </div>
        
        <SupabaseAuth />
        
        <div className="mt-6 text-center">
          <div className="bg-orange-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-orange-800 font-medium">🎯 What's Next?</p>
            <p className="text-xs text-orange-700 mt-1">
              After signing in, you'll set up your food preferences and start discovering personalized content!
            </p>
          </div>
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}