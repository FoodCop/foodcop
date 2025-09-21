import { FuzoFooter } from "./global/FuzoFooter";
import { FuzoNavigation } from "./global/FuzoNavigation";
import { CookWatchSection } from "./landing/CookWatchSection";
import { DailyPicksSection } from "./landing/DailyPicksSection";
import { ExploreFoodSection } from "./landing/ExploreFoodSection";
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
        <DailyPicksSection onNavigateToSignup={onNavigateToSignup} />
        <PinFoodSection onNavigateToSignup={onNavigateToSignup} />
        <ExploreFoodSection onNavigateToSignup={onNavigateToSignup} />
        <CookWatchSection onNavigateToSignup={onNavigateToSignup} />
        <TakoBuddySection onNavigateToSignup={onNavigateToSignup} />
      </main>
      <FuzoFooter />

      {/* Google Auth Tester removed due to missing definition */}
    </div>
  );
}
