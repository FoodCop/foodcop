/**
 * Spoonacular API Integration for Recipe Data
 * Used by Master Bot system for dynamic recipe content generation
 */

interface SpoonacularConfig {
  apiKey: string;
  baseUrl: string;
  maxRetries: number;
  retryDelay: number;
}

export interface RecipeFilters {
  cuisines?: string[];
  diet?: string[];
  intolerances?: string[];
  type?: string[];
  maxReadyTime?: number;
  minHealthScore?: number;
  includeIngredients?: string[];
  excludeIngredients?: string[];
  number?: number;
}

export interface SpoonacularRecipe {
  id: number;
  title: string;
  summary: string;
  image: string;
  sourceUrl: string;
  readyInMinutes: number;
  servings: number;
  healthScore: number;
  spoonacularScore: number;
  pricePerServing: number;
  analyzedInstructions: {
    name: string;
    steps: {
      number: number;
      step: string;
      ingredients: any[];
      equipment: any[];
    }[];
  }[];
  extendedIngredients: {
    id: number;
    aisle: string;
    image: string;
    consistency: string;
    name: string;
    nameClean: string;
    original: string;
    originalName: string;
    amount: number;
    unit: string;
  }[];
  nutrition?: {
    nutrients: {
      name: string;
      amount: number;
      unit: string;
      percentOfDailyNeeds: number;
    }[];
  };
  cuisines: string[];
  diets: string[];
  dishTypes: string[];
  occasions: string[];
  veryHealthy: boolean;
  veryPopular: boolean;
  whole30: boolean;
  weightWatcherSmartPoints: number;
  gaps: string;
  lowFodmap: boolean;
  sustainable: boolean;
  ketogenic: boolean;
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
}

export interface RecipeSearchResult {
  id: number;
  title: string;
  image: string;
  imageType: string;
  nutrition?: {
    nutrients: {
      name: string;
      amount: number;
      unit: string;
    }[];
  };
}

class SpoonacularAPI {
  private config: SpoonacularConfig | null = null;

  private getConfig(): SpoonacularConfig {
    if (!this.config) {
      this.config = {
        apiKey: this.getApiKey(),
        baseUrl: "https://api.spoonacular.com",
        maxRetries: 3,
        retryDelay: 1000,
      };
    }
    return this.config;
  }

  private getApiKey(): string {
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      throw new Error("SPOONACULAR_API_KEY environment variable is required");
    }
    return apiKey;
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    const config = this.getConfig();
    const url = new URL(`${config.baseUrl}${endpoint}`);

    // Add API key and default parameters
    url.searchParams.append("apiKey", config.apiKey);

    // Add custom parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          url.searchParams.append(key, value.join(","));
        } else {
          url.searchParams.append(key, value.toString());
        }
      }
    });

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        console.log(
          `🍴 Spoonacular API Request (Attempt ${attempt}): ${url.toString()}`
        );

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error(
            `Spoonacular API error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log(`✅ Spoonacular API Success: ${endpoint}`);
        return data;
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Spoonacular API error (Attempt ${attempt}):`, error);

        if (attempt < config.maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, config.retryDelay * attempt)
          );
        }
      }
    }

    throw new Error(
      `Spoonacular API failed after ${config.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Search for recipes with complex filtering
   */
  async searchRecipes(filters: RecipeFilters = {}): Promise<{
    results: RecipeSearchResult[];
    offset: number;
    number: number;
    totalResults: number;
  }> {
    const params: Record<string, any> = {
      ...filters,
      addRecipeNutrition: true,
      addRecipeInstructions: false,
      fillIngredients: false,
      number: filters.number || 20,
    };

    return this.makeRequest("/recipes/complexSearch", params);
  }

  /**
   * Get detailed recipe information by ID
   */
  async getRecipeDetails(id: number): Promise<SpoonacularRecipe> {
    return this.makeRequest(`/recipes/${id}/information`, {
      includeNutrition: true,
    });
  }

  /**
   * Get multiple recipe details in bulk
   */
  async getRecipeDetailsBulk(ids: number[]): Promise<SpoonacularRecipe[]> {
    if (ids.length === 0) return [];

    return this.makeRequest("/recipes/informationBulk", {
      ids: ids.join(","),
      includeNutrition: true,
    });
  }

  /**
   * Get recipes for specific bot specialty with optimized filters
   */
  async getRecipesForBotSpecialty(
    specialty: string,
    count: number = 10
  ): Promise<SpoonacularRecipe[]> {
    const specialtyFilters = this.getFiltersForSpecialty(specialty);

    console.log(`🤖 Getting ${count} recipes for bot specialty: ${specialty}`);
    console.log(`🔍 Using filters:`, specialtyFilters);

    const searchResult = await this.searchRecipes({
      ...specialtyFilters,
      number: count * 2, // Get more to filter down
    });

    if (searchResult.results.length === 0) {
      throw new Error(`No recipes found for specialty: ${specialty}`);
    }

    // Get detailed information for top recipes
    const topRecipeIds = searchResult.results
      .slice(0, count)
      .map((recipe) => recipe.id);

    const detailedRecipes = await this.getRecipeDetailsBulk(topRecipeIds);

    // Filter by health score and quality
    const qualityRecipes = detailedRecipes.filter(
      (recipe) =>
        recipe.healthScore >= (specialtyFilters.minHealthScore || 50) &&
        recipe.readyInMinutes <= (specialtyFilters.maxReadyTime || 120) &&
        recipe.title.length > 5
    );

    console.log(
      `✅ Found ${qualityRecipes.length} quality recipes for ${specialty}`
    );
    return qualityRecipes;
  }

  /**
   * Get filters based on bot specialty tag
   */
  private getFiltersForSpecialty(specialty: string): RecipeFilters {
    const specialtyMap: Record<string, RecipeFilters> = {
      street_food: {
        cuisines: ["asian", "indian", "mexican", "thai"],
        maxReadyTime: 30,
        minHealthScore: 50,
        type: ["appetizer", "snack", "side dish"],
      },
      fine_dining: {
        cuisines: ["french", "european", "contemporary"],
        minHealthScore: 70,
        type: ["main course", "appetizer"],
      },
      vegan: {
        diet: ["vegan", "vegetarian"],
        minHealthScore: 80,
        excludeIngredients: ["meat", "dairy", "eggs"],
      },
      coffee: {
        includeIngredients: ["coffee", "espresso"],
        type: ["beverage", "dessert"],
        minHealthScore: 40,
      },
      japanese: {
        cuisines: ["japanese"],
        minHealthScore: 65,
        includeIngredients: ["rice", "soy", "miso"],
      },
      spicy: {
        cuisines: ["indian", "thai", "mexican", "korean"],
        includeIngredients: ["chili", "pepper", "spicy"],
        minHealthScore: 50,
      },
      bbq: {
        cuisines: ["american", "southern"],
        includeIngredients: ["meat", "beef", "pork"],
        type: ["main course"],
        minHealthScore: 45,
      },
      healthy: {
        diet: ["healthy"],
        minHealthScore: 85,
        maxReadyTime: 45,
      },
      asian: {
        cuisines: ["asian", "chinese", "thai", "vietnamese", "korean"],
        includeIngredients: ["soy", "ginger", "garlic"],
        minHealthScore: 55,
      },
    };

    return (
      specialtyMap[specialty] || {
        minHealthScore: 60,
        maxReadyTime: 60,
      }
    );
  }

  /**
   * Transform Spoonacular recipe to our database format
   */
  transformRecipeForDatabase(recipe: SpoonacularRecipe) {
    return {
      spoon_id: recipe.id,
      title: recipe.title,
      summary: recipe.summary,
      image_url: recipe.image,
      source_url: recipe.sourceUrl,
      ready_in_minutes: recipe.readyInMinutes,
      servings: recipe.servings,
      health_score: recipe.healthScore,
      nutrients: recipe.nutrition?.nutrients || [],
      instructions:
        recipe.analyzedInstructions?.[0]?.steps?.map((step) => step.step) || [],
      ingredients: recipe.extendedIngredients || [],
      cuisines: recipe.cuisines || [],
      diets: recipe.diets || [],
      dish_types: recipe.dishTypes || [],
      occasions: recipe.occasions || [],
      tags: [
        ...recipe.cuisines,
        ...recipe.diets,
        ...recipe.dishTypes,
        ...(recipe.veryHealthy ? ["healthy"] : []),
        ...(recipe.veryPopular ? ["popular"] : []),
        ...(recipe.vegetarian ? ["vegetarian"] : []),
        ...(recipe.vegan ? ["vegan"] : []),
        ...(recipe.glutenFree ? ["gluten-free"] : []),
      ],
      very_healthy: recipe.veryHealthy,
      very_popular: recipe.veryPopular,
      whole30: recipe.whole30,
      quality_score: Math.round(
        (recipe.healthScore + recipe.spoonacularScore) / 2
      ),
    };
  }
}

// Export singleton instance
export const spoonacularAPI = new SpoonacularAPI();

// Export for testing
export { SpoonacularAPI };
