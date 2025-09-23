import { AnimatePresence, motion } from "framer-motion";
import {
  ChefHat,
  Clock,
  DollarSign,
  Heart,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import {
  AIRecommendation,
  RecommendationFilters,
  useAIRecommendations,
} from "../../hooks/useAIRecommendations";
import { FuzoButton } from "../global/FuzoButton";
import { FuzoInput } from "../global/FuzoInput";

interface AIFoodRecommendationsProps {
  onRecommendationSelect?: (recommendation: AIRecommendation) => void;
}

const FILTER_OPTIONS = [
  {
    id: "maxReadyTime",
    label: "Max Prep Time (min)",
    type: "number",
    placeholder: "30",
  },
  { id: "maxPrice", label: "Max Price ($)", type: "number", placeholder: "10" },
  {
    id: "minHealthScore",
    label: "Min Health Score",
    type: "number",
    placeholder: "70",
  },
  {
    id: "mealType",
    label: "Meal Type",
    type: "select",
    options: [
      { value: "", label: "Any" },
      { value: "breakfast", label: "Breakfast" },
      { value: "lunch", label: "Lunch" },
      { value: "dinner", label: "Dinner" },
      { value: "snack", label: "Snack" },
      { value: "dessert", label: "Dessert" },
    ],
  },
];

export function AIFoodRecommendations({
  onRecommendationSelect,
}: AIFoodRecommendationsProps) {
  const {
    recommendations,
    isLoading,
    error,
    hasMore,
    loadRecommendations,
    loadMore,
    refreshRecommendations,
    clearError,
  } = useAIRecommendations();

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<RecommendationFilters>({});
  const [searchQuery, setSearchQuery] = useState("");

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : value,
    }));
  };

  const handleSearch = () => {
    loadRecommendations(filters);
  };

  const handleRefresh = () => {
    refreshRecommendations();
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-[#F14C35] to-[#E63E26] rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-[#0B1F3A]">
            AI Food Recommendations
          </h2>
        </div>
        <p className="text-gray-600 text-lg">
          Personalized recipes based on your preferences and dietary needs
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1">
            <FuzoInput
              placeholder="Search for specific dishes or ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <FuzoButton
              variant="primary"
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Search
            </FuzoButton>
            <FuzoButton
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="px-4"
            >
              <ChefHat className="w-4 h-4 mr-2" />
              Filters
            </FuzoButton>
            <FuzoButton
              variant="tertiary"
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-4"
            >
              <RefreshCw className="w-4 h-4" />
            </FuzoButton>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 pt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {FILTER_OPTIONS.map((filter) => (
                  <div key={filter.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {filter.label}
                    </label>
                    {filter.type === "select" ? (
                      <select
                        value={String(
                          filters[filter.id as keyof RecommendationFilters] ||
                            ""
                        )}
                        onChange={(e) =>
                          handleFilterChange(filter.id, e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
                      >
                        {filter.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={filter.type}
                        placeholder={filter.placeholder}
                        value={String(
                          filters[filter.id as keyof RecommendationFilters] ||
                            ""
                        )}
                        onChange={(e) =>
                          handleFilterChange(filter.id, e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
                      />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-xs">!</span>
            </div>
            <p className="text-red-800">{error}</p>
            <FuzoButton
              variant="tertiary"
              size="sm"
              onClick={clearError}
              className="ml-auto"
            >
              Dismiss
            </FuzoButton>
          </div>
        </div>
      )}

      {/* Recommendations Grid */}
      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((recommendation, index) => (
            <motion.div
              key={recommendation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => onRecommendationSelect?.(recommendation)}
            >
              {/* Recipe Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={recommendation.image}
                  alt={recommendation.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  {recommendation.veryHealthy && (
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Healthy
                    </span>
                  )}
                  {recommendation.veryPopular && (
                    <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Popular
                    </span>
                  )}
                  {recommendation.cheap && (
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Budget
                    </span>
                  )}
                </div>
                <div className="absolute bottom-3 left-3">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                    <span className="text-white text-sm font-medium">
                      {recommendation.matchScore}% match
                    </span>
                  </div>
                </div>
              </div>

              {/* Recipe Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-[#0B1F3A] mb-2 line-clamp-2">
                  {recommendation.title}
                </h3>

                {/* Recipe Stats */}
                <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{recommendation.readyInMinutes}m</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>${recommendation.pricePerServing.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span
                      className={getHealthScoreColor(
                        recommendation.healthScore
                      )}
                    >
                      {recommendation.healthScore}
                    </span>
                  </div>
                </div>

                {/* AI Reasoning */}
                <div className="bg-gradient-to-r from-[#F14C35]/10 to-[#E63E26]/10 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-[#F14C35] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {recommendation.aiReasoning}
                    </p>
                  </div>
                </div>

                {/* Cuisines and Diets */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {recommendation.cuisines.slice(0, 2).map((cuisine) => (
                    <span
                      key={cuisine}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                    >
                      {cuisine}
                    </span>
                  ))}
                  {recommendation.diets.slice(0, 2).map((diet) => (
                    <span
                      key={diet}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
                    >
                      {diet}
                    </span>
                  ))}
                </div>

                {/* Action Button */}
                <FuzoButton
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRecommendationSelect?.(recommendation);
                  }}
                >
                  <ChefHat className="w-4 h-4 mr-2" />
                  View Recipe
                </FuzoButton>
              </div>
            </motion.div>
          ))}
        </div>
      ) : !isLoading ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No recommendations found
          </h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your filters or search terms
          </p>
          <FuzoButton variant="primary" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </FuzoButton>
        </div>
      ) : null}

      {/* Load More Button */}
      {hasMore && recommendations.length > 0 && (
        <div className="text-center mt-8">
          <FuzoButton
            variant="secondary"
            onClick={loadMore}
            disabled={isLoading}
            className="px-8"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <TrendingUp className="w-4 h-4 mr-2" />
            )}
            Load More Recommendations
          </FuzoButton>
        </div>
      )}

      {/* Loading State */}
      {isLoading && recommendations.length === 0 && (
        <div className="text-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-[#F14C35] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Finding perfect recipes for you...
          </h3>
          <p className="text-gray-600">
            Our AI is analyzing your preferences to recommend the best dishes
          </p>
        </div>
      )}
    </div>
  );
}
