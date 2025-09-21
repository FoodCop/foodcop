import { motion } from "framer-motion";
import {
  ChefHat,
  Clock,
  Search,
  Share2,
  Star,
  Trash2,
  Utensils,
} from "lucide-react";
import { useState } from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

export interface Recipe {
  id: string;
  title: string;
  image: string;
  cuisine: string;
  difficulty: string;
  cookingTime: number;
  rating?: number;
  description?: string;
  tags?: string[];
  isSaved?: boolean;
}

interface RecipesTabProps {
  recipes: Recipe[];
  onRecipeClick?: (recipe: Recipe) => void;
  onRecipeUnsave?: (recipe: Recipe) => void;
  showSearch?: boolean;
  showFilters?: boolean;
  showStats?: boolean;
  className?: string;
}

export function RecipesTab({
  recipes,
  onRecipeClick,
  onRecipeUnsave,
  showSearch = true,
  showFilters = true,
  showStats = true,
  className = "",
}: RecipesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "time">("recent");
  const [filterBy, setFilterBy] = useState<"all" | "easy" | "medium" | "hard">(
    "all"
  );

  const filteredRecipes = recipes
    .filter((recipe) => {
      // Search filter
      const matchesSearch =
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Difficulty filter
      const matchesDifficulty =
        filterBy === "all" || recipe.difficulty.toLowerCase() === filterBy;

      return matchesSearch && matchesDifficulty;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "time":
          return a.cookingTime - b.cookingTime;
        default:
          return 0; // Keep original order for 'recent'
      }
    });

  const getSortLabel = () => {
    switch (sortBy) {
      case "rating":
        return "Rating";
      case "time":
        return "Time";
      default:
        return "Recent";
    }
  };

  const cycleSortBy = () => {
    const options: ("recent" | "rating" | "time")[] = [
      "recent",
      "rating",
      "time",
    ];
    const currentIndex = options.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % options.length;
    setSortBy(options[nextIndex]);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "text-green-600 bg-green-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "hard":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (recipes.length === 0) {
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
            <ChefHat className="w-12 h-12 text-gray-400" />
          </div>

          <h3 className="font-bold text-[#0B1F3A] text-xl mb-2">
            No saved recipes yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-sm">
            Start exploring and save your favorite recipes to your plate!
            They'll appear here for easy access.
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
            "Let's cook something delicious together!" - Tako
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex-1 bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#0B1F3A]">My Recipes</h2>
            <p className="text-sm text-gray-600">Your saved recipes</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Header */}
      {showSearch && (
        <div className="bg-white border-b border-gray-200 px-4 py-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search saved recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-xl text-[#0B1F3A] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F14C35]/20 focus:bg-white transition-all"
            />
          </div>

          {/* Stats & Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ChefHat className="w-5 h-5 text-[#F14C35]" />
              <span className="font-bold text-[#0B1F3A]">
                {filteredRecipes.length} saved recipe
                {filteredRecipes.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Sort Button */}
              {showFilters && (
                <button
                  onClick={cycleSortBy}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Utensils className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {getSortLabel()}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          {showFilters && (
            <div className="flex space-x-1 bg-[#F8F9FA] rounded-xl p-1">
              {[
                { id: "all", label: "All", count: recipes.length },
                {
                  id: "easy",
                  label: "Easy",
                  count: recipes.filter(
                    (r) => r.difficulty.toLowerCase() === "easy"
                  ).length,
                },
                {
                  id: "medium",
                  label: "Medium",
                  count: recipes.filter(
                    (r) => r.difficulty.toLowerCase() === "medium"
                  ).length,
                },
                {
                  id: "hard",
                  label: "Hard",
                  count: recipes.filter(
                    (r) => r.difficulty.toLowerCase() === "hard"
                  ).length,
                },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterBy(filter.id as any)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterBy === filter.id
                      ? "bg-white text-[#F14C35] shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {filter.label}
                  {filter.count > 0 && (
                    <span
                      className={`ml-1 ${
                        filterBy === filter.id
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
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-bold text-[#0B1F3A] mb-2">No results found</h3>
            <p className="text-gray-600">
              Try searching for different recipes or cuisines
            </p>
          </div>
        ) : (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" layout>
            {filteredRecipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
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
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#0B1F3A] mb-1 line-clamp-2">
                          {recipe.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                          <span>{recipe.cuisine}</span>
                          <span>•</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                              recipe.difficulty
                            )}`}
                          >
                            {recipe.difficulty}
                          </span>
                        </div>
                        {recipe.description && (
                          <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                            {recipe.description}
                          </p>
                        )}
                      </div>

                      {recipe.rating && (
                        <div className="flex items-center space-x-1 ml-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium text-gray-900">
                            {recipe.rating}
                          </span>
                        </div>
                      )}
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
                        {onRecipeUnsave && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRecipeUnsave(recipe);
                            }}
                            className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                            title="Remove from saved"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        )}
                        <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                          <Share2 className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Tags */}
                    {recipe.tags && recipe.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {recipe.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                        {recipe.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{recipe.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
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
          <h3 className="font-medium text-[#0B1F3A] mb-3">Recipe Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[#F14C35]">
                {recipes.length}
              </p>
              <p className="text-xs text-gray-600">Total Recipes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F14C35]">
                {
                  recipes.filter((r) => r.difficulty.toLowerCase() === "easy")
                    .length
                }
              </p>
              <p className="text-xs text-gray-600">Easy</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F14C35]">
                {Math.round(
                  recipes.reduce((sum, recipe) => sum + recipe.cookingTime, 0) /
                    recipes.length
                ) || 0}
              </p>
              <p className="text-xs text-gray-600">Avg Time (min)</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Padding for Navigation */}
      <div className="h-20" />
    </div>
  );
}
