import { FuzoFooter } from "./global/FuzoFooter";
import { FuzoNavigation } from "./global/FuzoNavigation";
import { CookWatchSection } from "./landing/CookWatchSection";
import { ExploreFoodSection } from "./landing/ExploreFoodSection";
import { FoodStoryboardSection } from "./landing/FoodStoryboardSection";
import { HeroSection } from "./landing/HeroSection";
import { PinFoodSection } from "./landing/PinFoodSection";
import { TakoBuddySection } from "./landing/TakoBuddySection";

interface LandingPageProps {
  onNavigateToSignup?: () => void;
}

export function LandingPage({ onNavigateToSignup }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* <FigmaStatusBadge /> removed due to missing definition */}
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

      {/* Google Auth Tester removed due to missing definition */}
    </div>
  );
}
