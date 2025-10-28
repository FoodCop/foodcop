import React from 'react';
import { FuzoNavigation } from './FuzoNavigation';
import { HeroSection } from './HeroSection';
import { PinFoodSection } from './PinFoodSection';
import { CookWatchSection } from './CookWatchSection';
import { FoodStoryboardSection } from './FoodStoryboardSection';
import { TakoBuddySection } from './TakoBuddySection';
import { ExploreFoodSection } from './ExploreFoodSection';
import { FuzoFooter } from './FuzoFooter';

interface LandingPageProps {
  onNavigateToSignup?: () => void;
}

export function LandingPage({ onNavigateToSignup }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      <FuzoNavigation onNavigateToSignup={onNavigateToSignup} />
      <main>
        <HeroSection onNavigateToSignup={onNavigateToSignup} />
        <PinFoodSection />
        <CookWatchSection />
        <FoodStoryboardSection />
        <TakoBuddySection />
        <ExploreFoodSection />
      </main>
      <FuzoFooter />
    </div>
  );
}