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
  const [unreadChatCount, setUnreadChatCount] = useState(3); // Mock unread count

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
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
