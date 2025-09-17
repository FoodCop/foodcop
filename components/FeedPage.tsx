import { useState } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { FeedHeader } from "./feed/FeedHeader";
import { SwipeDeck } from "./feed/SwipeDeck";

interface FeedPageProps {
  onNavigateToScout?: () => void;
  onNavigateToSnap?: () => void;
  onNavigateToChat?: () => void;
  onNavigateToRecipes?: () => void;
  onNavigateToProfile?: () => void;
  onTogglePageSelector?: () => void;
}

export function FeedPage({
  onNavigateToScout,
  onNavigateToSnap,
  onNavigateToChat,
  onNavigateToRecipes,
  onNavigateToProfile,
  onTogglePageSelector,
}: FeedPageProps) {
  const [activeTab, setActiveTab] = useState("feed"); // Default to feed tab
  const [currentCardIndex, setCurrentCardIndex] = useState(1);
  const [unreadChatCount, setUnreadChatCount] = useState(3); // Mock unread count
  const totalCards = 10;

  const handleTabChange = (tab: string) => {
    if (tab === "scout" && onNavigateToScout) {
      onNavigateToScout();
    } else if (tab === "snap" && onNavigateToSnap) {
      onNavigateToSnap();
    } else if (tab === "bites" && onNavigateToRecipes) {
      onNavigateToRecipes();
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <FeedHeader
        onNavigateToChat={onNavigateToChat}
        onNavigateToProfile={onNavigateToProfile}
        onTogglePageSelector={onTogglePageSelector}
        unreadChatCount={unreadChatCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 pb-20">
        {/* Card Container */}
        <div className="relative w-full max-w-sm h-[550px] mx-auto">
          <SwipeDeck />
        </div>

        {/* Swipe Instructions */}
        <div className="mt-4 text-center space-y-1.5">
          <p className="text-gray-600 text-sm">
            Swipe right to like, left to skip
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="flex space-x-1">
              {Array.from({ length: totalCards }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < currentCardIndex
                      ? "bg-[#F14C35]"
                      : i === currentCardIndex
                      ? "bg-[#F14C35]"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 ml-2">
              {currentCardIndex} of {totalCards}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
