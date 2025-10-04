"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SplashScreen } from "@/components/ui/splash-screen";
import { OnboardingFlow } from "@/components/ui/onboarding-flow";

export default function OnboardingPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const router = useRouter();

  const handleSplashComplete = () => {
    setShowSplash(false);
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = () => {
    // Navigate to sign-in or main app
    router.push("/auth/signin");
  };

  const handleSkipOnboarding = () => {
    // Navigate directly to sign-in
    router.push("/auth/signin");
  };

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