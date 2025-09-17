import { motion } from "framer-motion";
import {
  Cake,
  Calendar,
  Coffee,
  Filter,
  Grid,
  Heart,
  List,
  MapPin,
  Search,
  Star,
  Utensils,
} from "lucide-react";
import { useState } from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { FuzoTabs } from "../global/FuzoTabs";
import type { Restaurant } from "../ScoutPage";
import { RestaurantCard } from "./RestaurantCard";

// List view component for restaurants
function ListRestaurantCard({
  restaurant,
  onClick,
  onSave,
}: {
  restaurant: Restaurant;
  onClick: () => void;
  onSave: () => void;
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
              <span>{restaurant.distance}</span>
              <span>•</span>
              <span
                className={
                  restaurant.isOpen ? "text-green-600" : "text-red-600"
                }
              >
                {restaurant.isOpen ? "Open" : "Closed"}
              </span>
            </div>
            <span className="text-sm font-medium text-[#0B1F3A]">
              {getPriceLevelDisplay(restaurant.priceLevel)}
            </span>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center px-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            className="w-10 h-10 bg-[#F14C35]/10 text-[#F14C35] rounded-full flex items-center justify-center hover:bg-[#F14C35] hover:text-white transition-colors"
          >
            <Heart className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface SavedItemsTabProps {
  restaurants: Restaurant[];
  onRestaurantClick: (restaurant: Restaurant) => void;
  onRestaurantUnsave: (restaurant: Restaurant) => void;
}

export function SavedItemsTab({
  restaurants,
  onRestaurantClick,
  onRestaurantUnsave,
}: SavedItemsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "distance">(
    "recent"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeCategory, setActiveCategory] = useState("all");

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
          return parseFloat(a.distance) - parseFloat(b.distance);
        default:
          return 0; // Keep original order for 'recent'
      }
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
    const options: ("recent" | "rating" | "distance")[] = [
      "recent",
      "rating",
      "distance",
    ];
    const currentIndex = options.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % options.length;
    setSortBy(options[nextIndex]);
  };

  if (restaurants.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
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
            No saved restaurants yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-sm">
            Start exploring and save your favorite places to your plate! They'll
            appear here for easy access.
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
    <div className="flex-1 bg-gray-50">
      {/* Search & Filter Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search saved restaurants..."
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
              {filteredRestaurants.length} saved restaurant
              {filteredRestaurants.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
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

            {/* Sort Button */}
            <button
              onClick={cycleSortBy}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {getSortLabel()}
              </span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
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
      </div>

      {/* Restaurant Grid */}
      <div className="p-4">
        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-bold text-[#0B1F3A] mb-2">No results found</h3>
            <p className="text-gray-600">
              Try searching for different restaurant names or cuisines
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
            {filteredRestaurants.map((restaurant, index) => (
              <motion.div
                key={restaurant.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                {viewMode === "grid" ? (
                  <div className="relative">
                    <RestaurantCard
                      restaurant={restaurant}
                      onClick={() => onRestaurantClick(restaurant)}
                      onSave={() => onRestaurantUnsave(restaurant)}
                      variant="grid"
                    />

                    {/* Quick Actions Overlay */}
                    <div className="absolute top-3 left-3 flex space-x-2">
                      <div className="px-2 py-1 bg-[#F14C35] text-white text-xs rounded-full font-medium">
                        Saved
                      </div>
                      {restaurant.isOpen && (
                        <div className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                          Open
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <ListRestaurantCard
                    restaurant={restaurant}
                    onClick={() => onRestaurantClick(restaurant)}
                    onSave={() => onRestaurantUnsave(restaurant)}
                  />
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Bottom Padding for Navigation */}
      <div className="h-20" />
    </div>
  );
}
