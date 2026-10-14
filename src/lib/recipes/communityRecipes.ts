// Recipes FUZO members posted (Create flow -> Recipe, or the older recipe
// studio), shaped like the curated ones so Bites can list and open them
// (client, 2026-10-14: "the recipe will appear in the Feed, Bites and
// Profile -> Recipes"). Visibility follows the database: private profiles'
// recipes only come back for people allowed to see them.

import { createClient } from '@/lib/supabase/client';
import type { BiteRecipe } from '@/lib/recipes/curatedRecipes';
import type { CardTags, FlavorVector } from '@/lib/types/foodCard';

type RecipeRow = {
  id: string;
  user_id: string;
  title: string;
  caption: string | null;
  tags: Partial<CardTags> | null;
  flavor_profile: FlavorVector | null;
  ingredients: [string, string, string][] | null;
  steps?: string[] | null;
  image_url: string | null;
};

/** Bites id for a member's recipe card. */
export const communityRecipeId = (cardId: string) => `fuzo-${cardId}`;

export async function fetchCommunityRecipes(limit = 60): Promise<BiteRecipe[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('food_cards')
    .select('*')
    .eq('card_type', 'RECIPE')
    .eq('status', 'PUBLISHED')
    .not('image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data?.length) return [];
  const rows = data as RecipeRow[];

  const authorIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: users } = await supabase.from('users').select('id, display_name, username').in('id', authorIds);
  const nameById = new Map((users ?? []).map((u) => [u.id as string, (u.display_name as string) || (u.username as string) || 'a FUZO member']));

  // Only real recipes: at least one ingredient and some instructions (keeps
  // half-made test cards like "NA" out of Bites).
  const complete = rows.filter((r) => (r.ingredients ?? []).some((row) => row[0]?.trim()) && ((r.steps ?? []).some(Boolean) || !!r.caption?.trim()));

  return complete.map((r) => {
    const steps = (r.steps ?? []).filter(Boolean);
    return {
      id: communityRecipeId(r.id),
      title: r.title,
      image: r.image_url ?? '',
      readyInMinutes: 0,
      servings: 0,
      cuisines: r.tags?.cuisine ?? [],
      diets: r.tags?.diet ?? [],
      dishTypes: r.tags?.meal_type ?? [],
      extendedIngredients: (r.ingredients ?? [])
        .filter((row) => row[0])
        .map(([name, qty, unit]) => ({ original: [qty, unit, name].filter(Boolean).join(' ') })),
      instructions: steps.length ? steps.join('\n') : r.caption ?? '',
      analyzedInstructions: steps.map((step, i) => ({ number: i + 1, step })),
      nutrition: null,
      flavorProfile: r.flavor_profile ?? undefined,
      author: { id: r.user_id, name: nameById.get(r.user_id) ?? 'a FUZO member' },
    };
  });
}
