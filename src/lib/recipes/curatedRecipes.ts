// Loader for the real curated recipe dataset (public/data/curatedRecipes.json,
// 1,251 Spoonacular-derived recipes) - the only non-Supabase data source
// allowed anywhere in the app; no mock/placeholder content.

export type RecipeIngredient = { original: string };
export type RecipeInstructionStep = { number: number; step: string };
export type RecipeNutrient = { name: string; amount: number; unit: string };

export type CuratedRecipe = {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  cuisines: string[];
  diets: string[];
  dishTypes: string[];
  extendedIngredients: RecipeIngredient[];
  instructions: string;
  analyzedInstructions: RecipeInstructionStep[];
  nutrition: { nutrients: RecipeNutrient[] } | null;
  // Populated by scripts/enrichRecipeFlavorProfiles.ts (one-time Gemini
  // enrichment pass) - absent until that script has run for a given recipe.
  flavorProfile?: import('@/lib/types/foodCard').FlavorVector;
};

let cache: Promise<CuratedRecipe[]> | null = null;

export async function fetchCuratedRecipes(limit?: number): Promise<CuratedRecipe[]> {
  if (!cache) {
    cache = fetch('/data/curatedRecipes.json')
      .then((res) => res.json())
      .catch((err) => {
        cache = null;
        throw err;
      });
  }
  const all = await cache;
  return limit ? all.slice(0, limit) : all;
}
