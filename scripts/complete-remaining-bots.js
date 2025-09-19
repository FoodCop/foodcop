import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Master Bot configurations with their specialties and keywords
const masterBots = [
  {
    id: "2400b343-0e89-43f7-b3dc-6883fa486da3",
    username: "plant_pioneer_lila",
    display_name: "Lila Cheng",
    specialties: [
      "Vegan cuisine",
      "Plant-based",
      "Healthy eating",
      "Sustainability",
    ],
    keywords: [
      "vegan",
      "vegetarian",
      "plant-based",
      "organic",
      "healthy",
      "sustainable",
      "green",
      "raw",
      "gluten-free",
    ],
    priceRange: ["$", "$$"],
    categories: [
      "Vegan restaurant",
      "Vegetarian restaurant",
      "Health food restaurant",
    ],
  },
  {
    id: "7cb0c0d0-996e-4afc-9c7a-95ed0152f63e",
    username: "zen_minimalist_jun",
    display_name: "Jun Tanaka",
    specialties: ["Japanese cuisine", "Minimalism", "Sushi", "Tea ceremony"],
    keywords: [
      "japanese",
      "sushi",
      "sashimi",
      "ramen",
      "tempura",
      "zen",
      "minimalist",
      "tea",
      "miso",
      "wasabi",
    ],
    priceRange: ["$$", "$$$"],
    categories: ["Japanese restaurant", "Sushi restaurant", "Ramen restaurant"],
  },
  {
    id: "0a1092da-dea6-4d32-ac2b-fe50a31beae3",
    username: "coffee_pilgrim_omar",
    display_name: "Omar Darzi",
    specialties: [
      "Coffee",
      "Cafes",
      "Middle Eastern cuisine",
      "Coffee culture",
    ],
    keywords: [
      "coffee",
      "cafe",
      "espresso",
      "arabic",
      "middle eastern",
      "falafel",
      "hummus",
      "shisha",
      "turkish",
      "ethiopian",
    ],
    priceRange: ["$", "$$"],
    categories: ["Coffee shop", "Middle Eastern restaurant", "Cafe"],
  },
  {
    id: "86efa684-37ae-49bb-8e7c-2c0829aa6474",
    username: "adventure_rafa",
    display_name: "Rafael Mendez",
    specialties: [
      "Latin American cuisine",
      "Adventure dining",
      "Street food",
      "Cultural exploration",
    ],
    keywords: [
      "latin",
      "mexican",
      "peruvian",
      "argentinian",
      "brazilian",
      "street food",
      "adventure",
      "spicy",
      "ceviche",
      "tacos",
    ],
    priceRange: ["$", "$$"],
    categories: [
      "Mexican restaurant",
      "Latin American restaurant",
      "Street food",
    ],
  },
  {
    id: "1b0f0628-295d-4a4a-85ca-48594eee15b3",
    username: "nomad_aurelia",
    display_name: "Aurelia Voss",
    specialties: ["Street food", "Global cuisine", "Travel", "Cultural fusion"],
    keywords: [
      "street food",
      "global",
      "fusion",
      "travel",
      "nomad",
      "hawker",
      "food truck",
      "market",
      "local",
      "authentic",
    ],
    priceRange: ["$", "$$"],
    categories: [
      "Street food",
      "Food truck",
      "Hawker center",
      "Global cuisine",
    ],
  },
];

// Load the Google Places data
let googlePlacesData = [];
try {
  const dataPath = path.join(__dirname, "../public/MasterBotBucket2.json");
  console.log("📖 Loading Google Places data...");
  const rawData = fs.readFileSync(dataPath, "utf8");
  googlePlacesData = JSON.parse(rawData);
  console.log(
    `✅ Loaded ${googlePlacesData.length} restaurants from MasterBotBucket2.json`
  );
} catch (error) {
  console.error("❌ Error loading MasterBotBucket2.json:", error.message);
  process.exit(1);
}

// Function to clean and normalize text
function cleanText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Function to check if restaurant matches bot criteria
function matchesBotCriteria(restaurant, bot) {
  const title = cleanText(restaurant.title || "");
  const description = cleanText(restaurant.description || "");
  const category = cleanText(restaurant.categoryName || "");
  const address = cleanText(restaurant.address || "");

  const allText = `${title} ${description} ${category} ${address}`;

  // Check keywords (at least one keyword must match)
  const keywordMatch = bot.keywords.some((keyword) =>
    allText.includes(cleanText(keyword))
  );

  // Check price range (more flexible)
  const priceMatch =
    bot.priceRange.includes(restaurant.price || "$") ||
    (restaurant.price === "$$$$" && bot.priceRange.includes("$$$")) ||
    (restaurant.price === "$$$" && bot.priceRange.includes("$$"));

  // Check categories (more flexible)
  const categoryMatch = bot.categories.some(
    (cat) =>
      category.includes(cleanText(cat)) || allText.includes(cleanText(cat))
  );

  // Return true if at least keyword OR category matches, and price is reasonable
  return (keywordMatch || categoryMatch) && priceMatch;
}

// Function to extract restaurant data for a bot
function extractRestaurantData(bot) {
  console.log(`\n🔍 Extracting data for ${bot.display_name}...`);

  const matchingRestaurants = googlePlacesData.filter((restaurant) =>
    matchesBotCriteria(restaurant, bot)
  );

  console.log(`   📊 Found ${matchingRestaurants.length} matching restaurants`);

  // Transform to our format
  const transformedData = matchingRestaurants.map((restaurant, index) => ({
    id: `restaurant-${bot.username}-${index + 1}`,
    placeId: restaurant.placeId || `place-${index + 1}`,
    name: restaurant.title,
    description: restaurant.description,
    address: restaurant.address,
    street: restaurant.street,
    city: restaurant.city,
    country: restaurant.countryCode,
    postalCode: restaurant.postalCode,
    neighborhood: restaurant.neighborhood,
    price: restaurant.price,
    priceLevel:
      restaurant.price === "$$$$"
        ? 4
        : restaurant.price === "$$$"
        ? 3
        : restaurant.price === "$$"
        ? 2
        : 1,
    category: restaurant.categoryName,
    rating: restaurant.totalScore || 4.0,
    reviewsCount:
      restaurant.reviewsCount || Math.floor(Math.random() * 1000) + 100,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
    imageUrl: restaurant.imageUrl || null,
    website: restaurant.website || null,
    phone: restaurant.phone || null,
    openingHours: restaurant.openingHours || null,
    tags: [
      restaurant.categoryName,
      restaurant.neighborhood,
      restaurant.city,
      restaurant.countryCode,
    ].filter(Boolean),
  }));

  return transformedData;
}

// Function to generate posts for a bot
function generatePostsForBot(bot, restaurantData) {
  console.log(`\n📝 Generating posts for ${bot.display_name}...`);

  const posts = [];
  const postTypes = ["review", "story", "tip", "philosophy", "travel"];

  // Generate 70 posts
  for (let i = 0; i < 70; i++) {
    const restaurant = restaurantData[i % restaurantData.length];
    const postType = postTypes[i % postTypes.length];

    let title, content;

    switch (postType) {
      case "review":
        title = `🍽️ ${restaurant.name} - A ${bot.specialties[0]} Experience`;
        content = `Just had an incredible meal at ${restaurant.name} in ${
          restaurant.city
        }! ${restaurant.description} The ${
          bot.specialties[0]
        } here is absolutely outstanding. ${
          restaurant.price
        } price point makes it accessible, and the ${
          restaurant.rating
        }-star rating is well deserved. Highly recommend for anyone looking for authentic ${restaurant.category.toLowerCase()} in ${
          restaurant.neighborhood
        }.`;
        break;

      case "story":
        title = `🌟 My Journey to ${restaurant.name}`;
        content = `Walking through ${restaurant.neighborhood} in ${restaurant.city}, I discovered this hidden gem: ${restaurant.name}. ${restaurant.description} As someone who specializes in ${bot.specialties[0]}, I was immediately drawn to their approach. The atmosphere, the flavors, the attention to detail - everything speaks to the heart of ${bot.specialties[1]}. This is why I love exploring ${restaurant.city}!`;
        break;

      case "tip":
        title = `💡 Pro Tip: ${restaurant.name}`;
        content = `Here's a ${
          bot.specialties[0]
        } tip for my fellow food lovers: Visit ${restaurant.name} in ${
          restaurant.city
        } during off-peak hours. ${
          restaurant.description
        } Their ${restaurant.category.toLowerCase()} is exceptional, and you'll get the full experience without the crowds. The ${
          restaurant.price
        } pricing is fair for the quality you receive. Trust me on this one!`;
        break;

      case "philosophy":
        title = `🧘 The Philosophy of ${restaurant.name}`;
        content = `${restaurant.name} in ${restaurant.city} embodies everything I believe about ${bot.specialties[0]}. ${restaurant.description} It's not just about the food - it's about the story, the culture, the connection. This place reminds me why I fell in love with ${bot.specialties[1]}. Sometimes the best discoveries are right in your neighborhood.`;
        break;

      case "travel":
        title = `✈️ Travel Discovery: ${restaurant.name}`;
        content = `While exploring ${restaurant.city}, I stumbled upon ${
          restaurant.name
        } in ${restaurant.neighborhood}. ${
          restaurant.description
        } This is exactly the kind of authentic ${restaurant.category.toLowerCase()} experience I seek when traveling. The ${
          restaurant.rating
        }-star rating is spot on, and the ${
          restaurant.price
        } price point makes it accessible to everyone. A must-visit for fellow ${
          bot.specialties[0]
        } enthusiasts!`;
        break;
    }

    const post = {
      id: `${bot.username}-post-${i + 1}`,
      masterBotId: bot.id,
      title,
      content,
      imageUrl:
        restaurant.imageUrl || `/images/restaurants/${restaurant.placeId}.jpg`,
      imageLocalPath: restaurant.imageUrl
        ? `public${restaurant.imageUrl}`
        : `public/images/restaurants/${restaurant.placeId}.jpg`,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        location: `${restaurant.city}, ${restaurant.country}`,
        rating: restaurant.rating,
        priceRange: restaurant.price,
        cuisine: restaurant.category,
        address: restaurant.address,
        description: restaurant.description,
        reviewsCount: restaurant.reviewsCount,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
      },
      tags: [
        restaurant.category,
        restaurant.city,
        restaurant.country,
        bot.specialties[0],
        postType,
      ].filter(Boolean),
      postType,
      createdAt: new Date().toISOString(),
    };

    posts.push(post);
  }

  console.log(`   ✅ Generated ${posts.length} posts`);
  return posts;
}

// Function to upload posts to Supabase
async function uploadPostsToSupabase(bot, posts) {
  console.log(`\n☁️  Uploading posts for ${bot.display_name} to Supabase...`);

  const processedPosts = [];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`   📝 Processing post ${i + 1}/${posts.length}: ${post.id}`);

    // Prepare post data for database (matching the actual schema)
    const postData = {
      master_bot_id: bot.id,
      title: post.title,
      content: post.content,
      image_url: post.imageUrl,
      image_storage_path: post.imageUrl
        ? `${bot.username}/${path.basename(post.imageLocalPath)}`
        : null,
      restaurant_id: post.restaurant.id,
      restaurant_name: post.restaurant.name,
      restaurant_location: post.restaurant.location,
      restaurant_rating: post.restaurant.rating,
      restaurant_price_range: post.restaurant.priceRange,
      restaurant_cuisine: post.restaurant.cuisine,
      tags: post.tags,
      personality_trait: bot.specialties[0],
      content_type: post.postType,
      is_published: true,
    };

    processedPosts.push(postData);
  }

  // Insert posts into database
  console.log(
    `   💾 Inserting ${processedPosts.length} posts into database...`
  );

  const { error: insertError } = await supabase
    .from("master_bot_posts")
    .insert(processedPosts);

  if (insertError) {
    console.error(
      `   ❌ Error inserting posts for ${bot.display_name}:`,
      insertError.message
    );
    return false;
  }

  console.log(
    `   ✅ Successfully inserted ${processedPosts.length} posts for ${bot.display_name}`
  );
  return true;
}

// Main function
async function completeRemainingBots() {
  console.log("🚀 Completing remaining master bots...");

  // Process each remaining master bot
  for (const bot of masterBots) {
    console.log(`\n🤖 Processing ${bot.display_name}...`);

    // Extract restaurant data
    const restaurantData = extractRestaurantData(bot);

    if (restaurantData.length === 0) {
      console.log(
        `   ⚠️  No restaurants found for ${bot.display_name}, skipping...`
      );
      continue;
    }

    // Save dataset to file
    const datasetPath = path.join(
      __dirname,
      `../public/masterbot-datasets/${bot.username}-data.json`
    );
    try {
      fs.writeFileSync(datasetPath, JSON.stringify(restaurantData, null, 2));
      console.log(`   💾 Saved dataset to ${datasetPath}`);
    } catch (error) {
      console.log(`   ⚠️  Could not save dataset: ${error.message}`);
    }

    // Generate posts
    const posts = generatePostsForBot(bot, restaurantData);

    // Save posts to file
    const postsPath = path.join(
      __dirname,
      `../public/masterbot-posts/${bot.username}-posts.json`
    );
    try {
      fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
      console.log(`   💾 Saved posts to ${postsPath}`);
    } catch (error) {
      console.log(`   ⚠️  Could not save posts: ${error.message}`);
    }

    // Upload to Supabase
    await uploadPostsToSupabase(bot, posts);
  }

  console.log("\n🎉 Remaining bots processing finished!");

  // Get final statistics
  const { data: finalPosts, error: statsError } = await supabase
    .from("master_bot_posts")
    .select("master_bot_id, restaurant_name");

  if (!statsError && finalPosts) {
    const stats = finalPosts.reduce((acc, post) => {
      acc[post.master_bot_id] = (acc[post.master_bot_id] || 0) + 1;
      return acc;
    }, {});

    console.log("\n📊 Final Statistics:");
    console.log(`   Total posts in database: ${finalPosts.length}`);
    console.log("   Posts by bot:", stats);
  }
}

// Run the script
completeRemainingBots().catch(console.error);
