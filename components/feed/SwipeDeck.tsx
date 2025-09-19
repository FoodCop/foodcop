import { useState } from "react";
// Note: BotPost type is now handled by useBotPosts hook
import { useBotPosts } from "../hooks/useBotPosts";
import { SwipeCard } from "./SwipeCard";

interface FoodCard {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  profileName: string;
  profileDesignation: string;
  tags: string[];
  isMasterBot?: boolean;
  botData?: {
    username: string;
    specialties?: string[];
    location?: string;
  };
  restaurant?: any; // Restaurant data from the matcher
}

// Note: Bot post conversion is now handled by useBotPosts hook

// Note: Real data is now fetched via useBotPosts hook
// No more hardcoded mock data - only real masterbot posts from Supabase

export function SwipeDeck() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedCards, setLikedCards] = useState<string[]>([]);
  const { feedCards: botPostCards, loading, error } = useBotPosts();

  // Use only real data from Supabase - no mock data fallback
  const foodCards = botPostCards || [];

  const handleSwipe = (direction: "left" | "right") => {
    const currentCard = foodCards[currentIndex];

    if (direction === "right") {
      setLikedCards((prev) => [...prev, currentCard.id]);
    }

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 300);
  };

  const currentCard = foodCards[currentIndex];
  const nextCard = foodCards[currentIndex + 1];
  const hasMoreCards = currentIndex < foodCards.length;

  // Show loading state while fetching Bot Posts
  if (loading) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin text-4xl">🤖</div>
          <h2 className="text-xl font-bold text-[#0B1F3A]">
            Loading Master Bot Posts...
          </h2>
          <p className="text-gray-600">
            Curating personalized restaurant discoveries
          </p>
        </div>
      </div>
    );
  }

  // Show error state if database fetch failed
  if (error) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-[#F14C35]">Connection Error</h2>
          <p className="text-gray-600">Using offline content</p>
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!hasMoreCards) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-[#0B1F3A]">All caught up!</h2>
          <p className="text-gray-600">You've explored all available dishes.</p>
          <p className="text-sm text-[#F14C35]">
            Liked {likedCards.length} out of {foodCards.length} dishes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Next Card (Background) */}
      {nextCard && (
        <SwipeCard
          key={`${nextCard.id}-bg`}
          {...nextCard}
          onSwipe={() => {}}
          isActive={false}
        />
      )}

      {/* Current Card (Foreground) */}
      {currentCard && (
        <SwipeCard
          key={currentCard.id}
          {...currentCard}
          onSwipe={handleSwipe}
          isActive={true}
        />
      )}
    </div>
  );
}
