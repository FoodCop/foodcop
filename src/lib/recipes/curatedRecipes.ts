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

/**
 * A recipe shown in Bites: a curated one (numeric id) or one a FUZO member
 * posted (id "fuzo-<food card id>", with its author; no time / servings,
 * which the Create form doesn't ask for - shown as 0).
 */
export type BiteRecipe = Omit<CuratedRecipe, 'id'> & {
  id: number | string;
  author?: { id: string; name: string };
};

/** "25 min · 4 servings", or "By Priya" for a member's recipe. */
export function recipeSummary(recipe: BiteRecipe): string {
  const parts: string[] = [];
  if (recipe.readyInMinutes > 0) parts.push(`${recipe.readyInMinutes} min`);
  if (recipe.servings > 0) parts.push(`${recipe.servings} servings`);
  if (recipe.author) parts.push(`By ${recipe.author.name}`);
  return parts.join(' · ');
}

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
