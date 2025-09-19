import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the MasterBotBucket2.json file
const inputFile = path.join(__dirname, "../public/MasterBotBucket2.json");
const outputFile = path.join(
  __dirname,
  "../public/aurelia-street-food-data.json"
);

console.log("🔍 Extracting street food data for Aurelia Voss...");

try {
  // Read the JSON file
  const rawData = fs.readFileSync(inputFile, "utf8");
  const restaurants = JSON.parse(rawData);

  console.log(`📊 Total restaurants in dataset: ${restaurants.length}`);

  // Keywords to match for street food
  const streetFoodKeywords = [
    "street food",
    "Street Food",
    "street-food",
    "Street-Food",
    "food truck",
    "Food Truck",
    "food court",
    "Food court",
    "hawker",
    "Hawker",
    "stall",
    "Stall",
    "vendor",
    "Vendor",
    "market",
    "Market",
    "street fare",
    "Street fare",
    "street eats",
    "Street eats",
    "food market",
    "Food market",
    "night market",
    "Night market",
    "street vendor",
    "Street vendor",
    "food stall",
    "Food stall",
    "street cuisine",
    "Street cuisine",
  ];

  // Function to check if a restaurant matches street food criteria
  function isStreetFood(restaurant) {
    const searchText = JSON.stringify(restaurant).toLowerCase();

    // Check title, description, categoryName, and categories
    const title = (restaurant.title || "").toLowerCase();
    const description = (restaurant.description || "").toLowerCase();
    const categoryName = (restaurant.categoryName || "").toLowerCase();
    const categories = (restaurant.categories || []).join(" ").toLowerCase();

    // Check for street food keywords
    for (const keyword of streetFoodKeywords) {
      if (
        title.includes(keyword.toLowerCase()) ||
        description.includes(keyword.toLowerCase()) ||
        categoryName.includes(keyword.toLowerCase()) ||
        categories.includes(keyword.toLowerCase())
      ) {
        return true;
      }
    }

    // Additional criteria for street food
    const price = restaurant.price || "";
    const isBudgetFriendly =
      price.includes("$1") ||
      price.includes("£1") ||
      price.includes("€1") ||
      price.includes("¥100") ||
      price.includes("HK$1") ||
      price.includes("฿1");

    // Check for outdoor/street-like characteristics
    const hasStreetCharacteristics =
      title.includes("street") ||
      title.includes("market") ||
      title.includes("stall") ||
      title.includes("vendor") ||
      description.includes("street") ||
      description.includes("outdoor") ||
      description.includes("market");

    return isBudgetFriendly && hasStreetCharacteristics;
  }

  // Filter restaurants for street food
  const streetFoodRestaurants = restaurants.filter(isStreetFood);

  console.log(
    `🌍 Found ${streetFoodRestaurants.length} street food restaurants`
  );

  // Create the output data structure
  const aureliaData = {
    masterBot: {
      id: "1b0f0628-295d-4a4a-85ca-48594eee15b3",
      username: "nomad_aurelia",
      display_name: "Aurelia Voss",
      specialty: "Street Food Explorer",
      emoji: "🌍",
      description:
        "From Marrakech souks to Tokyo alleys, always chasing street food magic.",
      avatar_url: "/images/users/Aurelia Voss.png",
      personality_traits: [
        "Adventurous",
        "Cultural",
        "Authentic",
        "Wanderlust",
      ],
      cuisines: [
        "Street Food",
        "Southeast Asian",
        "Middle Eastern",
        "North African",
      ],
      price_range: ["Budget", "Affordable"],
      ambiance: ["Bustling", "Authentic", "Local", "Open-air"],
    },
    metadata: {
      total_restaurants: streetFoodRestaurants.length,
      extracted_at: new Date().toISOString(),
      source_file: "MasterBotBucket2.json",
      keywords_used: streetFoodKeywords,
    },
    restaurants: streetFoodRestaurants,
  };

  // Write the output file
  fs.writeFileSync(outputFile, JSON.stringify(aureliaData, null, 2));

  console.log(`✅ Successfully created ${outputFile}`);
  console.log(`📈 Street food restaurants by region:`);

  // Group by country for analysis
  const byCountry = {};
  streetFoodRestaurants.forEach((restaurant) => {
    const country = restaurant.countryCode || "Unknown";
    byCountry[country] = (byCountry[country] || 0) + 1;
  });

  Object.entries(byCountry)
    .sort(([, a], [, b]) => b - a)
    .forEach(([country, count]) => {
      console.log(`   ${country}: ${count} restaurants`);
    });

  console.log(`\n🎯 Top 10 street food finds:`);
  streetFoodRestaurants
    .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
    .slice(0, 10)
    .forEach((restaurant, index) => {
      console.log(
        `   ${index + 1}. ${restaurant.title} (${restaurant.city}, ${
          restaurant.countryCode
        }) - ${restaurant.totalScore}⭐`
      );
    });
} catch (error) {
  console.error("❌ Error processing data:", error.message);
  process.exit(1);
}
