// Direct Spoonacular API integration for recipes
// This bypasses the backend service and calls Spoonacular directly

const SPOONACULAR_API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY;
const SPOONACULAR_BASE_URL = "https://api.spoonacular.com/recipes";

interface SpoonacularRecipe {
  id: number;
  title: string;
  summary: string;
  image: string;
  readyInMinutes: number;
  preparationMinutes?: number;
  servings: number;
  cuisines: string[];
  dishTypes: string[];
  spoonacularScore: number;
  aggregateLikes: number;
  extendedIngredients: Array<{
    original: string;
    name: string;
    amount: number;
    unit: string;
  }>;
  analyzedInstructions: Array<{
    steps: Array<{
      step: number;
      instruction: string;
    }>;
  }>;
  nutrition: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
}

interface SpoonacularSearchResponse {
  results: SpoonacularRecipe[];
  totalResults: number;
  offset: number;
  number: number;
}

export interface RecipeSearchParams {
  query?: string;
  cuisine?: string;
  diet?: string;
  intolerances?: string;
  number?: number;
  offset?: number;
}

export class SpoonacularService {
  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    if (!SPOONACULAR_API_KEY) {
      throw new Error("Spoonacular API key is not configured");
    }

    const url = new URL(`${SPOONACULAR_BASE_URL}${endpoint}`);
    url.searchParams.set("apiKey", SPOONACULAR_API_KEY);

    // Add all parameters to the URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value.toString());
      }
    });

    console.log(`🍽️ Spoonacular API Request: ${endpoint}`, params);

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Spoonacular API error: ${response.status} - ${
            errorData.message || response.statusText
          }`
        );
      }

      const data = await response.json();
      console.log(`✅ Spoonacular API Success: ${endpoint}`, {
        status: response.status,
        resultsCount: data.results?.length || 0,
      });

      return data;
    } catch (error) {
      console.error(`❌ Spoonacular API Error (${endpoint}):`, error);
      throw error;
    }
  }

  async searchRecipes(
    params: RecipeSearchParams
  ): Promise<SpoonacularSearchResponse> {
    const searchParams = {
      query: params.query || "",
      cuisine: params.cuisine || "",
      diet: params.diet || "",
      intolerances: params.intolerances || "",
      number: params.number || 12,
      offset: params.offset || 0,
      addRecipeInformation: true,
      addRecipeNutrition: true,
      fillIngredients: true,
    };

    return this.makeRequest<SpoonacularSearchResponse>(
      "/complexSearch",
      searchParams
    );
  }

  async getRecipeDetails(recipeId: number): Promise<SpoonacularRecipe> {
    return this.makeRequest<SpoonacularRecipe>(`/${recipeId}/information`, {
      includeNutrition: true,
    });
  }

  async getRandomRecipes(
    number: number = 12
  ): Promise<{ recipes: SpoonacularRecipe[] }> {
    return this.makeRequest<{ recipes: SpoonacularRecipe[] }>("/random", {
      number,
      includeNutrition: true,
    });
  }
}

// Singleton instance
export const spoonacularService = new SpoonacularService();

// Helper function to convert Spoonacular recipe to our Recipe format
export function convertSpoonacularRecipe(recipe: SpoonacularRecipe): any {
  return {
    id: recipe.id.toString(),
    title: recipe.title || "Untitled Recipe",
    description:
      recipe.summary?.replace(/<[^>]*>/g, "") || "No description available",
    image:
      recipe.image ||
      "https://images.unsplash.com/photo-1556909065-f3d8ab622461?w=400",
    cookingTime: recipe.readyInMinutes || 30,
    difficulty: "Medium" as const,
    servings: recipe.servings || 4,
    cuisine: recipe.cuisines?.[0] || "International",
    rating: recipe.spoonacularScore
      ? Math.round(recipe.spoonacularScore / 20)
      : 4.0,
    reviews: recipe.aggregateLikes || 0,
    author: {
      name: "Spoonacular",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      verified: true,
    },
    ingredients: recipe.extendedIngredients?.map((ing) => ing.original) || [],
    instructions:
      recipe.analyzedInstructions?.[0]?.steps?.map(
        (step) => step.instruction
      ) || [],
    tags: recipe.dishTypes || [],
    nutrition: {
      calories:
        recipe.nutrition?.nutrients?.find((n) => n.name === "Calories")
          ?.amount || 0,
      protein:
        recipe.nutrition?.nutrients?.find((n) => n.name === "Protein")
          ?.amount || 0,
      carbs:
        recipe.nutrition?.nutrients?.find((n) => n.name === "Carbohydrates")
          ?.amount || 0,
      fat:
        recipe.nutrition?.nutrients?.find((n) => n.name === "Fat")?.amount || 0,
      fiber:
        recipe.nutrition?.nutrients?.find((n) => n.name === "Fiber")?.amount ||
        0,
      sugar:
        recipe.nutrition?.nutrients?.find((n) => n.name === "Sugar")?.amount ||
        0,
      sodium:
        recipe.nutrition?.nutrients?.find((n) => n.name === "Sodium")?.amount ||
        0,
    },
    calories:
      recipe.nutrition?.nutrients?.find((n) => n.name === "Calories")?.amount ||
      300,
    preparationTime: recipe.preparationMinutes || 15,
    totalTime:
      (recipe.readyInMinutes || 30) + (recipe.preparationMinutes || 15),
    nutritionInfo: recipe.nutrition || {},
    isSaved: false,
    isBackendRecipe: true,
  };
}
