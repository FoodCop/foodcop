// Test Bites Page with Spoonacular API
// Run with: node scripts/test-bites-page.js

import * as dotenv from "dotenv";
import {
  convertSpoonacularRecipe,
  spoonacularService,
} from "../src/lib/spoonacular.ts";

// Load environment variables
dotenv.config({ path: ".env" });

const API_KEY = process.env.SPOONACULAR_API_KEY;

if (!API_KEY) {
  console.error("❌ Missing SPOONACULAR_API_KEY environment variable");
  process.exit(1);
}

console.log("🔍 Testing Bites Page with Spoonacular API...\n");

async function testBitesPage() {
  try {
    // Test 1: Load initial recipes (like the Bites page does)
    console.log("1️⃣ Testing initial recipe loading...");
    const response = await spoonacularService.searchRecipes({
      query: "",
      number: 12,
    });

    if (response.results && response.results.length > 0) {
      const convertedRecipes = response.results.map(convertSpoonacularRecipe);
      console.log(
        `✅ Loaded ${convertedRecipes.length} recipes from Spoonacular API`
      );

      // Show first few recipes
      convertedRecipes.slice(0, 3).forEach((recipe, index) => {
        console.log(`   ${index + 1}. ${recipe.title}`);
        console.log(
          `      🖼️ Image: ${recipe.image ? "Available" : "Not available"}`
        );
        console.log(`      ⏱️ Cooking time: ${recipe.cookingTime} minutes`);
        console.log(`      👥 Servings: ${recipe.servings}`);
        console.log(`      🌍 Cuisine: ${recipe.cuisine}`);
        console.log(`      ⭐ Rating: ${recipe.rating}/5`);
        console.log(`      🏷️ Tags: ${recipe.tags.join(", ")}`);
        console.log(`      📋 Ingredients: ${recipe.ingredients.length} items`);
        console.log(
          `      📖 Instructions: ${recipe.instructions.length} steps`
        );
        console.log(
          `      🥗 Nutrition: ${recipe.nutrition.calories} calories`
        );
        console.log("");
      });
    } else {
      console.log("❌ No recipes returned from Spoonacular API");
      return;
    }

    // Test 2: Search functionality (like when user types in search)
    console.log("2️⃣ Testing search functionality...");
    const searchResponse = await spoonacularService.searchRecipes({
      query: "pasta",
      number: 6,
    });

    if (searchResponse.results && searchResponse.results.length > 0) {
      const searchRecipes = searchResponse.results.map(
        convertSpoonacularRecipe
      );
      console.log(`✅ Found ${searchRecipes.length} recipes for "pasta"`);

      searchRecipes.slice(0, 2).forEach((recipe, index) => {
        console.log(`   ${index + 1}. ${recipe.title}`);
        console.log(
          `      🖼️ Image: ${recipe.image ? "Available" : "Not available"}`
        );
        console.log(`      ⏱️ Cooking time: ${recipe.cookingTime} minutes`);
        console.log("");
      });
    } else {
      console.log("❌ No search results found");
    }

    // Test 3: Random recipes (like the random button)
    console.log("3️⃣ Testing random recipes...");
    const randomResponse = await spoonacularService.getRandomRecipes(3);

    if (randomResponse.recipes && randomResponse.recipes.length > 0) {
      const randomRecipes = randomResponse.recipes.map(
        convertSpoonacularRecipe
      );
      console.log(`✅ Found ${randomRecipes.length} random recipes`);

      randomRecipes.forEach((recipe, index) => {
        console.log(`   ${index + 1}. ${recipe.title}`);
        console.log(
          `      🖼️ Image: ${recipe.image ? "Available" : "Not available"}`
        );
        console.log(`      ⏱️ Cooking time: ${recipe.cookingTime} minutes`);
        console.log("");
      });
    } else {
      console.log("❌ No random recipes found");
    }

    console.log("🎉 All Bites page tests passed!");
    console.log(
      "The Bites page should now be showing real recipes from Spoonacular instead of mock data."
    );
  } catch (error) {
    console.error("❌ Bites page test failed:", error.message);
  }
}

testBitesPage();
