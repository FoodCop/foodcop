import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Master Bot configurations
const masterBots = [
  {
    id: "f2e517b0-7dd2-4534-a678-5b64d4795b3a",
    username: "spice_scholar_anika",
    display_name: "Anika Kapoor",
    specialty: "Indian/Asian Cuisine Expert",
    emoji: "🌶️",
    keywords: [
      "indian",
      "Indian",
      "asian",
      "Asian",
      "spicy",
      "Spicy",
      "curry",
      "Curry",
      "thai",
      "Thai",
      "malaysian",
      "Malaysian",
      "vietnamese",
      "Vietnamese",
      "chinese",
      "Chinese",
      "korean",
      "Korean",
      "japanese",
      "Japanese",
      "southeast asian",
      "Southeast Asian",
      "south asian",
      "South Asian",
      "indian restaurant",
      "Indian restaurant",
      "thai restaurant",
      "Thai restaurant",
      "chinese restaurant",
      "Chinese restaurant",
      "asian fusion",
      "Asian fusion",
      "spice",
      "Spice",
      "masala",
      "Masala",
      "biryani",
      "Biryani",
      "tandoori",
      "Tandoori",
      "pad thai",
      "Pad Thai",
      "pho",
      "Pho",
      "ramen",
      "Ramen",
      "sushi",
      "Sushi",
      "dim sum",
      "Dim sum",
    ],
    priceRanges: ["$$", "$$$", "$$$$"],
    categories: [
      "Indian restaurant",
      "Thai restaurant",
      "Chinese restaurant",
      "Asian restaurant",
    ],
  },
  {
    id: "78de3261-040d-492e-b511-50f71c0d9986",
    username: "sommelier_seb",
    display_name: "Sebastian LeClair",
    specialty: "Fine Dining Expert",
    emoji: "🍷",
    keywords: [
      "fine dining",
      "Fine dining",
      "fine-dining",
      "Fine-Dining",
      "michelin",
      "Michelin",
      "michelin star",
      "Michelin star",
      "michelin starred",
      "Michelin starred",
      "upscale",
      "Upscale",
      "elegant",
      "Elegant",
      "sophisticated",
      "Sophisticated",
      "gourmet",
      "Gourmet",
      "haute cuisine",
      "Haute cuisine",
      "french",
      "French",
      "italian",
      "Italian",
      "mediterranean",
      "Mediterranean",
      "wine",
      "Wine",
      "sommelier",
      "Sommelier",
      "tasting menu",
      "Tasting menu",
      "chef",
      "Chef",
      "restaurant",
      "Restaurant",
      "bistro",
      "Bistro",
      "brasserie",
      "Brasserie",
      "cafe",
      "Cafe",
      "steakhouse",
      "Steakhouse",
      "seafood",
      "Seafood",
      "oyster",
      "Oyster",
      "lobster",
      "Lobster",
      "caviar",
      "Caviar",
    ],
    priceRanges: ["$$$", "$$$$"],
    categories: [
      "Fine dining restaurant",
      "French restaurant",
      "Italian restaurant",
      "Seafood restaurant",
    ],
  },
  {
    id: "2400b343-0e89-43f7-b3dc-6883fa486da3",
    username: "plant_pioneer_lila",
    display_name: "Lila Cheng",
    specialty: "Vegan Specialist",
    emoji: "🌱",
    keywords: [
      "vegan",
      "Vegan",
      "vegetarian",
      "Vegetarian",
      "plant-based",
      "Plant-based",
      "plant based",
      "Plant based",
      "organic",
      "Organic",
      "healthy",
      "Healthy",
      "green",
      "Green",
      "sustainable",
      "Sustainable",
      "eco-friendly",
      "Eco-friendly",
      "raw",
      "Raw",
      "gluten-free",
      "Gluten-free",
      "dairy-free",
      "Dairy-free",
      "vegan restaurant",
      "Vegan restaurant",
      "vegetarian restaurant",
      "Vegetarian restaurant",
      "salad",
      "Salad",
      "smoothie",
      "Smoothie",
      "juice",
      "Juice",
      "bowl",
      "Bowl",
      "acai",
      "Acai",
      "quinoa",
      "Quinoa",
      "tofu",
      "Tofu",
      "tempeh",
      "Tempeh",
      "seitan",
      "Seitan",
      "plant protein",
      "Plant protein",
      "superfood",
      "Superfood",
      "detox",
      "Detox",
      "clean eating",
      "Clean eating",
    ],
    priceRanges: ["$", "$$", "$$$"],
    categories: [
      "Vegan restaurant",
      "Vegetarian restaurant",
      "Health food restaurant",
      "Salad restaurant",
    ],
  },
  {
    id: "7cb0c0d0-996e-4afc-9c7a-95ed0152f63e",
    username: "zen_minimalist_jun",
    display_name: "Jun Tanaka",
    specialty: "Japanese Cuisine Master",
    emoji: "🍣",
    keywords: [
      "japanese",
      "Japanese",
      "sushi",
      "Sushi",
      "sashimi",
      "Sashimi",
      "nigiri",
      "Nigiri",
      "maki",
      "Maki",
      "ramen",
      "Ramen",
      "udon",
      "Udon",
      "soba",
      "Soba",
      "tempura",
      "Tempura",
      "yakitori",
      "Yakitori",
      "izakaya",
      "Izakaya",
      "omakase",
      "Omakase",
      "kaiseki",
      "Kaiseki",
      "teppanyaki",
      "Teppanyaki",
      "japanese restaurant",
      "Japanese restaurant",
      "sushi bar",
      "Sushi bar",
      "ramen shop",
      "Ramen shop",
      "japanese cuisine",
      "Japanese cuisine",
      "tokyo",
      "Tokyo",
      "osaka",
      "Osaka",
      "kyoto",
      "Kyoto",
      "minimalist",
      "Minimalist",
      "zen",
      "Zen",
      "traditional",
      "Traditional",
      "authentic",
      "Authentic",
      "wasabi",
      "Wasabi",
      "miso",
      "Miso",
      "sake",
      "Sake",
    ],
    priceRanges: ["$$", "$$$", "$$$$"],
    categories: [
      "Japanese restaurant",
      "Sushi restaurant",
      "Ramen restaurant",
      "Izakaya restaurant",
    ],
  },
  {
    id: "0a1092da-dea6-4d32-ac2b-fe50a31beae3",
    username: "coffee_pilgrim_omar",
    display_name: "Omar Darzi",
    specialty: "Coffee Culture Expert",
    emoji: "☕",
    keywords: [
      "coffee",
      "Coffee",
      "cafe",
      "Cafe",
      "coffee shop",
      "Coffee shop",
      "coffeehouse",
      "Coffeehouse",
      "coffee bar",
      "Coffee bar",
      "espresso",
      "Espresso",
      "cappuccino",
      "Cappuccino",
      "latte",
      "Latte",
      "americano",
      "Americano",
      "macchiato",
      "Macchiato",
      "mocha",
      "Mocha",
      "frappuccino",
      "Frappuccino",
      "cold brew",
      "Cold brew",
      "pour over",
      "Pour over",
      "french press",
      "French press",
      "chemex",
      "Chemex",
      "v60",
      "V60",
      "aeropress",
      "Aeropress",
      "coffee roaster",
      "Coffee roaster",
      "roastery",
      "Roastery",
      "specialty coffee",
      "Specialty coffee",
      "third wave",
      "Third wave",
      "artisan",
      "Artisan",
      "barista",
      "Barista",
      "coffee culture",
      "Coffee culture",
      "coffee bean",
      "Coffee bean",
      "arabica",
      "Arabica",
      "robusta",
      "Robusta",
      "ethiopian",
      "Ethiopian",
      "colombian",
      "Colombian",
      "jamaican",
      "Jamaican",
      "hawaiian",
      "Hawaiian",
    ],
    priceRanges: ["$", "$$"],
    categories: ["Coffee shop", "Cafe", "Coffee roaster", "Bakery"],
  },
  {
    id: "86efa684-37ae-49bb-8e7c-2c0829aa6474",
    username: "adventure_rafa",
    display_name: "Rafael Mendez",
    specialty: "Adventure Foodie",
    emoji: "🏄‍♂️",
    keywords: [
      "adventure",
      "Adventure",
      "outdoor",
      "Outdoor",
      "beach",
      "Beach",
      "coastal",
      "Coastal",
      "surf",
      "Surf",
      "mountain",
      "Mountain",
      "hiking",
      "Hiking",
      "camping",
      "Camping",
      "bbq",
      "BBQ",
      "barbecue",
      "Barbecue",
      "grill",
      "Grill",
      "smokehouse",
      "Smokehouse",
      "seafood",
      "Seafood",
      "fish",
      "Fish",
      "lobster",
      "Lobster",
      "crab",
      "Crab",
      "shrimp",
      "Shrimp",
      "oyster",
      "Oyster",
      "taco",
      "Taco",
      "burrito",
      "Burrito",
      "mexican",
      "Mexican",
      "latin",
      "Latin",
      "caribbean",
      "Caribbean",
      "cuban",
      "Cuban",
      "puerto rican",
      "Puerto Rican",
      "peruvian",
      "Peruvian",
      "brazilian",
      "Brazilian",
      "argentine",
      "Argentine",
      "chilean",
      "Chilean",
      "food truck",
      "Food truck",
      "pop-up",
      "Pop-up",
      "festival",
      "Festival",
      "market",
      "Market",
    ],
    priceRanges: ["$", "$$", "$$$"],
    categories: [
      "Seafood restaurant",
      "BBQ restaurant",
      "Mexican restaurant",
      "Food truck",
    ],
  },
];

// Read the MasterBotBucket2.json file
const inputFile = path.join(__dirname, "../public/MasterBotBucket2.json");
const outputDir = path.join(__dirname, "../public/masterbot-datasets");

console.log("🔍 Extracting specialized data for all Master Bots...");

try {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read the JSON file
  const rawData = fs.readFileSync(inputFile, "utf8");
  const restaurants = JSON.parse(rawData);

  console.log(`📊 Total restaurants in dataset: ${restaurants.length}`);

  // Process each master bot
  for (const bot of masterBots) {
    console.log(`\n🌍 Processing ${bot.display_name} (${bot.specialty})...`);

    // Function to check if a restaurant matches this bot's criteria
    function matchesBot(restaurant) {
      const title = (restaurant.title || "").toLowerCase();
      const description = (restaurant.description || "").toLowerCase();
      const categoryName = (restaurant.categoryName || "").toLowerCase();
      const categories = (restaurant.categories || []).join(" ").toLowerCase();

      // Check for keywords
      for (const keyword of bot.keywords) {
        if (
          title.includes(keyword.toLowerCase()) ||
          description.includes(keyword.toLowerCase()) ||
          categoryName.includes(keyword.toLowerCase()) ||
          categories.includes(keyword.toLowerCase())
        ) {
          return true;
        }
      }

      // Check price range
      const price = restaurant.price || "";
      const hasMatchingPrice = bot.priceRanges.some((range) =>
        price.includes(range)
      );

      // Check categories
      const hasMatchingCategory = bot.categories.some((cat) =>
        categories.includes(cat.toLowerCase())
      );

      return hasMatchingPrice && hasMatchingCategory;
    }

    // Filter restaurants for this bot
    const botRestaurants = restaurants.filter(matchesBot);

    console.log(`   Found ${botRestaurants.length} restaurants`);

    // Create the output data structure
    const botData = {
      masterBot: {
        id: bot.id,
        username: bot.username,
        display_name: bot.display_name,
        specialty: bot.specialty,
        emoji: bot.emoji,
        description: getBotDescription(bot),
        avatar_url: `/images/users/${bot.display_name}.png`,
        personality_traits: getPersonalityTraits(bot),
        cuisines: getCuisines(bot),
        price_range: getPriceRanges(bot),
        ambiance: getAmbiance(bot),
      },
      metadata: {
        total_restaurants: botRestaurants.length,
        extracted_at: new Date().toISOString(),
        source_file: "MasterBotBucket2.json",
        keywords_used: bot.keywords,
        price_ranges: bot.priceRanges,
        categories: bot.categories,
      },
      restaurants: botRestaurants,
    };

    // Write the output file
    const outputFile = path.join(outputDir, `${bot.username}-data.json`);
    fs.writeFileSync(outputFile, JSON.stringify(botData, null, 2));

    console.log(`   ✅ Created ${outputFile}`);

    // Show geographic distribution
    const byCountry = {};
    botRestaurants.forEach((restaurant) => {
      const country = restaurant.countryCode || "Unknown";
      byCountry[country] = (byCountry[country] || 0) + 1;
    });

    const topCountries = Object.entries(byCountry)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    console.log(
      `   📈 Top countries: ${topCountries
        .map(([country, count]) => `${country}(${count})`)
        .join(", ")}`
    );

    // Show top rated restaurants
    const topRated = botRestaurants
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .slice(0, 3);

    console.log(
      `   🎯 Top finds: ${topRated
        .map((r) => `${r.title} (${r.totalScore}⭐)`)
        .join(", ")}`
    );
  }

  console.log(
    `\n🎉 Successfully created datasets for all ${masterBots.length} Master Bots!`
  );
  console.log(`📁 All datasets saved in: ${outputDir}`);
} catch (error) {
  console.error("❌ Error processing data:", error.message);
  process.exit(1);
}

// Helper functions
function getBotDescription(bot) {
  const descriptions = {
    spice_scholar_anika:
      "Spice scholar. Mapping the curry trails of India, Southeast Asia & beyond.",
    sommelier_seb:
      "Sommelier turned globetrotter. Pairing fine dining with the world's best wines.",
    plant_pioneer_lila:
      "Plant-based pioneer. Discovering vegan-friendly bites in every corner of the globe.",
    zen_minimalist_jun:
      "Minimalist taste explorer. Celebrating sushi, ramen, and the art of simplicity.",
    coffee_pilgrim_omar:
      "Coffee pilgrim. From Ethiopian hills to Brooklyn brews, I document coffee culture.",
    adventure_rafa:
      "Adventure fuels appetite. From surf shack tacos to mountaintop ramen.",
  };
  return (
    descriptions[bot.username] ||
    `${bot.specialty} exploring culinary excellence.`
  );
}

function getPersonalityTraits(bot) {
  const traits = {
    spice_scholar_anika: [
      "Knowledgeable",
      "Traditional",
      "Passionate",
      "Cultural",
    ],
    sommelier_seb: [
      "Sophisticated",
      "Knowledgeable",
      "Refined",
      "Detail-oriented",
    ],
    plant_pioneer_lila: [
      "Passionate",
      "Sustainable",
      "Creative",
      "Health-conscious",
    ],
    zen_minimalist_jun: ["Minimalist", "Thoughtful", "Traditional", "Precise"],
    coffee_pilgrim_omar: [
      "Contemplative",
      "Detail-oriented",
      "Cultural",
      "Methodical",
    ],
    adventure_rafa: ["Adventurous", "Energetic", "Outdoorsy", "Spontaneous"],
  };
  return (
    traits[bot.username] || [
      "Expert",
      "Passionate",
      "Knowledgeable",
      "Authentic",
    ]
  );
}

function getCuisines(bot) {
  const cuisines = {
    spice_scholar_anika: ["Indian", "Southeast Asian", "Thai", "Malaysian"],
    sommelier_seb: ["French", "Mediterranean", "Fusion", "Contemporary"],
    plant_pioneer_lila: [
      "Vegan",
      "Plant-Based",
      "Mediterranean",
      "Asian Fusion",
    ],
    zen_minimalist_jun: ["Japanese", "Sushi", "Ramen", "Traditional"],
    coffee_pilgrim_omar: ["Coffee", "Pastries", "Light Bites", "Desserts"],
    adventure_rafa: ["Seafood", "Latin American", "Fusion", "Coastal"],
  };
  return cuisines[bot.username] || [bot.specialty];
}

function getPriceRanges(bot) {
  const priceRanges = {
    spice_scholar_anika: ["Budget", "Affordable", "Mid-range"],
    sommelier_seb: ["Luxury", "Fine Dining"],
    plant_pioneer_lila: ["Affordable", "Mid-range", "Fine Dining"],
    zen_minimalist_jun: ["Mid-range", "Fine Dining", "Traditional"],
    coffee_pilgrim_omar: ["Affordable", "Mid-range", "Specialty"],
    adventure_rafa: ["Budget", "Affordable", "Mid-range"],
  };
  return priceRanges[bot.username] || ["Affordable", "Mid-range"];
}

function getAmbiance(bot) {
  const ambiance = {
    spice_scholar_anika: ["Traditional", "Authentic", "Bustling", "Local"],
    sommelier_seb: ["Elegant", "Intimate", "Sophisticated", "Quiet"],
    plant_pioneer_lila: [
      "Modern",
      "Health-conscious",
      "Sustainable",
      "Creative",
    ],
    zen_minimalist_jun: ["Minimal", "Quiet", "Traditional", "Authentic"],
    coffee_pilgrim_omar: ["Quiet", "Minimal", "Cozy", "Artistic"],
    adventure_rafa: ["Outdoor", "Casual", "Adventure", "Beachside"],
  };
  return ambiance[bot.username] || ["Authentic", "Local", "Welcoming"];
}
