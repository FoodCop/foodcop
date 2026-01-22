/**
 * Consolidated Recipe Type Definitions
 * Single source of truth for all recipe-related types across the application
 */

/**
 * Spoonacular API response type
 * Used when receiving data directly from Spoonacular API
 */
export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes?: number;
  servings?: number;
  diets?: string[];
  cuisines?: string[];
  summary?: string;
  instructions?: string;
  extendedIngredients?: SpoonacularIngredient[];
  sourceUrl?: string;
  aggregateLikes?: number;
  healthScore?: number;
  pricePerServing?: number;
  analyzedInstructions?: SpoonacularAnalyzedInstruction[];
  preparationMinutes?: number;
  cookingMinutes?: number;
  nutrition?: SpoonacularNutrition;
  winePairing?: SpoonacularWinePairing;
}

export interface SpoonacularIngredient {
  id: number;
  original: string;
  name?: string;
  amount?: number;
  unit?: string;
  image?: string;
}

export interface SpoonacularAnalyzedInstruction {
  name: string;
  steps: SpoonacularStep[];
}

export interface SpoonacularStep {
  number: number;
  step: string;
  ingredients?: SpoonacularStepItem[];
  equipment?: SpoonacularStepItem[];
}

export interface SpoonacularStepItem {
  id: number;
  name: string;
  image: string;
}

export interface SpoonacularNutrition {
  nutrients?: SpoonacularNutrient[];
  caloricBreakdown?: {
    percentProtein: number;
    percentFat: number;
    percentCarbs: number;
  };
}

export interface SpoonacularNutrient {
  name: string;
  amount: number;
  unit: string;
  percentOfDailyNeeds?: number;
}

export interface SpoonacularWinePairing {
  pairedWines?: string[];
  pairingText?: string;
  productMatches?: SpoonacularWineProduct[];
}

export interface SpoonacularWineProduct {
  title: string;
  description: string;
  price: string;
  imageUrl?: string;
  link?: string;
}

/**
 * Application Recipe type
 * Normalized version used throughout the app
 * All optional fields from Spoonacular are required here for consistency
 */
export interface Recipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  diets: string[];
  cuisines: string[];
  summary: string;
  instructions: string;
  extendedIngredients: SpoonacularIngredient[];
  sourceUrl?: string;
  aggregateLikes?: number;
  healthScore?: number;
  pricePerServing?: number;
  analyzedInstructions?: SpoonacularAnalyzedInstruction[];
  winePairing?: SpoonacularWinePairing;
  preparationMinutes?: number;
  cookingMinutes?: number;
  nutrition?: SpoonacularNutrition;
}

/**
 * Transform Spoonacular API response to application Recipe type
 * Ensures all required fields have default values
 */
export function transformSpoonacularRecipe(recipe: SpoonacularRecipe): Recipe {
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
}

/**
 * Recipe search parameters
 */
export interface RecipeSearchParams {
  query?: string;
  cuisine?: string;
  diet?: string;
  intolerances?: string;
  number?: number;
  offset?: number;
  type?: string;
}

/**
 * Recipe filter options
 */
export interface RecipeFilters {
  dietaryPreferences: string[];
  searchQuery: string;
  cuisineType?: string;
  maxReadyTime?: number;
}
