import { ArrowLeft, Menu } from "lucide-react";
import React, { useState } from "react";
import { RecipesPage } from "./Bites";
import { ChatPage } from "./ChatPage";
import { FeedPage } from "./FeedPage";
import { LandingPage } from "./LandingPage";
import { OnboardingFlow } from "./OnboardingFlow";
import { ProfilePage } from "./ProfilePage";
import { ScoutPage } from "./ScoutPage";
import { SnapPage } from "./SnapPage";
import { UniversalHeader } from "./UniversalHeader";

type PageType =
  | "landing"
  | "feed"
  | "onboarding"
  | "scout"
  | "snap"
  | "chat"
  | "recipes"
  | "profile";

interface Page {
  id: PageType;
  title: string;
  description: string;
}

const pages: Page[] = [
  {
    id: "landing",
    title: "Landing Page",
    description: "FUZO brand showcase with Tako mascot and feature sections",
  },
  {
    id: "feed",
    title: "Feed Page",
    description: "Tinder-style swipe interface for food discovery",
  },
  {
    id: "recipes",
    title: "Bites (Recipes)",
    description:
      "Recipe discovery hub with detailed instructions and community",
  },
  {
    id: "scout",
    title: "Scout Page",
    description: "Map-based restaurant discovery with detailed views",
  },
  {
    id: "snap",
    title: "Snap Page",
    description: "Camera interface with tagging and gamification",
  },
  {
    id: "chat",
    title: "Chat Page",
    description: "Stream Chat integration with comprehensive messaging",
  },
  {
    id: "profile",
    title: "Profile Page",
    description:
      "User identity hub with crew, plate, photos, rewards, and points",
  },
  {
    id: "onboarding",
    title: "Onboarding Flow",
    description: "Complete 8-screen signup and onboarding experience",
  },
];

interface PageRouterProps {
  onExitDemo?: () => void;
  initialPage?: PageType;
}

export function PageRouter({
  onExitDemo,
  initialPage = "landing",
}: PageRouterProps = {}) {
  const [currentPage, setCurrentPage] = useState<PageType>(initialPage);
  const [showPageSelector, setShowPageSelector] = useState(false);

  // Log initial page setup
  React.useEffect(() => {
    console.log("🎯 PageRouter: Initialized with page:", initialPage);
  }, [initialPage]);

  React.useEffect(() => {
    console.log("📱 PageRouter: Current page changed to:", currentPage);

    const handleNavigateToProfile = () => {
      console.log("🔄 Navigation: Navigating to profile");
      setCurrentPage("profile");
    };

    const handleNavigateToPage = (event: CustomEvent) => {
      const pageId = event.detail as PageType;
      if (pages.find((page) => page.id === pageId)) {
        console.log("🔄 Navigation: Navigating to page:", pageId);
        setCurrentPage(pageId);
      } else {
        console.warn("⚠️ Navigation: Unknown page requested:", pageId);
      }
    };

    window.addEventListener("navigateToProfile", handleNavigateToProfile);
    window.addEventListener(
      "navigateToPage",
      handleNavigateToPage as EventListener
    );

    return () => {
      window.removeEventListener("navigateToProfile", handleNavigateToProfile);
      window.removeEventListener(
        "navigateToPage",
        handleNavigateToPage as EventListener
      );
    };
  }, [currentPage]);

  const renderCurrentPage = () => {
    console.log("🎬 PageRouter: Rendering page:", currentPage);

    switch (currentPage) {
      case "landing":
        return (
          <LandingPage
            onNavigateToSignup={() => setCurrentPage("onboarding")}
          />
        );
      case "feed":
        return (
          <FeedPage
            onNavigateToScout={() => setCurrentPage("scout")}
            onNavigateToSnap={() => setCurrentPage("snap")}
            onNavigateToChat={() => setCurrentPage("chat")}
            onNavigateToRecipes={() => setCurrentPage("recipes")}
            onNavigateToProfile={() => setCurrentPage("profile")}
            onTogglePageSelector={togglePageSelector}
          />
        );
      case "recipes":
        return <RecipesPage onNavigateBack={() => setCurrentPage("feed")} />;
      case "scout":
        return <ScoutPage onNavigateBack={() => setCurrentPage("feed")} />;
      case "snap":
        return <SnapPage />;
      case "chat":
        return <ChatPage />;
      case "profile":
        return <ProfilePage onNavigateBack={() => setCurrentPage("feed")} />;
      case "onboarding":
        return (
          <OnboardingFlow
            onComplete={() => setCurrentPage("feed")}
            onBack={() => setCurrentPage("landing")}
          />
        );
      default:
        console.warn(
          "⚠️ PageRouter: Unknown page, defaulting to landing:",
          currentPage
        );
        return (
          <LandingPage
            onNavigateToSignup={() => setCurrentPage("onboarding")}
          />
        );
    }
  };

  const togglePageSelector = () => {
    console.log("🎛️ UI: Toggling page selector");
    setShowPageSelector(!showPageSelector);
  };

  const selectPage = (pageId: PageType) => {
    console.log("🎯 UI: Page selected:", pageId);
    setCurrentPage(pageId);
    setShowPageSelector(false);
  };

  const currentPageInfo = pages.find((page) => page.id === currentPage);

  // Helper function to determine if a page needs the universal header
  const getHeaderConfig = (pageId: PageType) => {
    switch (pageId) {
      case "landing":
      case "onboarding":
        return null; // These pages have their own navigation
      case "feed":
        return null; // Feed has its own header with FUZO branding
      case "scout":
        return null; // Scout has its own complex header with search and tabs
      case "snap":
      case "recipes":
      case "profile":
      case "chat":
        return {
          title: currentPageInfo?.title,
          showChatButton: pageId !== "chat",
          showProfileButton: pageId !== "profile",
        };
      default:
        return {
          title: currentPageInfo?.title,
          showChatButton: true,
          showProfileButton: true,
        };
    }
  };

  const headerConfig = getHeaderConfig(currentPage);
  const [unreadChatCount] = useState(2); // Mock unread count

  return (
    <div className="relative min-h-screen">
      {/* Fixed Hamburger Menu Button */}
      <button
        onClick={togglePageSelector}
        className="fixed top-4 left-4 z-50 w-12 h-12 bg-[#F14C35] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#E03A28] transition-colors"
        title="Switch Screens"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Page Selector Overlay */}
      {showPageSelector && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 m-4 max-w-md w-full max-h-[80vh] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#0B1F3A]">Select Page</h2>
              <div className="flex items-center space-x-2">
                {onExitDemo && (
                  <button
                    onClick={() => {
                      onExitDemo();
                      setShowPageSelector(false);
                    }}
                    className="px-3 py-1.5 bg-[#F14C35] text-white rounded-lg hover:bg-[#E03A28] transition-colors text-sm font-medium"
                  >
                    Exit Demo
                  </button>
                )}
                <button
                  onClick={togglePageSelector}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2 -mr-2">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => selectPage(page.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    currentPage === page.id
                      ? "border-[#F14C35] bg-[#F14C35]/5"
                      : "border-gray-200 hover:border-[#F14C35]/50 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-[#0B1F3A] mb-1">
                        {page.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {page.description}
                      </p>
                    </div>
                    {currentPage === page.id && (
                      <div className="w-3 h-3 bg-[#F14C35] rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Universal Header - Only shown on specific pages */}
      {headerConfig && (
        <UniversalHeader
          onNavigateToChat={() => setCurrentPage("chat")}
          onNavigateToProfile={() => setCurrentPage("profile")}
          onTogglePageSelector={togglePageSelector}
          unreadChatCount={unreadChatCount}
          {...headerConfig}
        />
      )}

      {/* Current Page Info Badge */}
      <div className="fixed bottom-4 right-4 z-40 space-y-2">
        {onExitDemo && (
          <button
            onClick={onExitDemo}
            className="block w-full px-3 py-1.5 bg-[#F14C35] text-white rounded-full hover:bg-[#E03A28] transition-colors text-sm font-medium shadow-sm"
          >
            Exit Demo
          </button>
        )}
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-[#F14C35] rounded-full"></div>
            <span className="text-xs font-medium text-[#0B1F3A]">
              {currentPageInfo?.title}
            </span>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className={headerConfig ? "pt-0" : ""}>{renderCurrentPage()}</div>
    </div>
  );
}
