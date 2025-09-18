// Test Restaurant Matching System
// Run with: node scripts/test-restaurant-matching.js

import fs from "fs";
import path from "path";

// Load restaurant data
const restaurantPath = path.join(
  process.cwd(),
  "public",
  "MasterBotBucket2.json"
);

if (!fs.existsSync(restaurantPath)) {
  console.error("❌ Restaurant data not found at:", restaurantPath);
  process.exit(1);
}

const restaurants = JSON.parse(fs.readFileSync(restaurantPath, "utf8"));

console.log(`🏪 Loaded ${restaurants.length} restaurants`);

// Test bot specialties mapping
const testBotSpecialties = [
  { name: "Aurelia Voss", type: "Street Food Explorer" },
  { name: "Sebastian LeClair", type: "Fine Dining Expert" },
  { name: "Lila Cheng", type: "Vegan Specialist" },
  { name: "Rafael Mendez", type: "Adventure Foodie" },
  { name: "Anika Kapoor", type: "Indian/Asian Cuisine Expert" },
  { name: "Omar Darzi", type: "Coffee Culture Expert" },
  { name: "Jun Tanaka", type: "Japanese Cuisine Master" },
];

// Analyze restaurant categories
const categoryCount = {};
restaurants.forEach((restaurant) => {
  if (restaurant.categoryName) {
    categoryCount[restaurant.categoryName] =
      (categoryCount[restaurant.categoryName] || 0) + 1;
  }
});

console.log("\n📊 Top Restaurant Categories:");
console.log("===============================");
Object.entries(categoryCount)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([category, count]) => {
    console.log(`${category}: ${count} restaurants`);
  });

// Analyze countries
const countryCount = {};
restaurants.forEach((restaurant) => {
  if (restaurant.countryCode) {
    countryCount[restaurant.countryCode] =
      (countryCount[restaurant.countryCode] || 0) + 1;
  }
});

console.log("\n🌍 Restaurant Distribution by Country:");
console.log("=====================================");
Object.entries(countryCount)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([country, count]) => {
    console.log(`${country}: ${count} restaurants`);
  });

// Test matching for each bot type
console.log("\n🤖 Testing Bot Restaurant Matching:");
console.log("==================================");

const BOT_MAPPINGS = {
  "Street Food Explorer": {
    keywords: [
      "street",
      "food truck",
      "market",
      "stall",
      "casual",
      "takeaway",
      "fast food",
    ],
    categories: [
      "Street food restaurant",
      "Fast food restaurant",
      "Takeout restaurant",
    ],
    priceRange: ["$", "$$"],
  },
  "Fine Dining Expert": {
    keywords: [
      "fine dining",
      "michelin",
      "luxury",
      "gourmet",
      "upscale",
      "elegant",
    ],
    categories: [
      "Fine dining restaurant",
      "French restaurant",
      "Contemporary restaurant",
    ],
    priceRange: ["$$$", "$$$$"],
  },
  "Japanese Cuisine Master": {
    keywords: ["japanese", "sushi", "ramen", "izakaya", "tempura"],
    categories: ["Japanese restaurant", "Sushi restaurant", "Ramen restaurant"],
    priceRange: ["$$", "$$$", "$$$$"],
  },
  "Coffee Culture Expert": {
    keywords: ["coffee", "cafe", "espresso", "roastery"],
    categories: ["Coffee shop", "Cafe", "Bakery"],
    priceRange: ["$", "$$"],
  },
};

testBotSpecialties.forEach((bot) => {
  const mapping = BOT_MAPPINGS[bot.type];
  if (!mapping) {
    console.log(
      `${bot.name} (${bot.type}): No mapping defined - will use fallback`
    );
    return;
  }

  // Find matching restaurants
  const matches = restaurants.filter((restaurant) => {
    const categoryMatch = mapping.categories.some(
      (category) =>
        restaurant.categoryName
          ?.toLowerCase()
          .includes(category.toLowerCase()) ||
        restaurant.categories?.some((cat) =>
          cat.toLowerCase().includes(category.toLowerCase())
        )
    );

    const keywordMatch = mapping.keywords.some(
      (keyword) =>
        restaurant.title?.toLowerCase().includes(keyword) ||
        restaurant.description?.toLowerCase().includes(keyword) ||
        restaurant.categories?.some((cat) =>
          cat.toLowerCase().includes(keyword)
        )
    );

    const priceMatch =
      !restaurant.price || mapping.priceRange.includes(restaurant.price);
    const ratingMatch = restaurant.totalScore >= 4.0;

    return (categoryMatch || keywordMatch) && priceMatch && ratingMatch;
  });

  console.log(
    `${bot.name} (${bot.type}): ${matches.length} matching restaurants`
  );

  if (matches.length > 0) {
    // Show a sample restaurant
    const sample = matches[Math.floor(Math.random() * matches.length)];
    console.log(
      `  📍 Sample: ${sample.title} in ${sample.city}, ${sample.countryCode}`
    );
    console.log(
      `      ${sample.categoryName} | ${sample.price || "No price"} | ⭐${
        sample.totalScore
      }`
    );
  }
});

console.log("\n🎯 Summary:");
console.log(`✅ Total Restaurants: ${restaurants.length}`);
console.log(
  `✅ High-rated (4.0+): ${
    restaurants.filter((r) => r.totalScore >= 4.0).length
  }`
);
console.log(`✅ With Price Info: ${restaurants.filter((r) => r.price).length}`);
console.log(
  `✅ With Categories: ${
    restaurants.filter((r) => r.categories && r.categories.length > 0).length
  }`
);

console.log("\n🚀 Restaurant matching system is ready for Master Bots!");






