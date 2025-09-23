import { ArrowLeft, Filter, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import {
  convertSpoonacularRecipe,
  spoonacularService,
} from "../src/lib/spoonacular";
import { BottomNavigation } from "./BottomNavigation";
import { Recipe } from "./constants/recipesData";
import { NewRecipe, RecipeCreatorPage } from "./features/RecipeCreatorPage";
import { FilterModal, FilterOptions } from "./recipes/FilterModal";
import { GamificationPopup } from "./recipes/GamificationPopup";
import { RecipeCard } from "./recipes/RecipeCard";
import { RecipeDetail } from "./recipes/RecipeDetail";

type RecipeView = "feed" | "detail" | "community" | "create";

interface RecipesPageProps {
  onNavigateBack?: () => void;
  onNavigateToFeed?: () => void;
  onNavigateToScout?: () => void;
  onNavigateToSnap?: () => void;
}

export function RecipesPage({
  onNavigateBack,
  onNavigateToFeed,
  onNavigateToScout,
  onNavigateToSnap,
}: RecipesPageProps) {
  const [currentView, setCurrentView] = useState<RecipeView>("feed");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showGamification, setShowGamification] = useState(false);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]); // User-created recipes
  const [backendRecipes, setBackendRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("recipes");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({
    sortBy: "relevance",
    sortOrder: "desc",
    categories: [],
    diet: [],
    cuisine: [],
    mainIngredients: [],
    occasion: [],
    appliances: [],
    type: [],
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Client-side filtering helper function
  const applyClientSideFilters = (
    recipes: Recipe[],
    filters: FilterOptions
  ): Recipe[] => {
    return recipes.filter((recipe) => {
      // Filter by categories (dish types)
      if (filters.categories.length > 0) {
        const hasMatchingCategory = filters.categories.some((category) =>
          recipe.tags.some((tag) =>
            tag.toLowerCase().includes(category.toLowerCase())
          )
        );
        if (!hasMatchingCategory) return false;
      }

      // Filter by occasion
      if (filters.occasion.length > 0) {
        const hasMatchingOccasion = filters.occasion.some(
          (occasion) =>
            recipe.tags.some((tag) =>
              tag.toLowerCase().includes(occasion.toLowerCase())
            ) || recipe.title.toLowerCase().includes(occasion.toLowerCase())
        );
        if (!hasMatchingOccasion) return false;
      }

      // Filter by appliances (cooking methods)
      if (filters.appliances.length > 0) {
        const hasMatchingAppliance = filters.appliances.some(
          (appliance) =>
            recipe.tags.some((tag) =>
              tag.toLowerCase().includes(appliance.toLowerCase())
            ) ||
            recipe.instructions.some((instruction) =>
              instruction.description
                .toLowerCase()
                .includes(appliance.toLowerCase())
            )
        );
        if (!hasMatchingAppliance) return false;
      }

      return true;
    });
  };

  // Sorting helper function
  const applySorting = (
    recipes: Recipe[],
    filters: FilterOptions
  ): Recipe[] => {
    const sorted = [...recipes];

    switch (filters.sortBy) {
      case "likes":
        sorted.sort((a, b) => {
          const aLikes = a.reviewCount || 0;
          const bLikes = b.reviewCount || 0;
          return filters.sortOrder === "desc"
            ? bLikes - aLikes
            : aLikes - bLikes;
        });
        break;
      case "rating":
        sorted.sort((a, b) => {
          const aRating = a.rating || 0;
          const bRating = b.rating || 0;
          return filters.sortOrder === "desc"
            ? bRating - aRating
            : aRating - bRating;
        });
        break;
      case "calories":
        sorted.sort((a, b) => {
          const aCalories = a.calories || 0;
          const bCalories = b.calories || 0;
          return filters.sortOrder === "desc"
            ? bCalories - aCalories
            : aCalories - bCalories;
        });
        break;
      case "preparation_time":
        sorted.sort((a, b) => {
          const aTime = a.prepTime || 0;
          const bTime = b.prepTime || 0;
          return filters.sortOrder === "desc" ? bTime - aTime : aTime - bTime;
        });
        break;
      case "release_date":
        sorted.sort((a, b) => {
          const aDate = new Date(a.createdAt || 0).getTime();
          const bDate = new Date(b.createdAt || 0).getTime();
          return filters.sortOrder === "desc" ? bDate - aDate : aDate - bDate;
        });
        break;
      default: // relevance
        // Keep original order for relevance
        break;
    }

    return sorted;
  };

  const handleApplyFilters = (filters: FilterOptions) => {
    setCurrentFilters(filters);
    loadBackendRecipes(filters);
  };

  // Use only real data - no mock fallback
  const allRecipes = [...backendRecipes, ...userRecipes];

  // Filter recipes based on search query
  const filteredRecipes = allRecipes.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  // Load recipes from backend on mount
  useEffect(() => {
    loadBackendRecipes();
  }, []);

  const loadBackendRecipes = async (filters?: FilterOptions) => {
    try {
      setLoading(true);
      setError(null);

      const appliedFilters = filters || currentFilters;

      // Build search query from filters
      let query = "";
      if (appliedFilters.mainIngredients.length > 0) {
        query = appliedFilters.mainIngredients.join(" ");
      }
      if (appliedFilters.type.length > 0) {
        query += " " + appliedFilters.type.join(" ");
      }

      // Build cuisine parameter
      const cuisine =
        appliedFilters.cuisine.length > 0
          ? appliedFilters.cuisine.join(",")
          : undefined;

      // Build diet parameter
      const diet =
        appliedFilters.diet.length > 0
          ? appliedFilters.diet.join(",")
          : undefined;

      console.log(
        "🍽️ Loading recipes from Spoonacular API with filters:",
        appliedFilters
      );
      const response = await spoonacularService.searchRecipes({
        query: query.trim(),
        cuisine,
        diet,
        number: 12,
      });

      if (response.results && response.results.length > 0) {
        let convertedRecipes: Recipe[] = response.results.map(
          convertSpoonacularRecipe
        );

        // Apply additional client-side filtering
        convertedRecipes = applyClientSideFilters(
          convertedRecipes,
          appliedFilters
        );

        // Apply sorting
        convertedRecipes = applySorting(convertedRecipes, appliedFilters);

        setBackendRecipes(convertedRecipes);
        console.log(
          `✅ Loaded ${convertedRecipes.length} recipes from Spoonacular API`
        );
      } else {
        console.warn("⚠️ No recipes returned from Spoonacular API");
        setError("No recipes available at the moment");
      }
    } catch (err: any) {
      console.error("❌ Failed to load recipes from Spoonacular API:", err);
      setError("Failed to load recipes. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewRecipe = (newRecipe: NewRecipe) => {
    const recipe: Recipe = {
      id: `user_${Date.now()}`,
      title: newRecipe.title,
      image: newRecipe.mainImage || "",
      cookingTime: newRecipe.cookingTime,
      calories: newRecipe.nutrition?.calories || 0,
      servings: newRecipe.servings,
      cuisine: newRecipe.cuisine,
      rating: 0,
      tags: newRecipe.tags,
      difficulty: newRecipe.difficulty,
      ingredients: newRecipe.ingredients,
      instructions:
        newRecipe.steps?.map((step) => ({
          id: step.id,
          step: step.stepNumber,
          description: step.instruction,
        })) || [],
      nutrition: newRecipe.nutrition || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      },
      author: {
        id: "current_user",
        name: "You",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        verified: true,
      },
      description: newRecipe.description,
      preparationTime: newRecipe.prepTime || 15,
      totalTime: newRecipe.cookingTime + (newRecipe.prepTime || 15),
      reviewCount: 0,
      isBookmarked: false,
      isLiked: false,
      prepTime: newRecipe.prepTime,
      cookTime: newRecipe.cookTime,
      mainImage: newRecipe.mainImage || "",
      images: newRecipe.images || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUserRecipes((prev) => [recipe, ...prev]);
    setShowGamification(true);
  };

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setCurrentView("detail");
  };

  const handleBackToFeed = () => {
    setCurrentView("feed");
    setSelectedRecipe(null);
  };

  const handleBookmark = (recipeId: string) => {
    setBackendRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId
          ? { ...recipe, isBookmarked: !recipe.isBookmarked }
          : recipe
      )
    );
    setUserRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId
          ? { ...recipe, isBookmarked: !recipe.isBookmarked }
          : recipe
      )
    );
  };

  const handleLike = (recipeId: string) => {
    setBackendRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId
          ? { ...recipe, isLiked: !recipe.isLiked }
          : recipe
      )
    );
    setUserRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId
          ? { ...recipe, isLiked: !recipe.isLiked }
          : recipe
      )
    );
  };

  if (currentView === "detail" && selectedRecipe) {
    return (
      <RecipeDetail
        recipe={selectedRecipe}
        onBack={handleBackToFeed}
        onBookmark={handleBookmark}
        onLike={handleLike}
      />
    );
  }

  if (currentView === "create") {
    return (
      <RecipeCreatorPage
        onBack={handleBackToFeed}
        onSave={handleSaveNewRecipe}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={onNavigateBack || (() => window.history.back())}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Bites</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilterModal(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentView("create")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search recipes, cuisines, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3">
          <div className="flex space-x-6">
            <button
              onClick={() => handleTabChange("recipes")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "recipes"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Recipes
            </button>
            <button
              onClick={() => handleTabChange("video")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "video"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Video Feed
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {activeTab === "video" ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Video Feed Coming Soon
            </h3>
            <p className="text-gray-600">
              Cooking videos and tutorials will be available here soon!
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading recipes...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Failed to load recipes
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => loadBackendRecipes()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.291A7.962 7.962 0 0012 5c-2.34 0-4.29 1.009-5.824 2.709"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No recipes found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? "Try adjusting your search terms"
                : "No recipes available at the moment"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => loadBackendRecipes()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Refresh
              </button>
            )}
          </div>
        ) : (
          <div className="w-full recipe-grid">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onSelect={handleRecipeSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={currentFilters}
        resultCount={filteredRecipes.length}
      />

      {/* Gamification Popup */}
      {showGamification && (
        <GamificationPopup
          points={50}
          message="Recipe created! +50 points"
          onClose={() => setShowGamification(false)}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab="bites"
        onTabChange={(tab) => {
          if (tab === "feed" && onNavigateToFeed) {
            onNavigateToFeed();
          } else if (tab === "scout" && onNavigateToScout) {
            onNavigateToScout();
          } else if (tab === "snap" && onNavigateToSnap) {
            onNavigateToSnap();
          }
        }}
        onNavigateToFeed={onNavigateToFeed}
        onNavigateToScout={onNavigateToScout}
        onNavigateToSnap={onNavigateToSnap}
      />
    </div>
  );
}
