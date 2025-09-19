import { ArrowLeft, Filter, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import {
  convertSpoonacularRecipe,
  spoonacularService,
} from "../src/lib/spoonacular";
import { BottomNavigation } from "./BottomNavigation";
import { Recipe } from "./constants/recipesData";
import { NewRecipe, RecipeCreatorPage } from "./features/RecipeCreatorPage";
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
  const [showFilters, setShowFilters] = useState(false);
  const [showGamification, setShowGamification] = useState(false);
  const [userPoints, setUserPoints] = useState(1240); // Mock user points
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]); // User-created recipes
  const [backendRecipes, setBackendRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("bites");

  const handleTabChange = (tab: string) => {
    if (tab === "feed" && onNavigateToFeed) {
      onNavigateToFeed();
    } else if (tab === "scout" && onNavigateToScout) {
      onNavigateToScout();
    } else if (tab === "snap" && onNavigateToSnap) {
      onNavigateToSnap();
    } else {
      setActiveTab(tab);
    }
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

  const loadBackendRecipes = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🍽️ Loading recipes from Spoonacular API...");
      const response = await spoonacularService.searchRecipes({
        query: "",
        number: 12,
      });

      if (response.results && response.results.length > 0) {
        const convertedRecipes: Recipe[] = response.results.map(
          convertSpoonacularRecipe
        );
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
      cuisine: newRecipe.cuisine,
      difficulty: newRecipe.difficulty,
      prepTime: newRecipe.prepTime,
      cookTime: newRecipe.cookTime,
      servings: newRecipe.servings,
      rating: 0,
      reviewCount: 0,
      isBookmarked: false,
      isLiked: false,
      tags: newRecipe.tags,
      ingredients: newRecipe.ingredients,
      instructions: newRecipe.instructions,
      nutrition: newRecipe.nutrition,
      mainImage: newRecipe.mainImage || "",
      images: newRecipe.images || [],
      author: {
        id: "current_user",
        name: "You",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        verified: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUserRecipes((prev) => [recipe, ...prev]);
    setShowGamification(true);
    setUserPoints((prev) => prev + 50); // Award points for creating recipe
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
            onClick={onNavigateBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Bites</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
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
              onClick={() => handleTabChange("bites")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "bites"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Bites
            </button>
            <button
              onClick={() => handleTabChange("feed")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "feed"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Feed
            </button>
            <button
              onClick={() => handleTabChange("scout")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "scout"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Scout
            </button>
            <button
              onClick={() => handleTabChange("snap")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "snap"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Snap
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
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
              onClick={loadBackendRecipes}
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
                onClick={loadBackendRecipes}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Refresh
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onSelect={handleRecipeSelect}
                onBookmark={handleBookmark}
                onLike={handleLike}
              />
            ))}
          </div>
        )}
      </div>

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
        onTabChange={handleTabChange}
        onNavigateToFeed={onNavigateToFeed}
        onNavigateToScout={onNavigateToScout}
        onNavigateToSnap={onNavigateToSnap}
      />
    </div>
  );
}
