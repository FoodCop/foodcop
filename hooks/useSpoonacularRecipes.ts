import { useEffect, useState } from "react";
import { Recipe } from "../components/constants/recipesData";
import {
  convertSpoonacularRecipe,
  spoonacularService,
} from "../src/lib/spoonacular";

interface UseSpoonacularRecipesOptions {
  query?: string;
  cuisine?: string;
  diet?: string;
  number?: number;
}

export function useSpoonacularRecipes(
  options: UseSpoonacularRecipesOptions = {}
) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        query: options.query || "",
        cuisine: options.cuisine || "",
        diet: options.diet || "",
        number: options.number || 6,
      };

      console.log(
        "🍽️ Loading recipes from Spoonacular API with params:",
        params
      );

      const response = await spoonacularService.searchRecipes(params);

      if (response.results && response.results.length > 0) {
        // Convert Spoonacular recipes to our Recipe interface using the existing function
        const convertedRecipes = response.results.map(convertSpoonacularRecipe);

        setRecipes(convertedRecipes);
        console.log(
          `✅ Loaded ${convertedRecipes.length} recipes from Spoonacular API`
        );
      } else {
        console.warn("⚠️ No recipes returned from Spoonacular API");
        setError("No recipes available at the moment");
      }
    } catch (err) {
      console.error("❌ Failed to fetch Spoonacular recipes:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch recipes");
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchRecipes();
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  return {
    recipes,
    loading,
    error,
    refetch,
  };
}
