"use client";

import { useState } from "react";
import { SplashScreen } from "@/components/ui/splash-screen";
import { OnboardingFlow } from "@/components/ui/onboarding-flow";
import { Button } from "@/components/ui/button";

export default function OnboardingDemo() {
  const [showSplash, setShowSplash] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [demoComplete, setDemoComplete] = useState(false);

  const startSplashDemo = () => {
    setDemoComplete(false);
    setShowSplash(true);
    setShowOnboarding(false);
  };

  const startOnboardingDemo = () => {
    setDemoComplete(false);
    setShowSplash(false);
    setShowOnboarding(true);
  };

  const startFullDemo = () => {
    setDemoComplete(false);
    setShowSplash(true);
    setShowOnboarding(false);
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setDemoComplete(true);
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
    setDemoComplete(true);
  };

  const resetDemo = () => {
    setShowSplash(false);
    setShowOnboarding(false);
    setDemoComplete(false);
  };

  return (
    <div className="min-h-screen">
      {/* Demo Controls */}
      {!showSplash && !showOnboarding && (
        <div className="container mx-auto max-w-md p-8 flex flex-col items-center justify-center min-h-screen">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#0c1d2e] mb-4 font-['DM_Sans',_sans-serif]">
              FUZO Onboarding Demo
            </h1>
            <p className="text-[#748ba0] mb-8">
              {demoComplete 
                ? "🎉 Onboarding completed! This would normally navigate to the sign-in screen." 
                : "Test the complete splash-to-onboarding experience extracted from Figma."
              }
            </p>
          </div>

          <div className="space-y-4 w-full">
            <Button
              onClick={startFullDemo}
              className="w-full h-12 bg-[#ff9500] hover:bg-[#ff9500]/90 text-white font-bold"
            >
              ▶️ Full Demo (Splash → Onboarding)
            </Button>
            
            <Button
              onClick={startSplashDemo}
              variant="outline"
              className="w-full h-12 border-[#ff9500] text-[#ff9500] hover:bg-[#ff9500] hover:text-white"
            >
              🎨 Splash Screen Only
            </Button>
            
            <Button
              onClick={startOnboardingDemo}
              variant="outline"
              className="w-full h-12 border-[#ff9500] text-[#ff9500] hover:bg-[#ff9500] hover:text-white"
            >
              📱 Onboarding Flow Only
            </Button>

            {demoComplete && (
              <Button
                onClick={resetDemo}
                variant="ghost"
                className="w-full h-12 text-[#748ba0] hover:text-[#ff9500]"
              >
                🔄 Reset Demo
              </Button>
            )}
          </div>

          <div className="mt-8 p-4 bg-[#f6f9f9] rounded-lg text-sm text-[#748ba0]">
            <h3 className="font-semibold mb-2 text-[#0c1d2e]">Features Demonstrated:</h3>
            <ul className="space-y-1 text-xs">
              <li>✅ Exact Figma design replication</li>
              <li>✅ Pixel-perfect positioning</li>
              <li>✅ ShadCN component architecture</li>
              <li>✅ Responsive mobile design</li>
              <li>✅ Smooth transitions & animations</li>
              <li>✅ Progress indicators</li>
              <li>✅ Navigation controls</li>
            </ul>
          </div>
        </div>
      )}

      {/* Splash Screen */}
      {showSplash && (
        <SplashScreen 
          onComplete={handleSplashComplete}
          duration={3000}
        />
      )}
      
      {/* Onboarding Flow */}
      {showOnboarding && (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onSkip={handleSkipOnboarding}
        />
      )}
    </div>
  );
}