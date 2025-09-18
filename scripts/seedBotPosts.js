// Seed Bot Posts Script
// Generates actual posts for each Master Bot using restaurant data
// Run with: npm run seed:bot-posts

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables:");
  console.error("SUPABASE_URL:", supabaseUrl ? "✅" : "❌");
  console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✅" : "❌");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Bot restaurant mappings
const BOT_RESTAURANT_MAPPINGS = {
  "Street Food Explorer": {
    keywords: [
      "street",
      "food truck",
      "market",
      "stall",
      "casual",
      "takeaway",
      "fast food",
      "quick",
      "local",
    ],
    categories: [
      "Street food restaurant",
      "Fast food restaurant",
      "Takeout restaurant",
      "Food truck",
    ],
    priceRange: ["$", "$$"],
    countries: ["TH", "VN", "IN", "MX", "MA", "TR", "JP", "KR"],
  },
  "Fine Dining Expert": {
    keywords: [
      "fine dining",
      "michelin",
      "luxury",
      "gourmet",
      "upscale",
      "elegant",
      "refined",
      "chef",
    ],
    categories: [
      "Fine dining restaurant",
      "French restaurant",
      "Contemporary restaurant",
      "Upscale restaurant",
    ],
    priceRange: ["$$$", "$$$$"],
    countries: ["FR", "IT", "ES", "US", "GB", "DE"],
  },
  "Vegan Specialist": {
    keywords: [
      "vegan",
      "vegetarian",
      "plant-based",
      "organic",
      "healthy",
      "salad",
      "juice",
      "raw",
    ],
    categories: [
      "Vegan restaurant",
      "Vegetarian restaurant",
      "Health food restaurant",
      "Salad shop",
    ],
    priceRange: ["$", "$$", "$$$"],
    countries: ["US", "DE", "GB", "AU", "CA", "NL", "SG", "TH"],
  },
  "Adventure Foodie": {
    keywords: [
      "adventure",
      "unique",
      "exotic",
      "outdoor",
      "scenic",
      "rooftop",
      "beach",
      "mountain",
      "barbecue",
      "grill",
      "seafood",
    ],
    categories: [
      "Restaurant",
      "Bar & Grill",
      "Seafood restaurant",
      "BBQ restaurant",
      "Barbecue restaurant",
    ],
    priceRange: ["$", "$$", "$$$"],
    countries: ["AU", "NZ", "CA", "US", "NO", "IS", "MX", "ES"],
  },
  "Indian/Asian Cuisine Expert": {
    keywords: [
      "indian",
      "asian",
      "curry",
      "spice",
      "thai",
      "chinese",
      "vietnamese",
      "spicy",
      "authentic",
    ],
    categories: [
      "Indian restaurant",
      "Thai restaurant",
      "Chinese restaurant",
      "Asian restaurant",
      "Vietnamese restaurant",
    ],
    priceRange: ["$", "$$", "$$$"],
    countries: ["IN", "TH", "CN", "VN", "MY", "SG", "JP", "KR"],
  },
  "Coffee Culture Expert": {
    keywords: [
      "coffee",
      "cafe",
      "espresso",
      "roastery",
      "specialty coffee",
      "artisan",
      "beans",
    ],
    categories: ["Coffee shop", "Cafe", "Bakery", "Breakfast restaurant"],
    priceRange: ["$", "$$"],
    countries: ["IT", "AU", "US", "ET", "CO", "BR", "SE", "NO"],
  },
  "Japanese Cuisine Master": {
    keywords: [
      "japanese",
      "sushi",
      "ramen",
      "izakaya",
      "tempura",
      "minimalist",
      "traditional",
      "authentic",
    ],
    categories: [
      "Japanese restaurant",
      "Sushi restaurant",
      "Ramen restaurant",
      "Izakaya restaurant",
    ],
    priceRange: ["$$", "$$$", "$$$$"],
    countries: ["JP", "US", "AU", "GB", "CA"],
  },
};

async function loadRestaurants() {
  const restaurantPath = path.join(
    process.cwd(),
    "public",
    "MasterBotBucket2.json"
  );

  if (!fs.existsSync(restaurantPath)) {
    throw new Error(`Restaurant data not found at: ${restaurantPath}`);
  }

  const restaurants = JSON.parse(fs.readFileSync(restaurantPath, "utf8"));
  console.log(`📊 Loaded ${restaurants.length} restaurants`);
  return restaurants;
}

async function getMasterBots() {
  const { data: bots, error } = await supabase
    .from("users")
    .select(
      `
      id,
      username,
      display_name,
      master_bots (
        bot_name,
        personality_type,
        specialties,
        system_prompt
      )
    `
    )
    .eq("is_master_bot", true)
    .eq("master_bots.is_active", true);

  if (error) throw error;

  return (
    bots?.map((bot) => ({
      ...bot,
      personality_type: bot.master_bots?.[0]?.personality_type,
      specialties: bot.master_bots?.[0]?.specialties || [],
    })) || []
  );
}

function matchRestaurantsToBot(restaurants, botType, count = 3) {
  const mapping = BOT_RESTAURANT_MAPPINGS[botType];
  if (!mapping) {
    // Fallback: return random high-rated restaurants
    const highRated = restaurants.filter((r) => r.totalScore >= 4.0);
    return highRated.slice(0, count);
  }

  // Filter restaurants based on bot preferences
  const matchingRestaurants = restaurants.filter((restaurant) => {
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

  if (matchingRestaurants.length === 0) {
    const fallback = restaurants.filter((r) => r.totalScore >= 4.0);
    return fallback.slice(0, count);
  }

  // Prioritize restaurants from preferred countries
  const preferredCountryRestaurants = matchingRestaurants.filter((r) =>
    mapping.countries.includes(r.countryCode)
  );

  const finalPool =
    preferredCountryRestaurants.length > 0
      ? preferredCountryRestaurants
      : matchingRestaurants;

  // Shuffle and return the requested count
  const shuffled = finalPool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateBotPost(bot, restaurant) {
  const content = generateBotContent(bot, restaurant);
  const imageUrl = getRestaurantImage(restaurant);
  const tags = generateTags(restaurant, bot);

  return {
    bot_id: bot.id,
    title: content.title,
    subtitle: content.subtitle,
    content: content.fullContent,
    restaurant_data: restaurant,
    restaurant_place_id: restaurant.placeId,
    image_url: imageUrl,
    tags,
    post_type: "restaurant_review",
  };
}

function generateBotContent(bot, restaurant) {
  const templates = {
    "Street Food Explorer": {
      title: `Hidden Gem: ${restaurant.title}`,
      subtitle: `Authentic street flavors in ${restaurant.city}. This local spot captures the true essence of the food scene.`,
      fullContent: `Just discovered this incredible street food spot in ${restaurant.city}! The atmosphere here is exactly what I've been searching for - authentic, bustling, and full of local character. ${restaurant.description} The fact that it has ${restaurant.reviewsCount} reviews with a ${restaurant.totalScore}/5 rating tells you everything about how the locals feel about this place. Best time to visit: any time you're craving real, unfiltered flavors!`,
    },
    "Fine Dining Expert": {
      title: `Exquisite: ${restaurant.title}`,
      subtitle: `A ${
        restaurant.price || "premium"
      } establishment showcasing refined technique and exceptional service. Rating: ${
        restaurant.totalScore
      }/5 stars.`,
      fullContent: `An extraordinary dining experience at ${restaurant.title} in ${restaurant.city}. ${restaurant.description} The attention to detail in both preparation and presentation is remarkable. What sets this place apart is the harmonious balance between innovation and tradition. With ${restaurant.reviewsCount} reviews maintaining a ${restaurant.totalScore}/5 rating, this is clearly a destination worth the journey. Reservation highly recommended.`,
    },
    "Vegan Specialist": {
      title: `Plant-Based Discovery: ${restaurant.title}`,
      subtitle: `Innovative plant-based cuisine proving that vegan dining can be both delicious and sustainable.`,
      fullContent: `Found an amazing plant-based gem in ${restaurant.city}! ${restaurant.title} is revolutionizing how we think about vegan cuisine. ${restaurant.description} What I love most is how they've created dishes that satisfy both vegans and omnivores alike. The creativity in their plant-based alternatives is inspiring. With a ${restaurant.totalScore}/5 rating from ${restaurant.reviewsCount} reviews, this place is clearly doing something special.`,
    },
    "Adventure Foodie": {
      title: `Epic Eats: ${restaurant.title}`,
      subtitle: `Amazing food discovery in ${restaurant.city}! The adventure of finding this spot was totally worth it.`,
      fullContent: `What an adventure finding this place! ${restaurant.title} in ${restaurant.city} is exactly the kind of spot I live for. ${restaurant.description} The energy here is infectious, and you can tell this is where the real food action happens. Sometimes the best meals come from the most unexpected places. ${restaurant.totalScore}/5 stars from ${restaurant.reviewsCount} reviews - the locals know what's up!`,
    },
    "Indian/Asian Cuisine Expert": {
      title: `Authentic Spices: ${restaurant.title}`,
      subtitle: `Traditional flavors and authentic preparation methods honoring culinary heritage.`,
      fullContent: `Incredible authentic experience at ${restaurant.title} in ${restaurant.city}. ${restaurant.description} The spice balance here is absolutely perfect - you can taste the expertise and tradition in every bite. What makes this place special is their commitment to authentic preparation methods and traditional recipes. ${restaurant.reviewsCount} reviews with ${restaurant.totalScore}/5 stars speaks to the consistency and quality you'll find here.`,
    },
    "Coffee Culture Expert": {
      title: `Coffee Culture: ${restaurant.title}`,
      subtitle: `Exceptional coffee ritual with attention to bean origin and brewing technique.`,
      fullContent: `Discovered a true coffee sanctuary at ${restaurant.title} in ${restaurant.city}. ${restaurant.description} The attention to detail in their brewing process is meditative - from bean selection to final pour, every step is executed with precision. This is the kind of place where coffee becomes more than just a drink; it's a cultural experience. ${restaurant.totalScore}/5 rating from ${restaurant.reviewsCount} reviews confirms this is a destination for serious coffee lovers.`,
    },
    "Japanese Cuisine Master": {
      title: `Zen Dining: ${restaurant.title}`,
      subtitle: `Minimalist beauty demonstrating the art of restraint and traditional Japanese craftsmanship.`,
      fullContent: `A lesson in culinary restraint at ${restaurant.title} in ${restaurant.city}. ${restaurant.description} Each dish here embodies the Japanese philosophy of finding perfection through simplicity. The precision in preparation and presentation creates a meditative dining experience. ${restaurant.totalScore}/5 stars from ${restaurant.reviewsCount} reviews reflects the deep appreciation people have for this level of craftsmanship.`,
    },
  };

  const template = templates[bot.personality_type];
  return (
    template || {
      title: `Discovery: ${restaurant.title}`,
      subtitle: `Latest find in ${
        restaurant.city
      }. ${restaurant.description?.slice(0, 100)}...`,
      fullContent: `Excited to share my latest discovery: ${restaurant.title} in ${restaurant.city}. ${restaurant.description} This place has earned its ${restaurant.totalScore}/5 rating from ${restaurant.reviewsCount} reviews through consistent quality and authentic flavors.`,
    }
  );
}

function generateTags(restaurant, bot) {
  const tags = [];

  if (restaurant.price) tags.push(restaurant.price);
  if (restaurant.totalScore >= 4.5) tags.push("highly-rated");
  if (restaurant.categoryName) {
    tags.push(restaurant.categoryName.toLowerCase().replace(" restaurant", ""));
  }

  tags.push(restaurant.city.toLowerCase());

  if (bot.specialties && bot.specialties.length > 0) {
    tags.push(
      ...bot.specialties
        .slice(0, 2)
        .map((s) => s.toLowerCase().replace(" ", "-"))
    );
  }

  return tags.slice(0, 6);
}

function getRestaurantImage(restaurant) {
  const imageMap = {
    japanese:
      "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=600&h=400&fit=crop",
    "fine dining":
      "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&h=400&fit=crop",
    coffee:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop",
    "street food":
      "https://images.unsplash.com/photo-1581978089930-87b68dc03006?w=600&h=400&fit=crop",
    vegan:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop",
    indian:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop",
    thai: "https://images.unsplash.com/photo-1559314809-0f31657def5e?w=600&h=400&fit=crop",
    sushi:
      "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=600&h=400&fit=crop",
    barbecue:
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop",
  };

  const category = restaurant.categoryName.toLowerCase();
  for (const [key, image] of Object.entries(imageMap)) {
    if (category.includes(key)) {
      return image;
    }
  }

  return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop";
}

async function seedBotPosts() {
  console.log("🤖 Starting Bot Posts Seeding...\n");

  try {
    // Load data
    const restaurants = await loadRestaurants();
    const bots = await getMasterBots();

    console.log(`👥 Found ${bots.length} Master Bots`);

    let totalPosts = 0;

    // Generate posts for each bot
    for (const bot of bots) {
      console.log(
        `\n📝 Generating posts for ${bot.display_name} (${bot.personality_type})...`
      );

      // Get 3 restaurants matching this bot's specialty
      const matchedRestaurants = matchRestaurantsToBot(
        restaurants,
        bot.personality_type,
        3
      );
      console.log(
        `   🏪 Found ${matchedRestaurants.length} matching restaurants`
      );

      const botPosts = [];

      // Create posts for each matched restaurant
      for (const restaurant of matchedRestaurants) {
        const post = generateBotPost(bot, restaurant);
        botPosts.push(post);
        console.log(
          `   ✅ Created post: "${post.title}" for ${restaurant.city}`
        );
      }

      // Insert posts into database
      const { data, error } = await supabase
        .from("bot_posts")
        .insert(botPosts)
        .select("id, title");

      if (error) {
        console.error(
          `❌ Error inserting posts for ${bot.display_name}:`,
          error
        );
        continue;
      }

      console.log(`   ✅ Saved ${data?.length || 0} posts to database`);
      totalPosts += data?.length || 0;
    }

    console.log(`\n🎉 Bot Posts Seeding Complete!`);
    console.log(`📊 Total posts created: ${totalPosts}`);
    console.log(`🤖 Bots with content: ${bots.length}`);
  } catch (error) {
    console.error("❌ Bot Posts seeding failed:", error);
    throw error;
  }
}

seedBotPosts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });








