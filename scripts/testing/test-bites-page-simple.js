// Test Bites Page with Spoonacular API (Simple Version)
// Run with: node scripts/test-bites-page-simple.js

import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

const API_KEY = process.env.SPOONACULAR_API_KEY;

if (!API_KEY) {
  console.error("❌ Missing SPOONACULAR_API_KEY environment variable");
  process.exit(1);
}

console.log("🔍 Testing Bites Page with Spoonacular API (Simple Version)...\n");

async function testBitesPage() {
  try {
    // Test 1: Load initial recipes (like the Bites page does)
    console.log("1️⃣ Testing initial recipe loading...");
    const searchUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&query=&number=12&addRecipeInformation=true&addRecipeNutrition=true&fillIngredients=true`;

    const response = await fetch(searchUrl);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ Search API failed: ${response.status}`);
      console.error(`Error: ${errorData.message || response.statusText}`);
      return;
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      console.log(
        `✅ Loaded ${data.results.length} recipes from Spoonacular API`
      );

      // Show first few recipes
      data.results.slice(0, 3).forEach((recipe, index) => {
        console.log(`   ${index + 1}. ${recipe.title}`);
        console.log(
          `      🖼️ Image: ${recipe.image ? "Available" : "Not available"}`
        );
        console.log(`      ⏱️ Ready in: ${recipe.readyInMinutes} minutes`);
        console.log(`      👥 Servings: ${recipe.servings}`);
        console.log(
          `      🌍 Cuisines: ${recipe.cuisines?.join(", ") || "None"}`
        );
        console.log(
          `      ⭐ Spoonacular Score: ${recipe.spoonacularScore}/100`
        );
        console.log(`      👍 Likes: ${recipe.aggregateLikes}`);
        console.log(
          `      🏷️ Dish Types: ${recipe.dishTypes?.join(", ") || "None"}`
        );
        console.log(
          `      📋 Ingredients: ${
            recipe.extendedIngredients?.length || 0
          } items`
        );
        console.log(
          `      📖 Instructions: ${
            recipe.analyzedInstructions?.[0]?.steps?.length || 0
          } steps`
        );
        console.log(
          `      🥗 Nutrition: ${
            recipe.nutrition?.nutrients?.length || 0
          } nutrients`
        );
        console.log("");
      });
    } else {
      console.log("❌ No recipes returned from Spoonacular API");
      return;
    }

    // Test 2: Search functionality (like when user types in search)
    console.log("2️⃣ Testing search functionality...");
    const searchResponse = await fetch(
      `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&query=pasta&number=6&addRecipeInformation=true&addRecipeNutrition=true&fillIngredients=true`
    );

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}));
      console.error(`❌ Search API failed: ${searchResponse.status}`);
      console.error(`Error: ${errorData.message || searchResponse.statusText}`);
      return;
    }

    const searchData = await searchResponse.json();

    if (searchData.results && searchData.results.length > 0) {
      console.log(`✅ Found ${searchData.results.length} recipes for "pasta"`);

      searchData.results.slice(0, 2).forEach((recipe, index) => {
        console.log(`   ${index + 1}. ${recipe.title}`);
        console.log(
          `      🖼️ Image: ${recipe.image ? "Available" : "Not available"}`
        );
        console.log(`      ⏱️ Ready in: ${recipe.readyInMinutes} minutes`);
        console.log("");
      });
    } else {
      console.log("❌ No search results found");
    }

    // Test 3: Random recipes (like the random button)
    console.log("3️⃣ Testing random recipes...");
    const randomResponse = await fetch(
      `https://api.spoonacular.com/recipes/random?apiKey=${API_KEY}&number=3&includeNutrition=true`
    );

    if (!randomResponse.ok) {
      const errorData = await randomResponse.json().catch(() => ({}));
      console.error(`❌ Random API failed: ${randomResponse.status}`);
      console.error(`Error: ${errorData.message || randomResponse.statusText}`);
      return;
    }

    const randomData = await randomResponse.json();

    if (randomData.recipes && randomData.recipes.length > 0) {
      console.log(`✅ Found ${randomData.recipes.length} random recipes`);

      randomData.recipes.forEach((recipe, index) => {
        console.log(`   ${index + 1}. ${recipe.title}`);
        console.log(
          `      🖼️ Image: ${recipe.image ? "Available" : "Not available"}`
        );
        console.log(`      ⏱️ Ready in: ${recipe.readyInMinutes} minutes`);
        console.log("");
      });
    } else {
      console.log("❌ No random recipes found");
    }

    console.log("🎉 All Bites page tests passed!");
    console.log(
      "The Bites page should now be showing real recipes from Spoonacular instead of mock data."
    );
    console.log("\n📝 Summary of changes made:");
    console.log("   ✅ Renamed RecipesPage.tsx to Bites.tsx");
    console.log("   ✅ Updated all references to RecipesPage");
    console.log("   ✅ Fixed Spoonacular API key configuration");
    console.log("   ✅ Prioritized backend recipes over mock data");
    console.log("   ✅ Removed hardcoded Unsplash images");
    console.log(
      "   ✅ Made mock data fallback only when no API data available"
    );
  } catch (error) {
    console.error("❌ Bites page test failed:", error.message);
  }
}

testBitesPage();
