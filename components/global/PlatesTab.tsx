import { motion } from "framer-motion";
import {
  Cake,
  Calendar,
  Clock,
  Coffee,
  Filter,
  Grid,
  Heart,
  List,
  MapPin,
  Search,
  Share2,
  Star,
  Trash2,
  Utensils,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { savedItemsService } from "../services/savedItemsService";
import { FuzoTabs } from "./FuzoTabs";

export interface Restaurant {
  id: string;
  placeId: string;
  name: string;
  image: string;
  rating: number;
  cuisine: string[];
  priceLevel: number;
  address: string;
  coordinates: { lat: number; lng: number };
  isSaved: boolean;
  photos: any[];
  distance?: string;
  isOpen?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  cuisine: string;
  difficulty: string;
  cookingTime: number;
}

type PlateFilter = "all" | "restaurants" | "recipes";
type SortBy = "recent" | "rating" | "distance";
type ViewMode = "grid" | "list";

interface PlatesTabProps {
  // Optional props for different contexts
  variant?: "profile" | "scout";
  onRestaurantClick?: (restaurant: Restaurant) => void;
  onRestaurantUnsave?: (placeId: string) => void; // FIXED: Now accepts placeId string instead of Restaurant object
  onRecipeClick?: (recipe: Recipe) => void;
  showSearch?: boolean;
  showFilters?: boolean;
  showViewToggle?: boolean;
  showStats?: boolean;
  className?: string;
}

// List view component for restaurants
function ListRestaurantCard({
  restaurant,
  onClick,
}: {
  restaurant: Restaurant;
  onClick: () => void;
}) {
  const getPriceLevelDisplay = (level: number) => {
    return "$".repeat(level) + "·".repeat(Math.max(0, 3 - level));
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="flex">
        {/* Image */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <ImageWithFallback
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 px-2 py-1 bg-[#F14C35] text-white text-xs rounded-full font-medium">
            Saved
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 cursor-pointer" onClick={onClick}>
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-[#0B1F3A] leading-tight">
              {restaurant.name}
            </h3>
            <div className="flex items-center space-x-1 ml-2">
              <Star className="w-3 h-3 text-[#FFD74A] fill-[#FFD74A]" />
              <span className="text-sm font-medium text-[#0B1F3A]">
                {restaurant.rating}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            {restaurant.cuisine.slice(0, 2).map((cuisine, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {cuisine}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <MapPin className="w-3 h-3" />
              <span>{restaurant.distance || restaurant.address}</span>
              {restaurant.isOpen !== undefined && (
                <>
                  <span>•</span>
                  <span
                    className={
                      restaurant.isOpen ? "text-green-600" : "text-red-600"
                    }
                  >
                    {restaurant.isOpen ? "Open" : "Closed"}
                  </span>
                </>
              )}
            </div>
            <span className="text-sm font-medium text-[#0B1F3A]">
              {getPriceLevelDisplay(restaurant.priceLevel)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function PlatesTab({
  variant = "profile",
  onRestaurantClick,
  onRestaurantUnsave,
  onRecipeClick,
  showSearch = true,
  showFilters = true,
  showViewToggle = true,
  showStats = true,
  className = "",
}: PlatesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeFilter, setActiveFilter] = useState<PlateFilter>("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load saved items from backend
  useEffect(() => {
    if (user) {
      loadSavedItems();
    }
  }, [user]);

  const loadSavedItems = async () => {
    try {
      setLoading(true);
      const savedItems = await savedItemsService.listSavedItems({
        itemType: "restaurant",
      });

      // Convert SavedItem to Restaurant format
      const convertedRestaurants: Restaurant[] = savedItems.map((item) => ({
        id: item.id,
        placeId: item.item_id,
        name: item.metadata.title || "Unknown Restaurant",
        image: item.metadata.imageUrl || "",
        rating: item.metadata.rating || 4.5,
        cuisine: item.metadata.cuisine || ["Restaurant"],
        priceLevel: item.metadata.priceLevel || 2,
        address: item.metadata.address || "Unknown Address",
        coordinates: item.metadata.coordinates || { lat: 0, lng: 0 },
        isSaved: true,
        photos: item.metadata.photos || [],
      }));

      setRestaurants(convertedRestaurants);
      console.log("✅ Loaded saved restaurants:", convertedRestaurants.length);
    } catch (error) {
      console.error("❌ Failed to load saved items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveRestaurant = async (placeId: string) => {
    try {
      const result = await savedItemsService.unsaveItem({
        itemId: placeId,
        itemType: "restaurant",
      });

      if (result.success) {
        setRestaurants((prev) => prev.filter((r) => r.placeId !== placeId));
        onRestaurantUnsave?.(placeId);
        console.log("✅ Restaurant removed from saved list");
      }
    } catch (error) {
      console.error("Failed to unsave restaurant:", error);
    }
  };

  // Filter options
  const filters = [
    {
      id: "all" as PlateFilter,
      label: "All",
      count: restaurants.length + recipes.length,
    },
    {
      id: "restaurants" as PlateFilter,
      label: "Restaurants",
      count: restaurants.length,
    },
    {
      id: "recipes" as PlateFilter,
      label: "Recipes",
      count: recipes.length,
    },
  ];

  // Categories with icons
  const categories = [
    { id: "all", label: "All", icon: Heart, count: restaurants.length },
    {
      id: "dinner",
      label: "Dinner",
      icon: Utensils,
      count: restaurants.filter((r) =>
        r.cuisine.some((c) =>
          ["Italian", "Japanese", "Indian", "Mexican"].includes(c)
        )
      ).length,
    },
    {
      id: "casual",
      label: "Casual",
      icon: Coffee,
      count: restaurants.filter((r) => r.priceLevel <= 2).length,
    },
    {
      id: "dessert",
      label: "Dessert",
      icon: Cake,
      count: restaurants.filter((r) =>
        r.cuisine.some((c) => c.toLowerCase().includes("dessert"))
      ).length,
    },
    {
      id: "recent",
      label: "Recent",
      icon: Calendar,
      count: Math.min(restaurants.length, 5),
    },
  ];

  const filteredRestaurants = restaurants
    .filter((restaurant) => {
      // Search filter
      const matchesSearch =
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine.some((c) =>
          c.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Category filter
      let matchesCategory = true;
      switch (activeCategory) {
        case "dinner":
          matchesCategory = restaurant.cuisine.some((c) =>
            ["Italian", "Japanese", "Indian", "Mexican"].includes(c)
          );
          break;
        case "casual":
          matchesCategory = restaurant.priceLevel <= 2;
          break;
        case "dessert":
          matchesCategory = restaurant.cuisine.some((c) =>
            c.toLowerCase().includes("dessert")
          );
          break;
        case "recent":
          matchesCategory = restaurants.indexOf(restaurant) < 5;
          break;
        case "all":
        default:
          matchesCategory = true;
      }

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "distance":
          return parseFloat(a.distance || "0") - parseFloat(b.distance || "0");
        default:
          return 0; // Keep original order for 'recent'
      }
    });

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getSortLabel = () => {
    switch (sortBy) {
      case "rating":
        return "Rating";
      case "distance":
        return "Distance";
      default:
        return "Recent";
    }
  };

  const cycleSortBy = () => {
    const options: SortBy[] = ["recent", "rating", "distance"];
    const currentIndex = options.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % options.length;
    setSortBy(options[nextIndex]);
  };

  if (loading) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center px-6 py-12 ${className}`}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-[#F14C35] rounded-full flex items-center justify-center mb-6 mx-auto animate-pulse">
            <span className="text-3xl">🐙</span>
          </div>
          <h3 className="font-bold text-[#0B1F3A] text-xl mb-2">
            Loading your plates...
          </h3>
          <p className="text-gray-600">Tako is fetching your saved items! 🍽️</p>
        </motion.div>
      </div>
    );
  }

  if (restaurants.length === 0 && recipes.length === 0) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center px-6 py-12 ${className}`}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          {/* Empty State Illustration */}
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Heart className="w-12 h-12 text-gray-400" />
          </div>

          <h3 className="font-bold text-[#0B1F3A] text-xl mb-2">
            No saved items yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-sm">
            Start exploring and save your favorite restaurants and recipes to
            your plate! They'll appear here for easy access.
          </p>

          <motion.div
            animate={{
              y: [0, -5, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-16 h-16 bg-[#F14C35] rounded-full flex items-center justify-center mx-auto"
          >
            <span className="text-3xl">🐙</span>
          </motion.div>

          <p className="text-sm text-gray-500 mt-4 italic">
            "Let's find some delicious spots together!" - Tako
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex-1 bg-gray-50 ${className}`}>
      {/* Header */}
      {variant === "profile" && (
        <div className="bg-white p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#0B1F3A]">
                My Plates
              </h2>
              <p className="text-sm text-gray-600">Your saved favorites</p>
            </div>
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <Filter className="w-5 h-5 text-[#0B1F3A]" />
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Header */}
      {showSearch && (
        <div className="bg-white border-b border-gray-200 px-4 py-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search saved items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-xl text-[#0B1F3A] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F14C35]/20 focus:bg-white transition-all"
            />
          </div>

          {/* Stats & Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-[#F14C35]" />
              <span className="font-bold text-[#0B1F3A]">
                {filteredRestaurants.length + filteredRecipes.length} saved item
                {filteredRestaurants.length + filteredRecipes.length !== 1
                  ? "s"
                  : ""}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* View Mode Toggle */}
              {showViewToggle && (
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === "grid"
                        ? "bg-white text-[#F14C35] shadow-sm"
                        : "text-gray-600 hover:text-[#F14C35]"
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === "list"
                        ? "bg-white text-[#F14C35] shadow-sm"
                        : "text-gray-600 hover:text-[#F14C35]"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Sort Button */}
              {showFilters && (
                <button
                  onClick={cycleSortBy}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {getSortLabel()}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-[#F8F9FA] rounded-xl p-1">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === filter.id
                    ? "bg-white text-[#F14C35] shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {filter.label}
                {filter.count > 0 && (
                  <span
                    className={`ml-1 ${
                      activeFilter === filter.id
                        ? "text-[#F14C35]"
                        : "text-gray-400"
                    }`}
                  >
                    ({filter.count})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Category Tabs */}
          {variant === "scout" && (
            <div className="mt-4">
              <FuzoTabs
                tabs={categories.map((cat) => ({
                  id: cat.id,
                  label: `${cat.label} (${cat.count})`,
                  icon: cat.icon,
                }))}
                activeTab={activeCategory}
                onTabChange={setActiveCategory}
                variant="compact"
                showContent={false}
              />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {filteredRestaurants.length === 0 && filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-bold text-[#0B1F3A] mb-2">No results found</h3>
            <p className="text-gray-600">
              Try searching for different names or cuisines
            </p>
          </div>
        ) : (
          <motion.div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                : "space-y-4"
            }
            layout
          >
            {/* Restaurants */}
            {activeFilter !== "recipes" &&
              filteredRestaurants.map((restaurant, index) => (
                <motion.div
                  key={restaurant.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  {viewMode === "grid" ? (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex">
                        {/* Image */}
                        <div className="w-24 h-24 flex-shrink-0">
                          <ImageWithFallback
                            src={restaurant.image}
                            alt={restaurant.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Content */}
                        <div
                          className="flex-1 p-4 cursor-pointer"
                          onClick={() => onRestaurantClick?.(restaurant)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-[#0B1F3A] mb-1">
                                {restaurant.name}
                              </h4>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>{restaurant.cuisine.join(", ")}</span>
                                <span>•</span>
                                <span>{"$".repeat(restaurant.priceLevel)}</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium text-gray-900">
                                {restaurant.rating}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <MapPin className="w-3 h-3" />
                              <span>{restaurant.address}</span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button className="px-3 py-1 bg-[#F14C35] text-white text-sm rounded-lg font-medium hover:bg-[#E63E26] transition-colors">
                                View on Map
                              </button>
                              <button
                                onClick={() =>
                                  handleUnsaveRestaurant(restaurant.placeId)
                                }
                                className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                                title="Remove from saved"
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </button>
                              <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <Share2 className="w-3 h-3 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <ListRestaurantCard
                      restaurant={restaurant}
                      onClick={() => onRestaurantClick?.(restaurant)}
                      onSave={() => onRestaurantUnsave?.(restaurant.placeId)}
                    />
                  )}
                </motion.div>
              ))}

            {/* Recipes */}
            {activeFilter !== "restaurants" &&
              filteredRecipes.map((recipe, index) => (
                <motion.div
                  key={recipe.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex">
                      {/* Image */}
                      <div className="w-24 h-24 flex-shrink-0">
                        <ImageWithFallback
                          src={recipe.image}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div
                        className="flex-1 p-4 cursor-pointer"
                        onClick={() => onRecipeClick?.(recipe)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-[#0B1F3A] mb-1">
                              {recipe.title}
                            </h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <span>{recipe.cuisine}</span>
                              <span>•</span>
                              <span>{recipe.difficulty}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{recipe.cookingTime}m</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button className="px-3 py-1 bg-[#F14C35] text-white text-sm rounded-lg font-medium hover:bg-[#E63E26] transition-colors">
                              View Recipe
                            </button>
                            <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                              <Share2 className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </motion.div>
        )}
      </div>

      {/* Stats */}
      {showStats && (
        <div className="bg-[#F8F9FA] rounded-xl p-4 border border-gray-200 m-4">
          <h3 className="font-medium text-[#0B1F3A] mb-3">Plate Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[#F14C35]">
                {restaurants.length}
              </p>
              <p className="text-xs text-gray-600">Restaurants</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F14C35]">
                {recipes.length}
              </p>
              <p className="text-xs text-gray-600">Recipes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F14C35]">
                {restaurants.length > 0
                  ? Math.round(
                      (restaurants.reduce(
                        (sum, place) => sum + place.rating,
                        0
                      ) /
                        restaurants.length) *
                        10
                    ) / 10
                  : 0}
              </p>
              <p className="text-xs text-gray-600">Avg Rating</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Padding for Navigation */}
      <div className="h-20" />
    </div>
  );
}
