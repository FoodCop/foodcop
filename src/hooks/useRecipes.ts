import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { SpoonacularService } from '../services/spoonacular';
import { ProfileService } from '../services/profileService';
import type { Recipe, SpoonacularRecipe, RecipeFilters } from '../types/recipe';
import { toast } from 'sonner';

interface UseRecipesOptions {
  initialQuery?: string;
  enableFallback?: boolean;
  fallbackThreshold?: number;
}

interface UseRecipesReturn {
  recipes: Recipe[];
  fallbackRecipes: Recipe[];
  loading: boolean;
  loadingFallback: boolean;
  error: string | null;
  dietaryFilters: string[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setDietaryFilters: (filters: string[]) => void;
  loadRecipes: (query: string) => Promise<void>;
  refreshRecipes: () => Promise<void>;
  shuffleRecipes: () => void;
  clearError: () => void;
}

/**
 * Custom hook for managing recipe data, search, and filtering
 * Consolidates logic from Bites.tsx, BitesDesktop.tsx, and BitesMobile.tsx
 */
export function useRecipes(options: UseRecipesOptions = {}): UseRecipesReturn {
  const { 
    initialQuery = 'popular recipes',
    enableFallback = true,
    fallbackThreshold = 6
  } = options;

  const { user } = useAuth();
  
  // State
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [fallbackRecipes, setFallbackRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFallback, setLoadingFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Transform Spoonacular recipe to app Recipe type
   */
  const transformRecipe = useCallback((recipe: SpoonacularRecipe): Recipe => {
    return {
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.readyInMinutes || 30,
      servings: recipe.servings || 4,
      diets: recipe.diets || [],
      cuisines: recipe.cuisines || [],
      summary: recipe.summary || "No description available.",
      instructions: recipe.instructions || "",
      extendedIngredients: recipe.extendedIngredients || [],
      sourceUrl: recipe.sourceUrl,
      aggregateLikes: recipe.aggregateLikes,
      healthScore: recipe.healthScore,
      pricePerServing: recipe.pricePerServing,
      analyzedInstructions: recipe.analyzedInstructions,
      preparationMinutes: recipe.preparationMinutes,
      cookingMinutes: recipe.cookingMinutes,
      nutrition: recipe.nutrition,
      winePairing: recipe.winePairing,
    };
  }, []);

  /**
   * Fetch user dietary preferences from profile
   */
  const fetchUserPreferences = useCallback(async (): Promise<string[]> => {
    if (!user) return [];
    
    try {
      const profileResult = await ProfileService.getProfile();
      if (profileResult.success && profileResult.data?.dietary_preferences) {
        return profileResult.data.dietary_preferences;
      }
    } catch (err) {
      console.error('Error fetching user preferences:', err);
    }
    return [];
  }, [user]);

  /**
   * Load fallback recipes with relaxed dietary restrictions
   */
  const loadFallbackRecipes = useCallback(async (
    query: string, 
    userPreferences: string[]
  ) => {
    if (!enableFallback) return;
    
    setLoadingFallback(true);
    
    try {
      // Strategy: Keep vegan/vegetarian, relax other restrictions
      const relaxedPrefs = userPreferences.filter(pref => 
        pref === 'vegan' || pref === 'vegetarian'
      );
      
      const { getSpoonacularDietParam } = await import('../utils/preferenceMapper');
      const relaxedDietParam = getSpoonacularDietParam(relaxedPrefs);
      
      const fallbackParams: Parameters<typeof SpoonacularService.searchRecipes>[0] = {
        query: query || 'popular healthy recipes',
        number: 12
      };
      
      if (relaxedDietParam) {
        fallbackParams.diet = relaxedDietParam;
      }
      
      const result = await SpoonacularService.searchRecipes(fallbackParams);
      
      if (result.success && result.data?.results) {
        const transformedRecipes = result.data.results.map(transformRecipe);
        
        // Filter out duplicates with main recipes
        const mainRecipeIds = new Set(recipes.map(r => r.id));
        const uniqueFallbacks = transformedRecipes.filter(r => !mainRecipeIds.has(r.id));
        
        setFallbackRecipes(uniqueFallbacks);
      } else {
        setError(result.error || "Failed to load additional recipes");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load additional recipes';
      toast.error(errorMessage);
    } finally {
      setLoadingFallback(false);
    }
  }, [enableFallback, recipes, transformRecipe]);

  /**
   * Main recipe loading function
   */
  const loadRecipes = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    setFallbackRecipes([]); // Clear fallback recipes on new search
    
    try {
      // Fetch user preferences
      const userPreferences = await fetchUserPreferences();
      
      // Map preferences to Spoonacular diet parameter
      const { getSpoonacularDietParam } = await import('../utils/preferenceMapper');
      const dietParam = getSpoonacularDietParam(userPreferences);

      // Build search params
      const hasPreferences = userPreferences.length > 0;
      const searchParams: Parameters<typeof SpoonacularService.searchRecipes>[0] = {
        query,
        number: hasPreferences ? 24 : 12 // Request more when filtering
      };

      // Add diet filter if user has preferences
      if (dietParam) {
        searchParams.diet = dietParam;
      }

      const result = await SpoonacularService.searchRecipes(searchParams);
      
      if (result.success && result.data?.results) {
        const transformedRecipes = result.data.results.map(transformRecipe);
        
        // Shuffle on first load only
        const { shuffleArray, hasRecipesBeenShuffled, markRecipesAsShuffled } = 
          await import('../utils/preferenceMapper');
        let finalRecipes = transformedRecipes;
        
        if (!hasRecipesBeenShuffled()) {
          finalRecipes = shuffleArray(transformedRecipes);
          markRecipesAsShuffled();
        }
        
        setRecipes(finalRecipes);
        
        // Load fallback recipes if results are sparse
        if (finalRecipes.length < fallbackThreshold && dietParam) {
          loadFallbackRecipes(query, userPreferences);
        }
      } else {
        setError(result.error || "Failed to load recipes");
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Network error. Please check your connection.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchUserPreferences, transformRecipe, fallbackThreshold, loadFallbackRecipes]);

  /**
   * Shuffle current recipes
   */
  const shuffleRecipes = useCallback(async () => {
    const { shuffleArray } = await import('../utils/preferenceMapper');
    const shuffled = shuffleArray([...recipes]);
    setRecipes(shuffled);
  }, [recipes]);

  /**
   * Refresh recipes with current query
   */
  const refreshRecipes = useCallback(async () => {
    await loadRecipes(searchQuery || initialQuery);
  }, [searchQuery, initialQuery, loadRecipes]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Load initial recipes on mount
   */
  useEffect(() => {
    loadRecipes(initialQuery);
  }, []); // Only run on mount

  /**
   * Handle search query changes with debounce
   */
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        loadRecipes(searchQuery);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      loadRecipes(initialQuery);
    }
  }, [searchQuery]); // Intentionally not including loadRecipes to prevent loops

  return {
    recipes,
    fallbackRecipes,
    loading,
    loadingFallback,
    error,
    dietaryFilters,
    searchQuery,
    setSearchQuery,
    setDietaryFilters,
    loadRecipes,
    refreshRecipes,
    shuffleRecipes,
    clearError,
  };
}

/**
 * Filter recipes based on dietary preferences and search query
 */
export function filterRecipes(
  recipes: Recipe[],
  filters: RecipeFilters
): Recipe[] {
  return recipes.filter((recipe) => {
    // Match search query
    const matchesSearch = recipe.title
      .toLowerCase()
      .includes(filters.searchQuery.toLowerCase());
    
    // Match dietary preferences
    const matchesDiets =
      filters.dietaryPreferences.length === 0 ||
      filters.dietaryPreferences.some((diet) => 
        recipe.diets.map(d => d.toLowerCase()).includes(diet.toLowerCase())
      );
    
    // Match cuisine type if specified
    const matchesCuisine = !filters.cuisineType || 
      recipe.cuisines.some(c => 
        c.toLowerCase() === filters.cuisineType?.toLowerCase()
      );
    
    // Match ready time if specified
    const matchesTime = !filters.maxReadyTime || 
      recipe.readyInMinutes <= filters.maxReadyTime;
    
    return matchesSearch && matchesDiets && matchesCuisine && matchesTime;
  });
}
