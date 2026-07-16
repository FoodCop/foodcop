/**
 * ONE-TIME RECIPE FLAVOR ENRICHMENT
 * ==================================================================
 * curatedRecipes.json (Spoonacular-derived, 1,251 recipes) has no real
 * flavor_profile data - Spoonacular doesn't provide taste-axis vectors, and
 * scripts/seed_recipes.ts has always uploaded `r.flavor_profile || {}`. This
 * script fills that gap for real: one Gemini call per recipe, asking only for
 * the 10 FLAVOR_AXES (src/lib/types/foodCard.ts - same taxonomy food_cards
 * uses), so public.recipes.flavor_profile and public.get_recommended_recipes
 * (already written, never fed real data) finally have something to match on.
 *
 * This is a standalone Node script (not a Next.js request), so it calls the
 * Gemini REST API directly with GEMINI_API_KEY rather than going through
 * src/app/api/gemini/route.ts.
 *
 * Idempotent/resumable: skips any recipe that already has a populated
 * flavorProfile in the JSON. Checkpoints the JSON file after every batch so
 * an interrupted run doesn't lose completed work.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/enrichRecipeFlavorProfiles.ts [--limit N]
 *
 * Makes real, billed Gemini API calls - run deliberately, not automatically.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { FLAVOR_AXES, type FlavorVector } from '../src/lib/types/foodCard';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY in .env.local');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DATA_PATH = path.resolve(__dirname, '../public/data/curatedRecipes.json');
const CONCURRENCY = 5;
const BATCH_SIZE = 50; // checkpoint cadence
const MAX_RETRIES = 3;

type RawRecipe = {
  id: number;
  title: string;
  cuisines?: string[];
  dishTypes?: string[];
  diets?: string[];
  extendedIngredients?: { original: string }[];
  flavorProfile?: FlavorVector;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isPopulated(vector: FlavorVector | undefined): boolean {
  return !!vector && FLAVOR_AXES.some((axis) => (vector[axis] ?? 0) > 0);
}

async function generateFlavorProfile(recipe: RawRecipe): Promise<FlavorVector | null> {
  const ingredients = (recipe.extendedIngredients || []).slice(0, 12).map((i) => i.original).join(', ');
  const prompt = `You are a food flavor analyst. Based on this recipe's metadata, rate its flavor profile on a 0-5 scale for each axis.
Title: "${recipe.title}"
Cuisines: ${(recipe.cuisines || []).join(', ') || 'unknown'}
Dish types: ${(recipe.dishTypes || []).join(', ') || 'unknown'}
Diets: ${(recipe.diets || []).join(', ') || 'none'}
Key ingredients: ${ingredients || 'unknown'}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: Object.fromEntries(FLAVOR_AXES.map((axis) => [axis, { type: 'number' }])),
        required: [...FLAVOR_AXES],
      },
    },
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      );
      const data = await res.json();

      if (!res.ok) {
        if ((res.status === 429 || res.status === 503) && attempt < MAX_RETRIES - 1) {
          await delay(Math.pow(2, attempt + 1) * 1000 + Math.random() * 500);
          continue;
        }
        console.warn(`Recipe ${recipe.id} (${recipe.title}): Gemini error ${res.status}`);
        return null;
      }

      const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') ?? '';
      const parsed = JSON.parse(text);
      const vector = {} as FlavorVector;
      for (const axis of FLAVOR_AXES) {
        vector[axis] = Math.max(0, Math.min(5, Number(parsed[axis]) || 0));
      }
      return vector;
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) {
        console.warn(`Recipe ${recipe.id} (${recipe.title}): failed after retries`, err);
        return null;
      }
      await delay(Math.pow(2, attempt + 1) * 1000);
    }
  }
  return null;
}

async function runPool<T>(items: T[], worker: (item: T) => Promise<void>, concurrency: number) {
  let index = 0;
  async function next(): Promise<void> {
    const i = index++;
    if (i >= items.length) return;
    await worker(items[i]);
    return next();
  }
  await Promise.all(Array.from({ length: concurrency }, () => next()));
}

async function run() {
  const limitArgIndex = process.argv.indexOf('--limit');
  const limit = limitArgIndex >= 0 ? Number(process.argv[limitArgIndex + 1]) : undefined;

  console.log(`Loading recipes from ${DATA_PATH}...`);
  const recipes: RawRecipe[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

  const pending = recipes.filter((r) => !isPopulated(r.flavorProfile)).slice(0, limit);
  console.log(`${recipes.length} total recipes, ${pending.length} pending enrichment${limit ? ` (limited to ${limit})` : ''}.`);

  let done = 0;
  let failed = 0;

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);

    await runPool(batch, async (recipe) => {
      const vector = await generateFlavorProfile(recipe);
      if (vector) {
        recipe.flavorProfile = vector;
        done++;
      } else {
        failed++;
      }
    }, CONCURRENCY);

    // Checkpoint: write the full JSON back (recipe objects are mutated in place).
    fs.writeFileSync(DATA_PATH, JSON.stringify(recipes, null, 2));

    const supabaseBatch = batch
      .filter((r) => isPopulated(r.flavorProfile))
      .map((r) => ({ id: r.id, flavor_profile: r.flavorProfile }));
    if (supabaseBatch.length) {
      const { error } = await supabase.from('recipes').upsert(supabaseBatch, { onConflict: 'id' });
      if (error) console.warn(`Supabase upsert failed for batch starting at ${i}:`, error.message);
    }

    console.log(`Progress: ${done + failed}/${pending.length} (${done} enriched, ${failed} failed)`);
  }

  console.log('--- Enrichment Complete ---');
  console.log(`Enriched: ${done}`);
  console.log(`Failed: ${failed}`);
}

run();
