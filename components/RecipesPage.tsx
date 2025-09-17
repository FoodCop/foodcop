import { ArrowLeft, Filter, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { Recipe, mockRecipes } from "./constants/recipesData";
import { NewRecipe, RecipeCreatorPage } from "./features/RecipeCreatorPage";
import { GamificationPopup } from "./recipes/GamificationPopup";
import { RecipeCard } from "./recipes/RecipeCard";
import { RecipeDetail } from "./recipes/RecipeDetail";
import { spoonacularService, convertSpoonacularRecipe } from "../src/lib/spoonacular";

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

  // Combine all recipe sources
  const allRecipes = [...mockRecipes, ...userRecipes, ...backendRecipes];

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
        const convertedRecipes: Recipe[] = response.results.map(convertSpoonacularRecipe);
        setBackendRecipes(convertedRecipes);
        console.log(`✅ Loaded ${convertedRecipes.length} recipes from Spoonacular API`);
      } else {
        console.warn("⚠️ No recipes returned from Spoonacular API");
        setError("No recipes available at the moment");
      }
    } catch (err: any) {
      console.error("❌ Failed to load recipes from Spoonacular API:", err);
      setError(`Failed to load recipes: ${err.message}`);
      console.log("📚 Falling back to local recipe data only");
    } finally {
      setLoading(false);
    }
  };

  // Debounced backend search
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        searchBackendRecipes(searchQuery);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]);

  const searchBackendRecipes = async (query: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🔍 Searching Spoonacular API for: "${query}"`);
      const response = await spoonacularService.searchRecipes({
        query: query,
        number: 12,
      });

      if (response.results && response.results.length > 0) {
        const convertedRecipes: Recipe[] = response.results.map(convertSpoonacularRecipe);
        setBackendRecipes(convertedRecipes);
        console.log(`✅ Found ${convertedRecipes.length} recipes for "${query}"`);
      } else {
        console.warn(`⚠️ No recipes found for "${query}"`);
        setError(`No recipes found for "${query}"`);
      }
    } catch (err: any) {
      console.error("❌ Spoonacular recipe search failed:", err);
      setError(`Search failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setCurrentView("detail");
  };

  const handleBackToFeed = () => {
    setCurrentView("feed");
    setSelectedRecipe(null);
  };

  const handleSaveRecipe = () => {
    // Mock save action - in real app would save to user's collection
    setUserPoints((prev) => prev + 10);
    setShowGamification(true);
  };

  const handleShareRecipe = () => {
    // Mock share action
    setUserPoints((prev) => prev + 20);
    setShowGamification(true);
  };

  const handleCreateRecipe = () => {
    setCurrentView("create");
  };

  const handleSaveNewRecipe = (newRecipe: NewRecipe) => {
    // Convert NewRecipe to Recipe format
    const recipe: Recipe = {
      id: `user_${Date.now()}`,
      title: newRecipe.title,
      description: newRecipe.description,
      image:
        newRecipe.mainImage ||
        "https://images.unsplash.com/photo-1556909065-f3d8ab622461?w=400",
      cookingTime: newRecipe.cookingTime,
      difficulty: newRecipe.difficulty,
      servings: newRecipe.servings,
      cuisine: newRecipe.cuisine,
      rating: 0,
      reviews: 0,
      author: {
        name: "You",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        verified: false,
      },
      ingredients: newRecipe.ingredients.map((ing) => ({
        id: Math.random().toString(36),
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
      })),
      instructions: newRecipe.steps.map((step, index) => ({
        id: Math.random().toString(36),
        step: index + 1,
        description: step.instruction,
      })),
      tags: newRecipe.tags,
      nutrition: newRecipe.nutritionInfo || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      },
      calories: newRecipe.nutritionInfo?.calories || 0,
      preparationTime: 15,
      totalTime: newRecipe.cookingTime + 15,
      nutritionInfo: newRecipe.nutritionInfo,
      isSaved: false,
      isUserCreated: true,
    };

    setUserRecipes((prev) => [recipe, ...prev]);
    setUserPoints((prev) => prev + 50); // Bonus points for creating a recipe
    setCurrentView("feed");
    setShowGamification(true);
  };

  if (currentView === "create") {
    return (
      <RecipeCreatorPage
        onNavigateBack={handleBackToFeed}
        onSaveRecipe={handleSaveNewRecipe}
      />
    );
  }

  if (currentView === "detail" && selectedRecipe) {
    return (
      <>
        <RecipeDetail
          recipe={selectedRecipe}
          onBack={handleBackToFeed}
          onSave={handleSaveRecipe}
          onShare={handleShareRecipe}
        />
        {showGamification && (
          <GamificationPopup
            points={selectedRecipe.isUserCreated ? 50 : 20}
            action={
              selectedRecipe.isUserCreated
                ? "creating a recipe"
                : "saving a recipe"
            }
            currentPoints={userPoints}
            onClose={() => setShowGamification(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            {onNavigateBack && (
              <button
                onClick={onNavigateBack}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[#0B1F3A]" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F3A]">Bites</h1>
              <p className="text-sm text-gray-600">Discover amazing recipes</p>
            </div>
          </div>

          <button
            onClick={handleCreateRecipe}
            className="w-10 h-10 rounded-full bg-[#F14C35] flex items-center justify-center hover:bg-[#E63E26] transition-colors"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search recipes, cuisines, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl bg-[#F8F9FA] focus:outline-none focus:border-[#F14C35] focus:ring-2 focus:ring-[#F14C35]/20 transition-colors"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <Filter className="h-5 w-5 text-[#F14C35]" />
            </button>
          </div>
        </div>

        {/* Filter Tags (when expanded) */}
        {showFilters && (
          <div className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {[
                "Quick",
                "Healthy",
                "Vegetarian",
                "High-Protein",
                "Low-Carb",
                "Dessert",
              ].map((filter) => (
                <button
                  key={filter}
                  className="px-4 py-2 bg-gray-100 hover:bg-[#F14C35] hover:text-white rounded-full text-sm font-medium transition-colors"
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recipe Feed */}
      <div className="p-4">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <div className="w-5 h-5 text-red-500 mr-3">⚠️</div>
              <div>
                <p className="text-sm font-medium text-red-800">{error}</p>
                <p className="text-xs text-red-600 mt-1">
                  Showing local recipes as fallback
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center">
              <div className="w-5 h-5 text-blue-500 mr-3 animate-spin">⏳</div>
              <p className="text-sm text-blue-800">
                {searchQuery ? `Searching for "${searchQuery}"...` : "Loading recipes..."}
              </p>
            </div>
          </div>
        )}

        {searchQuery && !loading && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {filteredRecipes.length} recipe
              {filteredRecipes.length !== 1 ? "s" : ""} found for "{searchQuery}
              "
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => handleRecipeSelect(recipe)}
              onSave={handleSaveRecipe}
              onShare={handleShareRecipe}
            />
          ))}
        </div>

        {filteredRecipes.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-[#0B1F3A] mb-2">
              No recipes found
            </h3>
            <p className="text-gray-600">
              Try searching for something else or browse our featured recipes.
            </p>
          </div>
        )}

        {/* Load More Button (for infinite scroll simulation) */}
        {filteredRecipes.length > 0 && (
          <div className="text-center mt-8">
            <button className="px-6 py-3 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors">
              Load More Recipes
            </button>
          </div>
        )}
      </div>

      {/* Gamification Popup */}
      {showGamification && (
        <GamificationPopup
          points={10}
          action="exploring recipes"
          currentPoints={userPoints}
          onClose={() => setShowGamification(false)}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
