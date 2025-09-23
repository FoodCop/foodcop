import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { SpoonacularRecipe, spoonacularService } from "../lib/spoonacular";

export interface AIRecommendation {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  healthScore: number;
  pricePerServing: number;
  cuisines: string[];
  diets: string[];
  dishTypes: string[];
  summary: string;
  sourceUrl: string;
  spoonacularSourceUrl: string;
  veryHealthy: boolean;
  veryPopular: boolean;
  cheap: boolean;
  sustainable: boolean;
  extendedIngredients: Array<{
    id: number;
    name: string;
    amount: number;
    unit: string;
    image: string;
  }>;
  aiReasoning?: string;
  matchScore?: number;
}

export interface RecommendationFilters {
  maxReadyTime?: number;
  maxPrice?: number;
  minHealthScore?: number;
  includeHealthy?: boolean;
  includePopular?: boolean;
  includeCheap?: boolean;
  includeSustainable?: boolean;
  mealType?: "breakfast" | "lunch" | "dinner" | "snack" | "dessert";
}

export interface UseAIRecommendationsReturn {
  recommendations: AIRecommendation[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadRecommendations: (filters?: RecommendationFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  refreshRecommendations: () => Promise<void>;
  clearError: () => void;
}

export function useAIRecommendations(): UseAIRecommendationsReturn {
  const { profile } = useAuth();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<RecommendationFilters>(
    {}
  );

  const convertSpoonacularToRecommendation = useCallback(
    (recipe: SpoonacularRecipe, userPreferences: any): AIRecommendation => {
      // Calculate match score based on user preferences
      let matchScore = 0;
      let aiReasoning = "Recommended based on your preferences: ";

      // Check cuisine match
      if (userPreferences.cuisine_preferences && recipe.cuisines) {
        const cuisineMatch = recipe.cuisines.some((cuisine) =>
          userPreferences.cuisine_preferences.some((pref: string) =>
            cuisine.toLowerCase().includes(pref.toLowerCase())
          )
        );
        if (cuisineMatch) {
          matchScore += 30;
          aiReasoning += "matches your cuisine preferences, ";
        }
      }

      // Check dietary match
      if (userPreferences.dietary_preferences && recipe.diets) {
        const dietMatch = recipe.diets.some((diet) =>
          userPreferences.dietary_preferences.some((pref: string) =>
            diet.toLowerCase().includes(pref.toLowerCase())
          )
        );
        if (dietMatch) {
          matchScore += 25;
          aiReasoning += "fits your dietary needs, ";
        }
      }

      // Health score bonus
      if (recipe.healthScore > 70) {
        matchScore += 15;
        aiReasoning += "healthy option, ";
      }

      // Popularity bonus
      if (recipe.veryPopular) {
        matchScore += 10;
        aiReasoning += "popular choice, ";
      }

      // Price consideration
      if (recipe.pricePerServing < 5) {
        matchScore += 10;
        aiReasoning += "budget-friendly, ";
      }

      // Preparation time bonus
      if (recipe.readyInMinutes < 30) {
        matchScore += 10;
        aiReasoning += "quick to prepare, ";
      }

      return {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        readyInMinutes: recipe.readyInMinutes,
        servings: recipe.servings,
        healthScore: recipe.healthScore,
        pricePerServing: recipe.pricePerServing,
        cuisines: recipe.cuisines || [],
        diets: recipe.diets || [],
        dishTypes: recipe.dishTypes || [],
        summary: recipe.summary?.replace(/<[^>]*>/g, "") || "", // Remove HTML tags
        sourceUrl: recipe.sourceUrl,
        spoonacularSourceUrl: recipe.spoonacularSourceUrl,
        veryHealthy: recipe.veryHealthy,
        veryPopular: recipe.veryPopular,
        cheap: recipe.cheap,
        sustainable: recipe.sustainable,
        extendedIngredients:
          recipe.extendedIngredients?.map((ing) => ({
            id: ing.id,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            image: ing.image,
          })) || [],
        aiReasoning: aiReasoning.slice(0, -2) + ".",
        matchScore: Math.min(matchScore, 100),
      };
    },
    []
  );

  const loadRecommendations = useCallback(
    async (filters: RecommendationFilters = {}) => {
      if (!profile) {
        setError("User profile not found");
        return;
      }

      setIsLoading(true);
      setError(null);
      setCurrentOffset(0);
      setCurrentFilters(filters);

      try {
        // Convert user preferences to Spoonacular search parameters
        const searchParams =
          spoonacularService.convertUserPreferencesToSearchParams({
            dietary_preferences: profile.dietary_preferences,
            cuisine_preferences: profile.cuisine_preferences,
          });

        // Apply additional filters
        if (filters.maxReadyTime) {
          searchParams.maxReadyTime = filters.maxReadyTime;
        }
        if (filters.maxPrice) {
          searchParams.maxPricePerServing = filters.maxPrice;
        }
        if (filters.minHealthScore) {
          searchParams.minHealthScore = filters.minHealthScore;
        }
        if (filters.mealType) {
          searchParams.type = filters.mealType;
        }

        // Add sorting based on preferences
        searchParams.sort = "meta-score";
        searchParams.number = 12;

        const response = await spoonacularService.searchRecipes(searchParams);

        // Convert and sort by match score
        const convertedRecipes = response.results
          .map((recipe) => convertSpoonacularToRecommendation(recipe, profile))
          .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

        setRecommendations(convertedRecipes);
        setHasMore(response.offset + response.number < response.totalResults);
        setCurrentOffset(response.offset + response.number);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load recommendations";
        setError(errorMessage);
        console.error("AI Recommendations error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [profile, convertSpoonacularToRecommendation]
  );

  const loadMore = useCallback(async () => {
    if (!profile || isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const searchParams =
        spoonacularService.convertUserPreferencesToSearchParams({
          dietary_preferences: profile.dietary_preferences,
          cuisine_preferences: profile.cuisine_preferences,
        });

      // Apply current filters
      if (currentFilters.maxReadyTime) {
        searchParams.maxReadyTime = currentFilters.maxReadyTime;
      }
      if (currentFilters.maxPrice) {
        searchParams.maxPricePerServing = currentFilters.maxPrice;
      }
      if (currentFilters.minHealthScore) {
        searchParams.minHealthScore = currentFilters.minHealthScore;
      }
      if (currentFilters.mealType) {
        searchParams.type = currentFilters.mealType;
      }

      searchParams.sort = "meta-score";
      searchParams.number = 12;
      searchParams.offset = currentOffset;

      const response = await spoonacularService.searchRecipes(searchParams);

      const convertedRecipes = response.results
        .map((recipe) => convertSpoonacularToRecommendation(recipe, profile))
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      setRecommendations((prev) => [...prev, ...convertedRecipes]);
      setHasMore(response.offset + response.number < response.totalResults);
      setCurrentOffset(response.offset + response.number);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load more recommendations";
      setError(errorMessage);
      console.error("AI Recommendations error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    profile,
    isLoading,
    hasMore,
    currentOffset,
    currentFilters,
    convertSpoonacularToRecommendation,
  ]);

  const refreshRecommendations = useCallback(async () => {
    await loadRecommendations(currentFilters);
  }, [loadRecommendations, currentFilters]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load initial recommendations when profile is available
  useEffect(() => {
    if (profile && recommendations.length === 0 && !isLoading) {
      loadRecommendations();
    }
  }, [profile, recommendations.length, isLoading, loadRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    hasMore,
    loadRecommendations,
    loadMore,
    refreshRecommendations,
    clearError,
  };
}


