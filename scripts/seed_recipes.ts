import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Env vars loaded via --env-file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const dataPath = path.resolve(__dirname, '../public/data/curatedRecipes.json');
  console.log(`Loading recipes from ${dataPath}...`);
  
  if (!fs.existsSync(dataPath)) {
    console.error(`File not found: ${dataPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const recipes = JSON.parse(rawData);

  console.log(`Loaded ${recipes.length} recipes. Starting upload...`);

  // Batch insert in chunks of 100 to avoid request size limits
  const BATCH_SIZE = 100;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
    const batch = recipes.slice(i, i + BATCH_SIZE).map((r: any) => ({
      id: r.id,
      title: r.title,
      image: r.image,
      ready_in_minutes: r.readyInMinutes,
      servings: r.servings,
      diets: r.diets || [],
      dish_types: r.dishTypes || [],
      cuisines: r.cuisines || [],
      flavor_profile: r.flavorProfile || {},
      ingredients: r.extendedIngredients || [],
      instructions: r.instructions || '',
      analyzed_instructions: r.analyzedInstructions || [],
      nutrition: r.nutrition || {}
    }));

    const { error } = await supabase
      .from('recipes')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Error inserting batch ${i} to ${i + BATCH_SIZE}:`, error.message);
      errorCount += batch.length;
    } else {
      successCount += batch.length;
      console.log(`Successfully uploaded ${successCount} / ${recipes.length}`);
    }
  }

  console.log('--- Seeding Complete ---');
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

run();
