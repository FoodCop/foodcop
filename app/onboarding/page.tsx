"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { SplashScreen } from "@/components/ui/splash-screen";
import { OnboardingFlow } from "@/components/ui/onboarding-flow";

export default function OnboardingPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if user is not authenticated, but be patient with loading
  useEffect(() => {
    // Only redirect after loading is complete and we're sure there's no user
    if (!loading && !user) {
      console.log('No user found after loading complete, redirecting to signin');
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = () => {
    // Navigate to profile setup step
    router.push("/onboarding/profile");
  };

  const handleSkipOnboarding = () => {
    // Skip intro and go directly to profile setup
    router.push("/onboarding/profile");
  };

  // Show loading while checking auth - be more patient
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {showSplash && (
        <SplashScreen 
          onComplete={handleSplashComplete}
          duration={3000} // 3 seconds splash
        />
      )}
      
      {showOnboarding && (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onSkip={handleSkipOnboarding}
        />
      )}
    </div>
  );
}