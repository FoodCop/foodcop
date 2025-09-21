import { useEffect, useState } from "react";
import { isOAuthCallback } from "../utils/authRedirect";
import { RecipesPage } from "./Bites";
import { ChatPage } from "./ChatPage";
import { FeedPage } from "./FeedPage";
import { LandingPage } from "./LandingPage";
import { OnboardingFlow } from "./OnboardingFlow";
import { PlatePage } from "./PlatePage";
import { ScoutPage } from "./ScoutPage";
import { SnapPage } from "./SnapPage";
import { AuthCallback } from "./auth/AuthCallback";
import { AboutUsPage } from "./info/AboutUsPage";
import { AccessibilityPage } from "./info/AccessibilityPage";
import { CareersPage } from "./info/CareersPage";
import { ContactUsPage } from "./info/ContactUsPage";
import { CookiePolicyPage } from "./info/CookiePolicyPage";
import { HelpCenterPage } from "./info/HelpCenterPage";
import { PressPage } from "./info/PressPage";
import { PrivacyPolicyPage } from "./info/PrivacyPolicyPage";
import { RestaurantPartnersPage } from "./info/RestaurantPartnersPage";
import { TermsOfServicePage } from "./info/TermsOfServicePage";

type PageType =
  | "landing"
  | "onboarding"
  | "feed"
  | "scout"
  | "snap"
  | "chat"
  | "recipes"
  | "plate"
  | "auth-callback"
  | "about-us"
  | "careers"
  | "press"
  | "privacy-policy"
  | "terms-of-service"
  | "cookie-policy"
  | "accessibility"
  | "help-center"
  | "contact-us"
  | "restaurant-partners";

interface PageRouterProps {
  onExitDemo?: () => void;
  initialPage?: PageType;
}

export function PageRouter({ initialPage = "landing" }: PageRouterProps = {}) {
  const [currentPage, setCurrentPage] = useState<PageType>(initialPage);

  // Check for OAuth callback and handle appropriately
  useEffect(() => {
    if (isOAuthCallback()) {
      console.log(
        "[PageRouter] OAuth callback detected, navigating to auth callback handler"
      );
      setCurrentPage("auth-callback");
    }
  }, []);

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
          "plate",
          "auth-callback",
          "about-us",
          "careers",
          "press",
          "privacy-policy",
          "terms-of-service",
          "cookie-policy",
          "accessibility",
          "help-center",
          "contact-us",
          "restaurant-partners",
        ].includes(target)
      ) {
        setCurrentPage(target);
      }
    };
    window.addEventListener("navigateToPage", handleNavigateToPage);
    return () =>
      window.removeEventListener("navigateToPage", handleNavigateToPage);
  }, []);

  console.log("[PageRouter] Current page:", currentPage);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "landing":
        return (
          <LandingPage
            onNavigateToSignup={() => {
              console.log("[PageRouter] Navigating to onboarding flow");
              setCurrentPage("onboarding");
            }}
          />
        );

      case "onboarding":
        return (
          <OnboardingFlow
            onComplete={() => {
              console.log("[PageRouter] Onboarding completed");
              console.log("[PageRouter] Changing page from onboarding to feed");
              setCurrentPage("feed");
            }}
            onBack={() => {
              console.log("[PageRouter] Returning to landing page");
              console.log(
                "[PageRouter] Changing page from onboarding to landing"
              );
              setCurrentPage("landing");
            }}
          />
        );

      case "feed":
        return (
          <FeedPage
            onNavigateToScout={() => setCurrentPage("scout")}
            onNavigateToSnap={() => setCurrentPage("snap")}
            onNavigateToChat={() => setCurrentPage("chat")}
            onNavigateToRecipes={() => setCurrentPage("recipes")}
            onNavigateToPlate={() => setCurrentPage("plate")}
          />
        );

      case "scout":
        return (
          <ScoutPage
            onNavigateToFeed={() => setCurrentPage("feed")}
            onNavigateToSnap={() => setCurrentPage("snap")}
            onNavigateToRecipes={() => setCurrentPage("recipes")}
          />
        );

      case "snap":
        return (
          <SnapPage
            onNavigateToFeed={() => setCurrentPage("feed")}
            onNavigateToScout={() => setCurrentPage("scout")}
            onNavigateToRecipes={() => setCurrentPage("recipes")}
          />
        );

      case "chat":
        return <ChatPage />;

      case "recipes":
        return (
          <RecipesPage
            onNavigateToFeed={() => setCurrentPage("feed")}
            onNavigateToScout={() => setCurrentPage("scout")}
            onNavigateToSnap={() => setCurrentPage("snap")}
          />
        );

      case "plate":
        return <PlatePage onNavigateBack={() => setCurrentPage("feed")} />;

      case "auth-callback":
        return (
          <AuthCallback
            onAuthComplete={(destination) => {
              console.log(
                "[PageRouter] Auth completed, redirecting to:",
                destination
              );

              // Map destination paths to page types
              const destinationMap: Record<string, PageType> = {
                "/onboarding": "onboarding",
                "/feed": "feed",
                "/scout": "scout",
                "/snap": "snap",
                "/chat": "chat",
                "/recipes": "recipes",
                "/plate": "plate",
                "/": "landing",
              };

              // Extract pathname from destination
              const pathname = destination.startsWith("/")
                ? destination
                : `/${destination}`;
              const pageType = destinationMap[pathname] || "feed"; // Default to feed for unknown destinations

              console.log(
                `[PageRouter] Mapping destination ${destination} to page type: ${pageType}`
              );
              setCurrentPage(pageType);
            }}
            onAuthError={(error) => {
              console.error("[PageRouter] Auth error:", error);
              setCurrentPage("landing");
            }}
          />
        );

      case "about-us":
        return <AboutUsPage />;

      case "careers":
        return <CareersPage />;

      case "press":
        return <PressPage />;

      case "privacy-policy":
        return <PrivacyPolicyPage />;

      case "terms-of-service":
        return <TermsOfServicePage />;

      case "cookie-policy":
        return <CookiePolicyPage />;

      case "accessibility":
        return <AccessibilityPage />;

      case "help-center":
        return <HelpCenterPage />;

      case "contact-us":
        return <ContactUsPage />;

      case "restaurant-partners":
        return <RestaurantPartnersPage />;

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
