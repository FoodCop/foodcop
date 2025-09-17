import { useEffect, useState } from "react";
import { ChatPage } from "./ChatPage";
import { FeedPage } from "./FeedPage";
import { LandingPage } from "./LandingPage";
import { OnboardingFlow } from "./OnboardingFlow";
import { ProfilePage } from "./ProfilePage";
import { RecipesPage } from "./RecipesPage";
import { ScoutPage } from "./ScoutPage";
import { SnapPage } from "./SnapPage";

type PageType =
  | "landing"
  | "onboarding"
  | "feed"
  | "scout"
  | "snap"
  | "chat"
  | "recipes"
  | "profile";

interface PageRouterProps {
  onExitDemo?: () => void;
  initialPage?: PageType;
}

export function PageRouter({
  onExitDemo,
  initialPage = "landing",
}: PageRouterProps = {}) {
  const [currentPage, setCurrentPage] = useState<PageType>(initialPage);

  // Listen for custom navigation events dispatched from global navigation (hamburger menu)
  useEffect(() => {
    const handleNavigateToPage = (e: Event) => {
      const custom = e as CustomEvent<PageType>;
      const target = custom.detail;
      if (
        target &&
        [
          "landing",
          "onboarding",
          "feed",
          "scout",
          "snap",
          "chat",
          "recipes",
          "profile",
        ].includes(target)
      ) {
        setCurrentPage(target);
      }
    };
    window.addEventListener("navigateToPage", handleNavigateToPage);
    return () =>
      window.removeEventListener("navigateToPage", handleNavigateToPage);
  }, []);

  console.log("🎯 PageRouter: Current page:", currentPage);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "landing":
        return (
          <LandingPage
            onNavigateToSignup={() => {
              console.log("🚀 Navigating to OnboardingFlow");
              setCurrentPage("onboarding");
            }}
          />
        );

      case "onboarding":
        return (
          <OnboardingFlow
            onComplete={() => {
              console.log("✅ Onboarding completed - ready for Feed");
              setCurrentPage("feed");
            }}
            onBack={() => {
              console.log("⬅️ Going back to Landing");
              setCurrentPage("landing");
            }}
          />
        );

      case "feed":
        return <FeedPage />;

      case "scout":
        return <ScoutPage />;

      case "snap":
        return <SnapPage />;

      case "chat":
        return <ChatPage />;

      case "recipes":
        return <RecipesPage />;

      case "profile":
        return <ProfilePage />;

      default:
        return (
          <LandingPage
            onNavigateToSignup={() => setCurrentPage("onboarding")}
          />
        );
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {renderCurrentPage()}
    </div>
  );
}
