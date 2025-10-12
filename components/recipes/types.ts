// Recipe types for the FUZO application
export interface Recipe {
  id: number | string;
  title: string;
  image?: string;
  imageType?: string;
  servings: number;
  readyInMinutes: number;
  license?: string;
  sourceName?: string;
  sourceUrl?: string;
  spoonacularSourceUrl?: string;
  healthScore?: number;
  spoonacularScore?: number;
  pricePerServing?: number;
  analyzedInstructions?: any[];
  cheap?: boolean;
  creditsText?: string;
  cuisines?: string[];
  dairyFree?: boolean;
  diets?: string[];
  gaps?: string;
  glutenFree?: boolean;
  instructions?: string;
  ketogenic?: boolean;
  lowFodmap?: boolean;
  occasions?: string[];
  sustainable?: boolean;
  vegan?: boolean;
  vegetarian?: boolean;
  veryHealthy?: boolean;
  veryPopular?: boolean;
  whole30?: boolean;
  weightWatcherSmartPoints?: number;
  dishTypes?: string[];
  extendedIngredients?: Ingredient[];
  summary?: string;
  winePairing?: any;
  
  // Additional fields for our application
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  nutrition?: Nutrition;
  author?: Author;
  tags?: string[];
  rating?: number;
  calories?: number;
  cookingTime?: number;
  preparationTime?: number;
  totalTime?: number;
  ingredients?: RecipeIngredient[];
  instructionSteps?: InstructionStep[];
}

export interface Ingredient {
  id: number;
  aisle?: string;
  image?: string;
  consistency?: string;
  name: string;
  nameClean?: string;
  original: string;
  originalString?: string;
  originalName?: string;
  amount: number;
  unit: string;
  meta?: string[];
  measures?: {
    us: {
      amount: number;
      unitShort: string;
      unitLong: string;
    };
    metric: {
      amount: number;
      unitShort: string;
      unitLong: string;
    };
  };
}

export interface RecipeIngredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

export interface InstructionStep {
  id: string;
  step: number;
  description: string;
  timer?: number;
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface Author {
  name: string;
  avatar?: string;
  id?: string;
}

export interface Comment {
  id: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  replies?: Comment[];
}

// Mock data for testing
export const mockComments: Record<string, Comment[]> = {};

// Utility function to convert Spoonacular recipe to our Recipe type
export function convertSpoonacularRecipe(spoonacularRecipe: any): Recipe {
  return {
    id: spoonacularRecipe.id,
    title: spoonacularRecipe.title,
    image: spoonacularRecipe.image,
    servings: spoonacularRecipe.servings || 1,
    readyInMinutes: spoonacularRecipe.readyInMinutes || 30,
    healthScore: spoonacularRecipe.healthScore,
    spoonacularScore: spoonacularRecipe.spoonacularScore,
    pricePerServing: spoonacularRecipe.pricePerServing,
    cheap: spoonacularRecipe.cheap,
    cuisines: spoonacularRecipe.cuisines || [],
    diets: spoonacularRecipe.diets || [],
    dishTypes: spoonacularRecipe.dishTypes || [],
    extendedIngredients: spoonacularRecipe.extendedIngredients || [],
    summary: spoonacularRecipe.summary,
    instructions: spoonacularRecipe.instructions,
    analyzedInstructions: spoonacularRecipe.analyzedInstructions || [],
    dairyFree: spoonacularRecipe.dairyFree,
    glutenFree: spoonacularRecipe.glutenFree,
    ketogenic: spoonacularRecipe.ketogenic,
    vegan: spoonacularRecipe.vegan,
    vegetarian: spoonacularRecipe.vegetarian,
    veryHealthy: spoonacularRecipe.veryHealthy,
    veryPopular: spoonacularRecipe.veryPopular,
    whole30: spoonacularRecipe.whole30,
    
    // Derived fields
    difficulty: deriveRecipeDifficulty(spoonacularRecipe),
    author: {
      name: spoonacularRecipe.sourceName || 'Spoonacular',
    },
    tags: [
      ...(spoonacularRecipe.diets || []),
      ...(spoonacularRecipe.dishTypes || []),
    ],
    rating: spoonacularRecipe.spoonacularScore ? Math.round(spoonacularRecipe.spoonacularScore / 20) : undefined,
    calories: extractCalories(spoonacularRecipe),
    cookingTime: spoonacularRecipe.readyInMinutes,
    preparationTime: Math.round((spoonacularRecipe.readyInMinutes || 30) * 0.3),
    totalTime: spoonacularRecipe.readyInMinutes,
    ingredients: convertIngredients(spoonacularRecipe.extendedIngredients || []),
    instructionSteps: convertInstructions(spoonacularRecipe.analyzedInstructions || []),
  };
}

function deriveRecipeDifficulty(recipe: any): 'Easy' | 'Medium' | 'Hard' {
  const readyTime = recipe.readyInMinutes || 30;
  const ingredientCount = recipe.extendedIngredients?.length || 0;
  
  if (readyTime <= 20 && ingredientCount <= 5) return 'Easy';
  if (readyTime <= 45 && ingredientCount <= 10) return 'Medium';
  return 'Hard';
}

function extractCalories(recipe: any): number {
  // Try to extract calories from nutrition data if available
  if (recipe.nutrition?.nutrients) {
    const calorieNutrient = recipe.nutrition.nutrients.find(
      (n: any) => n.name === 'Calories' || n.title === 'Calories'
    );
    if (calorieNutrient) {
      return Math.round(calorieNutrient.amount);
    }
  }
  
  // Fallback estimate based on recipe complexity
  const baseCalories = 250;
  const servings = recipe.servings || 1;
  return Math.round(baseCalories * servings / servings); // Per serving
}

function convertIngredients(extendedIngredients: any[]): RecipeIngredient[] {
  return extendedIngredients.map((ingredient, index) => ({
    id: `ingredient-${index}`,
    name: ingredient.name || ingredient.nameClean || ingredient.originalName || 'Unknown ingredient',
    amount: ingredient.amount?.toString() || '1',
    unit: ingredient.unit || 'unit',
  }));
}

function convertInstructions(analyzedInstructions: any[]): InstructionStep[] {
  const steps: InstructionStep[] = [];
  
  analyzedInstructions.forEach((instruction) => {
    if (instruction.steps) {
      instruction.steps.forEach((step: any, index: number) => {
        steps.push({
          id: `step-${steps.length}`,
          step: step.number || steps.length + 1,
          description: step.step || '',
          timer: extractTimerFromStep(step.step || ''),
        });
      });
    }
  });
  
  return steps;
}

function extractTimerFromStep(stepText: string): number | undefined {
  // Simple regex to extract time mentions like "10 minutes", "2 hours", etc.
  const timeMatch = stepText.match(/(\d+)\s*(minutes?|mins?|hours?|hrs?)/i);
  if (timeMatch) {
    const value = parseInt(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    
    if (unit.includes('hour') || unit.includes('hr')) {
      return value * 60; // Convert to minutes
    }
    return value; // Already in minutes
  }
  
  return undefined;
}