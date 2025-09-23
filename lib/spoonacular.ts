// Spoonacular API service for food recommendations
import { getEnv } from "../utils/env";

export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  imageType: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  spoonacularSourceUrl: string;
  healthScore: number;
  spoonacularScore: number;
  pricePerServing: number;
  analyzedInstructions: any[];
  cheap: boolean;
  creditsText: string;
  cuisines: string[];
  dairyFree: boolean;
  diets: string[];
  gaps: string;
  glutenFree: boolean;
  instructions: string;
  ketogenic: boolean;
  lowFodmap: boolean;
  occasions: string[];
  sustainable: boolean;
  vegan: boolean;
  vegetarian: boolean;
  veryHealthy: boolean;
  veryPopular: boolean;
  whole30: boolean;
  weightWatcherSmartPoints: number;
  dishTypes: string[];
  extendedIngredients: Array<{
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
    meta: string[];
    measures: {
      us: { amount: number; unitShort: string; unitLong: string };
      metric: { amount: number; unitShort: string; unitLong: string };
    };
  }>;
  summary: string;
  winePairing: any;
}

export interface SpoonacularSearchParams {
  query?: string;
  cuisine?: string[];
  diet?: string[];
  intolerances?: string[];
  type?: string;
  maxReadyTime?: number;
  minCalories?: number;
  maxCalories?: number;
  minProtein?: number;
  maxProtein?: number;
  minCarbs?: number;
  maxCarbs?: number;
  minFat?: number;
  maxFat?: number;
  minSugar?: number;
  maxSugar?: number;
  minFiber?: number;
  maxFiber?: number;
  minSodium?: number;
  maxSodium?: number;
  minCholesterol?: number;
  maxCholesterol?: number;
  minSaturatedFat?: number;
  maxSaturatedFat?: number;
  minVitaminA?: number;
  maxVitaminA?: number;
  minVitaminC?: number;
  maxVitaminC?: number;
  minVitaminD?: number;
  maxVitaminD?: number;
  minVitaminE?: number;
  maxVitaminE?: number;
  minVitaminK?: number;
  maxVitaminK?: number;
  minVitaminB1?: number;
  maxVitaminB1?: number;
  minVitaminB2?: number;
  maxVitaminB2?: number;
  minVitaminB5?: number;
  maxVitaminB5?: number;
  minVitaminB3?: number;
  maxVitaminB3?: number;
  minVitaminB6?: number;
  maxVitaminB6?: number;
  minVitaminB12?: number;
  maxVitaminB12?: number;
  minFolate?: number;
  maxFolate?: number;
  minCalcium?: number;
  maxCalcium?: number;
  minIron?: number;
  maxIron?: number;
  minMagnesium?: number;
  maxMagnesium?: number;
  minPhosphorus?: number;
  maxPhosphorus?: number;
  minPotassium?: number;
  maxPotassium?: number;
  minZinc?: number;
  maxZinc?: number;
  minCopper?: number;
  maxCopper?: number;
  minManganese?: number;
  maxManganese?: number;
  minSelenium?: number;
  maxSelenium?: number;
  offset?: number;
  number?: number;
  limitLicense?: boolean;
  instructionsRequired?: boolean;
  addRecipeInformation?: boolean;
  addRecipeNutrition?: boolean;
  fillIngredients?: boolean;
  includeIngredients?: string[];
  excludeIngredients?: string[];
  sort?:
    | "meta-score"
    | "popularity"
    | "healthiness"
    | "price"
    | "time"
    | "random";
  sortDirection?: "asc" | "desc";
  minCarbs?: number;
  maxCarbs?: number;
  minProtein?: number;
  maxProtein?: number;
  minCalories?: number;
  maxCalories?: number;
  minFat?: number;
  maxFat?: number;
  minSugar?: number;
  maxSugar?: number;
  minFiber?: number;
  maxFiber?: number;
  minSodium?: number;
  maxSodium?: number;
  minCholesterol?: number;
  maxCholesterol?: number;
  minSaturatedFat?: number;
  maxSaturatedFat?: number;
  minVitaminA?: number;
  maxVitaminA?: number;
  minVitaminC?: number;
  maxVitaminC?: number;
  minVitaminD?: number;
  maxVitaminD?: number;
  minVitaminE?: number;
  maxVitaminE?: number;
  minVitaminK?: number;
  maxVitaminK?: number;
  minVitaminB1?: number;
  maxVitaminB1?: number;
  minVitaminB2?: number;
  maxVitaminB2?: number;
  minVitaminB5?: number;
  maxVitaminB5?: number;
  minVitaminB3?: number;
  maxVitaminB3?: number;
  minVitaminB6?: number;
  maxVitaminB6?: number;
  minVitaminB12?: number;
  maxVitaminB12?: number;
  minFolate?: number;
  maxFolate?: number;
  minCalcium?: number;
  maxCalcium?: number;
  minIron?: number;
  maxIron?: number;
  minMagnesium?: number;
  maxMagnesium?: number;
  minPhosphorus?: number;
  maxPhosphorus?: number;
  minPotassium?: number;
  maxPotassium?: number;
  minZinc?: number;
  maxZinc?: number;
  minCopper?: number;
  maxCopper?: number;
  minManganese?: number;
  maxManganese?: number;
  minSelenium?: number;
  maxSelenium?: number;
}

export interface SpoonacularSearchResponse {
  results: SpoonacularRecipe[];
  offset: number;
  number: number;
  totalResults: number;
  processingTimeMs: number;
  expires: number;
  isStale: boolean;
}

class SpoonacularService {
  private apiKey: string;
  private baseUrl = "https://api.spoonacular.com/recipes";

  constructor() {
    this.apiKey = getEnv("VITE_SPOONACULAR_API_KEY") || "";
    if (!this.apiKey) {
      console.warn(
        "VITE_SPOONACULAR_API_KEY not found in environment variables"
      );
    }
  }

  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(","));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    return searchParams.toString();
  }

  async searchRecipes(
    params: SpoonacularSearchParams
  ): Promise<SpoonacularSearchResponse> {
    if (!this.apiKey) {
      throw new Error("Spoonacular API key not configured");
    }

    const queryString = this.buildQueryString({
      ...params,
      apiKey: this.apiKey,
      addRecipeInformation: true,
      addRecipeNutrition: true,
      fillIngredients: true,
    });

    const url = `${this.baseUrl}/complexSearch?${queryString}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Spoonacular API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Spoonacular API request failed:", error);
      throw error;
    }
  }

  async getRecipeById(id: number): Promise<SpoonacularRecipe> {
    if (!this.apiKey) {
      throw new Error("Spoonacular API key not configured");
    }

    const url = `${this.baseUrl}/${id}/information?apiKey=${this.apiKey}&includeNutrition=true`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Spoonacular API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Spoonacular API request failed:", error);
      throw error;
    }
  }

  async getRandomRecipes(
    params: {
      number?: number;
      tags?: string[];
      limitLicense?: boolean;
    } = {}
  ): Promise<{ recipes: SpoonacularRecipe[] }> {
    if (!this.apiKey) {
      throw new Error("Spoonacular API key not configured");
    }

    const queryString = this.buildQueryString({
      ...params,
      apiKey: this.apiKey,
    });

    const url = `${this.baseUrl}/random?${queryString}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Spoonacular API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Spoonacular API request failed:", error);
      throw error;
    }
  }

  // Convert user preferences to Spoonacular search parameters
  convertUserPreferencesToSearchParams(userPreferences: {
    dietary_preferences?: string[];
    cuisine_preferences?: string[];
    location?: string;
  }): SpoonacularSearchParams {
    const params: SpoonacularSearchParams = {
      number: 12, // Default number of results
      addRecipeInformation: true,
      addRecipeNutrition: true,
      fillIngredients: true,
    };

    // Convert dietary preferences
    if (userPreferences.dietary_preferences) {
      const diets: string[] = [];
      const intolerances: string[] = [];

      userPreferences.dietary_preferences.forEach((pref) => {
        switch (pref.toLowerCase()) {
          case "vegetarian":
            diets.push("vegetarian");
            break;
          case "vegan":
            diets.push("vegan");
            break;
          case "gluten-free":
            intolerances.push("gluten");
            break;
          case "dairy-free":
            intolerances.push("dairy");
            break;
          case "keto":
            diets.push("ketogenic");
            break;
          case "paleo":
            diets.push("paleo");
            break;
          case "whole30":
            diets.push("whole30");
            break;
          case "low-carb":
            diets.push("low-carb");
            break;
          case "low-fat":
            diets.push("low-fat");
            break;
          case "low-sodium":
            diets.push("low-sodium");
            break;
        }
      });

      if (diets.length > 0) {
        params.diet = diets;
      }
      if (intolerances.length > 0) {
        params.intolerances = intolerances;
      }
    }

    // Convert cuisine preferences
    if (userPreferences.cuisine_preferences) {
      const cuisines = userPreferences.cuisine_preferences.map((cuisine) => {
        // Map our cuisine IDs to Spoonacular cuisine names
        const cuisineMap: Record<string, string> = {
          italian: "italian",
          indian: "indian",
          japanese: "japanese",
          mexican: "mexican",
          chinese: "chinese",
          thai: "thai",
          mediterranean: "mediterranean",
          american: "american",
        };
        return cuisineMap[cuisine.toLowerCase()] || cuisine;
      });

      params.cuisine = cuisines;
    }

    return params;
  }
}

export const spoonacularService = new SpoonacularService();
