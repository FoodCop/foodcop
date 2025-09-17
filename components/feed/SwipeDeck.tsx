import { useState } from "react";
import {
  BotPost,
  getMasterBotById,
  getMasterBotPostsForFeed,
} from "../constants/masterBotsData";
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

// Convert Master Bot posts to feed cards
const convertBotPostToCard = (post: BotPost): FoodCard => {
  const bot = getMasterBotById(post.id.split("-")[1] || "");
  return {
    id: post.id,
    image: post.image,
    title: post.title,
    subtitle: post.content,
    profileName: bot?.name || "Master Explorer",
    profileDesignation: bot?.specialty[0] || "Food Explorer",
    tags: post.tags.slice(0, 4),
    isMasterBot: true,
    botData: {
      username: bot?.username || "@master_explorer",
      specialties: bot?.specialty || [],
      location: post.location,
    },
  };
};

// Mix Master Bot posts with regular content
const masterBotPosts = getMasterBotPostsForFeed(8);
const regularCards: FoodCard[] = [
  {
    id: "regular-1",
    image:
      "https://images.unsplash.com/photo-1664232802830-592394491fd2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwYnVyZ2VyJTIwZm9vZCUyMHBob3RvZ3JhcGh5fGVufDF8fHx8MTc1Njc5MDY0MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Today's Special – Gourmet Burger",
    subtitle:
      "Discovering hidden gems and culinary wonders around the world. This artisanal burger combines premium beef with house-made sauces.",
    profileName: "Chef Maria",
    profileDesignation: "Head Chef",
    tags: ["savory", "burger", "meat", "gourmet"],
  },
  {
    id: "regular-2",
    image:
      "https://images.unsplash.com/photo-1607257882338-70f7dd2ae344?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNzZXJ0JTIwY2FrZSUyMGZvb2QlMjBwaG90b2dyYXBoeXxlbnwxfHx8fDE3NTY4MzM2MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Decadent Chocolate Creation",
    subtitle:
      "An indulgent dessert experience that will satisfy your sweetest cravings. Made with premium Belgian chocolate.",
    profileName: "Pastry Chef Anna",
    profileDesignation: "Dessert Specialist",
    tags: ["dessert", "chocolate", "sweet", "indulgent"],
  },
];

// Create mixed feed with Master Bot content
const botCards = masterBotPosts.map(convertBotPostToCard);
const foodCards: FoodCard[] = [...botCards, ...regularCards];

export function SwipeDeck() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedCards, setLikedCards] = useState<string[]>([]);
  const { feedCards: botPostCards, loading, error } = useBotPosts();

  // Combine bot post cards with static regular cards
  const allCards = [...(botPostCards || []), ...regularCards];
  const foodCards =
    allCards.length > 0 ? allCards : [...botCards, ...regularCards]; // Fallback to static data

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
