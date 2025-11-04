import { useState, useEffect } from "react";
import { RecipeCard } from "./components/RecipeCard";
import type { Recipe } from "./components/RecipeCard";
import { RecipeDetailDialog } from "./components/RecipeDetailDialog";
import { FilterBar } from "./components/FilterBar";
import { Button } from "../ui/button";
import { Shuffle, Loader2, AlertCircle } from "lucide-react";
import { SpoonacularService } from "../../services/spoonacular";
import { useAuth } from "../auth/AuthProvider";

// Spoonacular API response types
interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes?: number;
  servings?: number;
  diets?: string[];
  cuisines?: string[];
  summary?: string;
  instructions?: string;
  extendedIngredients?: {
    id: number;
    original: string;
    name?: string;
    amount?: number;
    unit?: string;
  }[];
  sourceUrl?: string;
  aggregateLikes?: number;
  healthScore?: number;
  pricePerServing?: number;
  analyzedInstructions?: {
    name: string;
    steps: {
      number: number;
      step: string;
      ingredients?: { id: number; name: string; image: string }[];
      equipment?: { id: number; name: string; image: string }[];
    }[];
  }[];
  preparationMinutes?: number;
  cookingMinutes?: number;
}

export default function App() {
  // Authentication
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial recipes
  useEffect(() => {
    loadRecipes("popular recipes");
  }, []);

  const loadRecipes = async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await SpoonacularService.searchRecipes(query, 12);
      
      if (result.success && result.data?.results) {
        // ✅ Transform Spoonacular data and RETAIN rich fields from API response
        const transformedRecipes: Recipe[] = result.data.results.map((recipe: SpoonacularRecipe) => ({
          id: recipe.id,
          title: recipe.title,
          image: recipe.image,
          readyInMinutes: recipe.readyInMinutes || 30,
          servings: recipe.servings || 4,
          diets: recipe.diets || [],
          cuisines: recipe.cuisines || [],
          summary: recipe.summary || "No description available.",
          // ✅ RETAIN instructions and ingredients from search API (addRecipeInformation: true)
          instructions: recipe.instructions || "",
          extendedIngredients: recipe.extendedIngredients || [],
          // ✅ RETAIN additional fields if present
          sourceUrl: recipe.sourceUrl,
          aggregateLikes: recipe.aggregateLikes,
          healthScore: recipe.healthScore,
          pricePerServing: recipe.pricePerServing,
          analyzedInstructions: recipe.analyzedInstructions,
          preparationMinutes: recipe.preparationMinutes,
          cookingMinutes: recipe.cookingMinutes,
        }));
        
        console.log('✅ Loaded recipes with rich data:', transformedRecipes.map(r => ({
          id: r.id,
          title: r.title,
          hasInstructions: !!r.instructions,
          ingredientCount: r.extendedIngredients?.length || 0
        })));
        
        setRecipes(transformedRecipes);
      } else {
        setError(result.error || "Failed to load recipes");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
      console.error("Recipe loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Search recipes when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        loadRecipes(searchQuery);
      }, 500); // Debounce search
      
      return () => clearTimeout(timeoutId);
    } else {
      loadRecipes("popular recipes");
    }
  }, [searchQuery]);

  const handleDietToggle = (diet: string) => {
    setSelectedDiets((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    );
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setDialogOpen(true);
  };

  const handleRandomize = () => {
    const shuffled = [...recipes].sort(() => Math.random() - 0.5);
    setRecipes(shuffled);
  };

  // Filter recipes based on search query and selected diets
  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesDiets =
      selectedDiets.length === 0 ||
      selectedDiets.some((diet) => recipe.diets.includes(diet));

    return matchesSearch && matchesDiets;
  });

  // Split recipes into recommended and you might like
  const recommendedRecipes = filteredRecipes.slice(0, 3);
  const mightLikeRecipes = filteredRecipes.slice(3);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="mb-2">Bites</h1>
          <p className="text-gray-600">
            Discover delicious recipes tailored to your preferences
          </p>
        </div>

        <div className="mb-8">
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedDiets={selectedDiets}
            onDietToggle={handleDietToggle}
          />
        </div>

        <div className="mb-8">
          <Button
            onClick={handleRandomize}
            variant="outline"
            className="gap-2 border-gray-300"
            disabled={loading}
          >
            <Shuffle className="w-4 h-4" />
            Randomize Recipes
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Loading delicious recipes...</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center justify-center py-16">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <div className="ml-2">
              <p className="text-red-600 font-medium">Failed to load recipes</p>
              <p className="text-gray-500 text-sm">{error}</p>
              <Button 
                onClick={() => loadRecipes("popular recipes")} 
                variant="outline" 
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {filteredRecipes.length === 0 && !loading && !error ? (
          <div className="text-center py-16">
            <p className="text-gray-500">
              No recipes found. Try adjusting your filters.
            </p>
          </div>
        ) : (
          !loading && !error && (
            <div className="space-y-12">
            {recommendedRecipes.length > 0 && (
              <div>
                <h2 className="mb-6">Recommended for you</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedRecipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onClick={() => handleRecipeClick(recipe)}
                    />
                  ))}
                </div>
              </div>
            )}

            {mightLikeRecipes.length > 0 && (
              <div>
                <h2 className="mb-6">You might also like</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mightLikeRecipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onClick={() => handleRecipeClick(recipe)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          )
        )}
      </div>

      <RecipeDetailDialog
        recipe={selectedRecipe}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}