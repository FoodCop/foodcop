import { Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useBotPosts } from "../hooks/useBotPosts";
import { SaveToPlate } from "../plate/SaveToPlate";
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
  const [currentCard, setCurrentCard] = useState<FoodCard | null>(null);
  const [cardCount, setCardCount] = useState(1);
  const [likedCards, setLikedCards] = useState<string[]>([]);
  const [skippedCards, setSkippedCards] = useState<string[]>([]);
  const { feedCards: botPostCards, loading, error } = useBotPosts();

  console.log("🔄 SwipeDeck: Component rendered", {
    botPostCardsLength: botPostCards?.length || 0,
    loading,
    error,
    hasCurrentCard: !!currentCard,
  });

  // Use master bot posts with restaurant data
  const foodCards = botPostCards || [];

  // Get random card from the available cards
  const getRandomCard = () => {
    if (foodCards.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * foodCards.length);
    return foodCards[randomIndex];
  };

  // Initialize with a random card
  useEffect(() => {
    console.log("🔄 SwipeDeck useEffect:", {
      foodCardsLength: foodCards.length,
      hasCurrentCard: !!currentCard,
      loading,
      error,
    });

    if (foodCards.length > 0 && !currentCard) {
      console.log(
        "🎯 Setting current card from",
        foodCards.length,
        "available cards"
      );
      setCurrentCard(getRandomCard());
    }
  }, [foodCards]);

  // Get next random card
  const getNextCard = () => {
    setCurrentCard(getRandomCard());
    setCardCount((prev) => prev + 1);
  };

  const handleSwipe = (direction: "left" | "right" | "up" | "down") => {
    if (!currentCard) return;

    // Profile training data collection
    if (direction === "right") {
      setLikedCards((prev) => [...prev, currentCard.id]);
      // TODO: Save to user profile for AI training
    } else if (direction === "left") {
      setSkippedCards((prev) => [...prev, currentCard.id]);
      // TODO: Save to user profile for AI training
    } else if (direction === "up") {
      // Send to friend
      handleShare();
    } else if (direction === "down") {
      // Save to plate
      handleSaveToPlate();
    }

    // Get next card after a short delay
    setTimeout(() => {
      getNextCard();
    }, 300);
  };

  const handleSkip = () => {
    if (!currentCard) return;
    setSkippedCards((prev) => [...prev, currentCard.id]);
    // TODO: Save to user profile for AI training
    getNextCard();
  };

  const handleShare = () => {
    if (!currentCard) return;
    // TODO: Share functionality
    console.log("Shared:", currentCard.title);
    getNextCard();
  };

  const handleSaveToPlate = () => {
    if (!currentCard) return;
    console.log("Save to plate:", currentCard.title);
    // The SaveToPlate component will handle the actual saving
  };

  // Show loading state while fetching restaurant data
  if (loading) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin text-4xl">🍽️</div>
          <h2 className="text-xl font-bold text-[#0B1F3A]">
            Loading Restaurants...
          </h2>
          <p className="text-gray-600">
            Discovering amazing restaurants for you
          </p>
        </div>
      </div>
    );
  }

  // Show error state if restaurant data fetch failed
  if (error) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-[#F14C35]">Loading Error</h2>
          <p className="text-gray-600">Unable to load restaurant data</p>
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-[#0B1F3A]">Keep exploring!</h2>
          <p className="text-gray-600">
            Discover more amazing restaurants around the world.
          </p>
          <p className="text-sm text-[#F14C35]">
            Liked {likedCards.length} • Skipped {skippedCards.length}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Current Card */}
      <SwipeCard
        key={currentCard.id}
        {...currentCard}
        onSwipe={handleSwipe}
        isActive={true}
        onSkip={handleSkip}
        onShare={handleShare}
        onSaveToPlate={handleSaveToPlate}
      />

      {/* Desktop Action Buttons - Below Card */}
      <div className="hidden md:flex absolute top-full left-1/2 transform -translate-x-1/2 z-20 space-x-4 mt-6">
        <button
          onClick={handleSkip}
          className="w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
        >
          <X className="w-6 h-6" />
        </button>
        <SaveToPlate
          itemId={currentCard.id}
          itemType="restaurant"
          title={currentCard.title}
          imageUrl={currentCard.image}
          variant="icon"
          size="lg"
          onSaved={handleSaveToPlate}
        />
        <button
          onClick={handleShare}
          className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Action Buttons - Below Card */}
      <div className="md:hidden flex absolute top-full left-1/2 transform -translate-x-1/2 z-20 space-x-4 mt-6">
        <button
          onClick={handleSkip}
          className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>
        <SaveToPlate
          itemId={currentCard.id}
          itemType="restaurant"
          title={currentCard.title}
          imageUrl={currentCard.image}
          variant="icon"
          size="md"
          onSaved={handleSaveToPlate}
        />
        <button
          onClick={handleShare}
          className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
