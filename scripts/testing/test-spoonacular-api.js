// Test Spoonacular API Connection
// Run with: node scripts/test-spoonacular-api.js

import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

const API_KEY = process.env.SPOONACULAR_API_KEY;

if (!API_KEY) {
  console.error("❌ Missing SPOONACULAR_API_KEY environment variable");
  process.exit(1);
}

console.log("🔍 Testing Spoonacular API Connection...\n");

async function testSpoonacularAPI() {
  try {
    // Test 1: Search recipes
    console.log("1️⃣ Testing recipe search...");
    const searchUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&query=pasta&number=3&addRecipeInformation=true&addRecipeNutrition=true&fillIngredients=true`;

    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}));
      console.error(`❌ Search API failed: ${searchResponse.status}`);
      console.error(`Error: ${errorData.message || searchResponse.statusText}`);
      return;
    }

    const searchData = await searchResponse.json();
    console.log(
      `✅ Search API success: Found ${searchData.results?.length || 0} recipes`
    );

    if (searchData.results && searchData.results.length > 0) {
      const firstRecipe = searchData.results[0];
      console.log(`   📝 First recipe: ${firstRecipe.title}`);
      console.log(
        `   🖼️ Image: ${firstRecipe.image ? "Available" : "Not available"}`
      );
      console.log(`   ⏱️ Ready in: ${firstRecipe.readyInMinutes} minutes`);
      console.log(`   👥 Servings: ${firstRecipe.servings}`);
      console.log(
        `   🌍 Cuisines: ${firstRecipe.cuisines?.join(", ") || "None"}`
      );
    }

    // Test 2: Random recipes
    console.log("\n2️⃣ Testing random recipes...");
    const randomUrl = `https://api.spoonacular.com/recipes/random?apiKey=${API_KEY}&number=2&includeNutrition=true`;

    const randomResponse = await fetch(randomUrl);

    if (!randomResponse.ok) {
      const errorData = await randomResponse.json().catch(() => ({}));
      console.error(`❌ Random API failed: ${randomResponse.status}`);
      console.error(`Error: ${errorData.message || randomResponse.statusText}`);
      return;
    }

    const randomData = await randomResponse.json();
    console.log(
      `✅ Random API success: Found ${randomData.recipes?.length || 0} recipes`
    );

    if (randomData.recipes && randomData.recipes.length > 0) {
      const firstRandom = randomData.recipes[0];
      console.log(`   📝 Random recipe: ${firstRandom.title}`);
      console.log(
        `   🖼️ Image: ${firstRandom.image ? "Available" : "Not available"}`
      );
    }

    // Test 3: Recipe details (if we have a recipe ID)
    if (searchData.results && searchData.results.length > 0) {
      const recipeId = searchData.results[0].id;
      console.log(`\n3️⃣ Testing recipe details for ID: ${recipeId}...`);

      const detailsUrl = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${API_KEY}&includeNutrition=true`;

      const detailsResponse = await fetch(detailsUrl);

      if (!detailsResponse.ok) {
        const errorData = await detailsResponse.json().catch(() => ({}));
        console.error(`❌ Details API failed: ${detailsResponse.status}`);
        console.error(
          `Error: ${errorData.message || detailsResponse.statusText}`
        );
        return;
      }

      const detailsData = await detailsResponse.json();
      console.log(`✅ Details API success`);
      console.log(`   📝 Title: ${detailsData.title}`);
      console.log(
        `   📋 Ingredients: ${
          detailsData.extendedIngredients?.length || 0
        } items`
      );
      console.log(
        `   📖 Instructions: ${
          detailsData.analyzedInstructions?.[0]?.steps?.length || 0
        } steps`
      );
      console.log(
        `   🥗 Nutrition: ${
          detailsData.nutrition?.nutrients?.length || 0
        } nutrients`
      );
    }

    console.log("\n🎉 All Spoonacular API tests passed!");
    console.log(
      "The Bites page should now be able to fetch real recipes from Spoonacular."
    );
  } catch (error) {
    console.error("❌ Spoonacular API test failed:", error.message);
  }
}

testSpoonacularAPI();
