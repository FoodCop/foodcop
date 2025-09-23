import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  ChefHat,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Utensils,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "../hooks/useLocation";
import { useMasterbotRecommendations } from "../hooks/useMasterbotRecommendations";
import { useNearbyRestaurants } from "../hooks/useNearbyRestaurants";
import { useSpoonacularRecipes } from "../hooks/useSpoonacularRecipes";
import { Restaurant } from "./ScoutPage";
import { MasterbotPostCard } from "./dashboard/MasterbotPostCard";
import { NearbyRestaurantCard } from "./dashboard/NearbyRestaurantCard";
import { FuzoButton } from "./global/FuzoButton";
import { FuzoInput } from "./global/FuzoInput";
import { RecipeCard } from "./recipes/RecipeCard";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface DashboardPageProps {
  onNavigateToFeed?: () => void;
  onNavigateToScout?: () => void;
  onNavigateToSnap?: () => void;
  onNavigateToBites?: () => void;
  onNavigateToChat?: () => void;
  onNavigateToPlate?: () => void;
}

interface Friend {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastActive: string;
}

const NAVIGATION_SECTIONS = [
  {
    id: "feed",
    label: "Feed",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "scout",
    label: "Scout",
    icon: MapPin,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "snap",
    label: "Snap",
    icon: Camera,
    color: "from-purple-500 to-violet-500",
  },
  {
    id: "bites",
    label: "Bites",
    icon: Utensils,
    color: "from-orange-500 to-amber-500",
  },
  {
    id: "chat",
    label: "Chat",
    icon: MessageCircle,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "plate",
    label: "Plate",
    icon: ChefHat,
    color: "from-red-500 to-pink-500",
  },
];

// Friend Card Component
function FriendCard({ friend }: { friend: Friend }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative">
        <Avatar className="w-12 h-12">
          <AvatarImage src={friend.avatar} alt={friend.name} />
          <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
        </Avatar>
        {friend.isOnline && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
        )}
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-gray-900 line-clamp-1">
          {friend.name}
        </p>
        <p className="text-xs text-gray-500">
          {friend.isOnline ? "Online" : friend.lastActive}
        </p>
      </div>
    </motion.div>
  );
}

export function DashboardPage({
  onNavigateToFeed,
  onNavigateToScout,
  onNavigateToSnap,
  onNavigateToBites,
  onNavigateToChat,
  onNavigateToPlate,
}: DashboardPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get user's real location
  const { location, getCurrentLocation } = useLocation();

  // Fetch Masterbot recommendations
  const {
    posts: masterbotPosts,
    loading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = useMasterbotRecommendations();

  // Fetch nearby restaurants
  const {
    restaurants: nearbyRestaurants,
    loading: restaurantsLoading,
    error: restaurantsError,
    refetch: refetchRestaurants,
  } = useNearbyRestaurants();

  // Fetch Spoonacular recipes
  const {
    recipes: spoonacularRecipes,
    loading: recipesLoading,
    error: recipesError,
    refetch: refetchRecipes,
  } = useSpoonacularRecipes({
    number: 6,
  });

  const [friends] = useState<Friend[]>([
    {
      id: "1",
      name: "Alex Chen",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      isOnline: true,
      lastActive: "now",
    },
    {
      id: "2",
      name: "Sarah Kim",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      isOnline: false,
      lastActive: "2h ago",
    },
    {
      id: "3",
      name: "Mike Johnson",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      isOnline: true,
      lastActive: "now",
    },
    {
      id: "4",
      name: "Emma Wilson",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      isOnline: false,
      lastActive: "1d ago",
    },
  ]);

  const handleSearch = () => {
    setIsLoading(true);
    // Simulate search
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handlePostLike = (postId: string) => {
    console.log("Liked post:", postId);
    // TODO: Implement like functionality
  };

  const handlePostComment = (postId: string) => {
    console.log("Comment on post:", postId);
    // TODO: Implement comment functionality
  };

  const handlePostShare = (postId: string) => {
    console.log("Share post:", postId);
    // TODO: Implement share functionality
  };

  const handlePostSaveToPlate = (postId: string) => {
    console.log("Save post to plate:", postId);
    // TODO: Implement save to plate functionality
  };

  const handleRestaurantClick = (restaurant: Restaurant) => {
    console.log("Restaurant clicked:", restaurant);
    // TODO: Navigate to restaurant details or implement restaurant interaction
  };

  const handleRestaurantMapClick = (restaurant: Restaurant) => {
    console.log("View restaurant on map:", restaurant);
    // TODO: Navigate to Scout page with restaurant focused on map
    onNavigateToScout?.();
  };

  const handleRecipeClick = (recipe: any) => {
    console.log("Recipe clicked:", recipe);
    // TODO: Navigate to recipe details page
  };

  const handleRecipeShare = (recipe: any) => {
    console.log("Share recipe:", recipe);
    // TODO: Implement share functionality
  };

  const handleSectionClick = (sectionId: string) => {
    switch (sectionId) {
      case "feed":
        onNavigateToFeed?.();
        break;
      case "scout":
        onNavigateToScout?.();
        break;
      case "snap":
        onNavigateToSnap?.();
        break;
      case "bites":
        onNavigateToBites?.();
        break;
      case "chat":
        onNavigateToChat?.();
        break;
      case "plate":
        onNavigateToPlate?.();
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#F14C35] to-[#E63E26] text-white">
        {/* Status Bar */}
        <div className="flex justify-between items-center px-4 pt-2 pb-1">
          <span className="text-sm font-medium">9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 bg-white rounded-sm"></div>
            <div className="w-4 h-2 bg-white rounded-sm"></div>
            <div className="w-4 h-2 bg-white rounded-sm"></div>
            <div className="w-4 h-2 bg-white rounded-sm"></div>
          </div>
        </div>

        {/* Location and Cart */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm"></div>
            </div>
            <div>
              <p className="text-sm font-medium">
                {location.isLoading ? "Getting location..." : location.address}
              </p>
              <p className="text-xs opacity-90">
                {location.isLoading
                  ? "Please wait..."
                  : `${location.city}, ${location.country}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={getCurrentLocation}
              disabled={location.isLoading}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  location.isLoading ? "animate-spin" : ""
                }`}
              />
            </button>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <FuzoInput
              placeholder="Search for shops & restaurants"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 placeholder-gray-500 rounded-xl border-0 shadow-lg"
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="bg-white px-4 py-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {NAVIGATION_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <motion.button
                key={section.id}
                onClick={() => handleSectionClick(section.id)}
                className="flex flex-col items-center gap-2 min-w-[60px] group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-r ${section.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700 group-hover:text-[#F14C35] transition-colors">
                  {section.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-20">
        {/* Today's Recommendations Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Today's Recommendations
            </h2>
            <FuzoButton
              variant="tertiary"
              size="sm"
              onClick={refetchPosts}
              disabled={postsLoading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-1 ${postsLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </FuzoButton>
          </div>

          {postsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600 text-sm">
                Failed to load recommendations. Please try again.
              </p>
            </div>
          )}

          {postsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#F14C35] mr-2" />
              <span className="text-gray-600">Loading recommendations...</span>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide">
              {masterbotPosts.map((post) => (
                <MasterbotPostCard
                  key={post.id}
                  post={post}
                  onLike={handlePostLike}
                  onComment={handlePostComment}
                  onShare={handlePostShare}
                  onSaveToPlate={handlePostSaveToPlate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Nearby Places Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Nearby Places</h2>
            <FuzoButton
              variant="tertiary"
              size="sm"
              onClick={refetchRestaurants}
              disabled={restaurantsLoading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-1 ${
                  restaurantsLoading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </FuzoButton>
          </div>

          {restaurantsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600 text-sm">
                Failed to load nearby places. Please try again.
              </p>
            </div>
          )}

          {restaurantsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#F14C35] mr-2" />
              <span className="text-gray-600">Loading nearby places...</span>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {nearbyRestaurants.length > 0 ? (
                nearbyRestaurants.map((restaurant) => (
                  <NearbyRestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    onClick={() => handleRestaurantClick(restaurant)}
                    onMapClick={() => handleRestaurantMapClick(restaurant)}
                  />
                ))
              ) : (
                <div className="text-center py-8 w-full">
                  <p className="text-gray-600 mb-2 text-sm">
                    No nearby places found
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    Try refreshing or check your location settings
                  </p>
                  <button
                    onClick={refetchRestaurants}
                    className="text-[#F14C35] font-medium hover:underline text-sm"
                  >
                    Refresh
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Today's Recipes Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Today's Recipes</h2>
            <FuzoButton
              variant="tertiary"
              size="sm"
              onClick={refetchRecipes}
              disabled={recipesLoading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-1 ${
                  recipesLoading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </FuzoButton>
          </div>

          {recipesError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600 text-sm">
                Failed to load recipes. Please try again.
              </p>
            </div>
          )}

          {recipesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#F14C35] mr-2" />
              <span className="text-gray-600">Loading recipes...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 items-stretch">
              {spoonacularRecipes.length > 0 ? (
                spoonacularRecipes.map((recipe) => (
                  <div key={recipe.id} className="flex">
                    <RecipeCard
                      recipe={recipe}
                      onClick={() => handleRecipeClick(recipe)}
                      onShare={() => handleRecipeShare(recipe)}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8">
                  <p className="text-gray-600 mb-2 text-sm">No recipes found</p>
                  <p className="text-xs text-gray-500 mb-2">
                    Try refreshing or check your connection
                  </p>
                  <button
                    onClick={refetchRecipes}
                    className="text-[#F14C35] font-medium hover:underline text-sm"
                  >
                    Refresh
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Friends Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Your Friends</h2>
            <FuzoButton variant="tertiary" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Friends
            </FuzoButton>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {friends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        </div>

        {/* Chef/Restaurant CTA */}
        <motion.div
          className="bg-gradient-to-r from-[#F14C35] to-[#E63E26] rounded-2xl p-6 text-white text-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ChefHat className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">
            Are you a Chef or Restaurant?
          </h3>
          <p className="text-sm opacity-90 mb-4">
            Join Fuzo and showcase your culinary creations to thousands of food
            lovers
          </p>
          <FuzoButton
            variant="secondary"
            className="bg-white text-[#F14C35] hover:bg-gray-100"
          >
            Sign Up Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </FuzoButton>
        </motion.div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-2xl p-6 flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#F14C35]" />
              <span className="text-gray-900 font-medium">Searching...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
