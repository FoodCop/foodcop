export interface Author {
  name: string;
  avatar: string;
  verified: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  cookingTime: number; // in minutes
  calories: number;
  servings: number;
  cuisine: string;
  rating: number;
  tags: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  ingredients: Ingredient[];
  instructions: Instruction[];
  nutrition: Nutrition;
  author: Author;
  description: string;
  preparationTime: number;
  totalTime: number;
  isUserCreated?: boolean;
  isBackendRecipe?: boolean;
  reviews?: number;
  nutritionInfo?: any;
  isSaved?: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
  category?: string;
}

export interface Instruction {
  id: string;
  step: number;
  description: string;
  image?: string;
  timer?: number; // optional timer in minutes
}

export interface Nutrition {
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
  fiber: number; // in grams
  sugar: number; // in grams
  sodium: number; // in milligrams
}

export interface Comment {
  id: string;
  author: Author;
  text: string;
  rating: number;
  createdAt: string;
  likes: number;
  photos?: string[];
}

// Empty arrays - no mock data
export const mockRecipes: Recipe[] = [];
export const mockComments: Record<string, Comment[]> = {};
