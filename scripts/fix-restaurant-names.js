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

// Load the original Google Places data
const googlePlacesData = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../public/MasterBotBucket2.json"),
    "utf8"
  )
);

// Create a map of restaurant IDs to actual restaurant data
const restaurantMap = new Map();
googlePlacesData.forEach((place) => {
  if (place.placeId) {
    restaurantMap.set(place.placeId, {
      name: place.title,
      location: `${place.city}, ${place.countryCode}`,
      rating: place.totalScore || 4.5,
      price_level:
        place.price === "$$$"
          ? 3
          : place.price === "$$"
          ? 2
          : place.price === "$"
          ? 1
          : 2,
      types: place.categories || [],
    });
  }
});

// Function to get price range from price level
function getPriceRange(priceLevel) {
  switch (priceLevel) {
    case 0:
      return "Free";
    case 1:
      return "$";
    case 2:
      return "$$";
    case 3:
      return "$$$";
    case 4:
      return "$$$$";
    default:
      return "$$$";
  }
}

// Function to get cuisine type from types array
function getCuisineType(types) {
  const cuisineKeywords = [
    "restaurant",
    "food",
    "meal_takeaway",
    "meal_delivery",
    "cafe",
    "bakery",
    "bar",
    "night_club",
  ];

  const cuisineTypes = types.filter((type) =>
    cuisineKeywords.some((keyword) => type.includes(keyword))
  );

  if (cuisineTypes.length > 0) {
    return cuisineTypes[0]
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  return "Restaurant";
}

// Function to replace placeholders in content
function replacePlaceholders(content, restaurantData) {
  const replacements = {
    "{cuisine}": getCuisineType(restaurantData.types),
    "{dish}": "amazing dish",
    "{spice}": "perfect spice",
    "{technique}": "carefully prepare",
    "{adjective}": "incredible",
    "{location}": restaurantData.location.split(",")[0], // Just the city
    "{restaurant}": restaurantData.name,
    "{region}": restaurantData.location.split(",")[1]?.trim() || "this region",
    "{city}": restaurantData.location.split(",")[0],
    "{country}":
      restaurantData.location.split(",")[1]?.trim() || "this country",
    "{flavor}": "incredible flavor",
    "{texture}": "perfect texture",
    "{aroma}": "amazing aroma",
    "{experience}": "unforgettable experience",
    "{atmosphere}": "wonderful atmosphere",
    "{presentation}": "beautiful presentation",
    "{ingredient}": "fresh ingredient",
    "{recipe}": "traditional recipe",
    "{chef}": "talented chef",
    "{kitchen}": "professional kitchen",
    "{culture}": "local culture",
    "{age}": "wise",
    "{time}": "perfect timing",
    "{secret}": "secret technique",
    "{method}": "traditional method",
    "{way}": "authentic way",
    "{style}": "unique style",
    "{touch}": "personal touch",
    "{art}": "culinary art",
    "{passion}": "true passion",
    "{love}": "genuine love",
    "{soul}": "soulful",
    "{heart}": "heartfelt",
    "{spirit}": "authentic spirit",
    "{tradition}": "time-honored tradition",
    "{heritage}": "rich heritage",
    "{legacy}": "culinary legacy",
    "{wisdom}": "ancient wisdom",
    "{knowledge}": "deep knowledge",
    "{skill}": "masterful skill",
    "{craft}": "artisanal craft",
    "{magic}": "culinary magic",
    "{wonder}": "pure wonder",
    "{delight}": "pure delight",
    "{joy}": "pure joy",
    "{bliss}": "culinary bliss",
    "{perfection}": "absolute perfection",
    "{excellence}": "unmatched excellence",
    "{mastery}": "true mastery",
    "{genius}": "culinary genius",
    "{brilliance}": "pure brilliance",
    "{elegance}": "refined elegance",
    "{sophistication}": "true sophistication",
    "{refinement}": "perfect refinement",
    "{polish}": "impeccable polish",
    "{finesse}": "delicate finesse",
    "{grace}": "effortless grace",
    "{harmony}": "perfect harmony",
    "{balance}": "perfect balance",
    "{rhythm}": "natural rhythm",
    "{flow}": "smooth flow",
    "{energy}": "vibrant energy",
    "{vibe}": "amazing vibe",
    "{feeling}": "wonderful feeling",
    "{emotion}": "deep emotion",
    "{memory}": "cherished memory",
    "{moment}": "perfect moment",
    "{time}": "special time",
    "{occasion}": "special occasion",
    "{celebration}": "true celebration",
    "{festival}": "culinary festival",
    "{feast}": "magnificent feast",
    "{banquet}": "royal banquet",
    "{spread}": "incredible spread",
    "{selection}": "amazing selection",
    "{variety}": "incredible variety",
    "{diversity}": "wonderful diversity",
    "{range}": "impressive range",
    "{spectrum}": "full spectrum",
    "{palette}": "rich palette",
    "{canvas}": "culinary canvas",
    "{masterpiece}": "true masterpiece",
    "{creation}": "artistic creation",
    "{work}": "culinary work",
    "{piece}": "perfect piece",
    "{gem}": "hidden gem",
    "{treasure}": "culinary treasure",
    "{jewel}": "precious jewel",
    "{pearl}": "rare pearl",
    "{diamond}": "brilliant diamond",
    "{gold}": "pure gold",
    "{silver}": "shining silver",
    "{bronze}": "warm bronze",
    "{platinum}": "premium platinum",
    "{crown}": "royal crown",
    "{throne}": "culinary throne",
    "{kingdom}": "flavor kingdom",
    "{empire}": "taste empire",
    "{realm}": "culinary realm",
    "{world}": "flavor world",
    "{universe}": "taste universe",
    "{galaxy}": "flavor galaxy",
    "{cosmos}": "culinary cosmos",
    "{infinity}": "infinite possibilities",
    "{eternity}": "eternal delight",
    "{forever}": "forever memorable",
    "{always}": "always amazing",
    "{never}": "never forget",
    "{ever}": "ever since",
    "{since}": "since forever",
    "{until}": "until the end",
    "{beyond}": "beyond compare",
    "{above}": "above all",
    "{below}": "below the surface",
    "{within}": "within reach",
    "{without}": "without equal",
    "{inside}": "inside out",
    "{outside}": "outside the box",
    "{around}": "all around",
    "{through}": "through and through",
    "{across}": "across the board",
    "{over}": "over the top",
    "{under}": "under the radar",
    "{between}": "between the lines",
    "{among}": "among the best",
    "{within}": "within reach",
    "{beyond}": "beyond compare",
    "{above}": "above all",
    "{below}": "below the surface",
    "{inside}": "inside out",
    "{outside}": "outside the box",
    "{around}": "all around",
    "{through}": "through and through",
    "{across}": "across the board",
    "{over}": "over the top",
    "{under}": "under the radar",
    "{between}": "between the lines",
    "{among}": "among the best",
  };

  let updatedContent = content;
  Object.entries(replacements).forEach(([placeholder, replacement]) => {
    updatedContent = updatedContent.replace(
      new RegExp(placeholder, "g"),
      replacement
    );
  });

  return updatedContent;
}

// Function to update posts with real restaurant data
async function updatePostsWithRealData() {
  console.log("🔍 Fetching posts from database...");

  const { data: posts, error: fetchError } = await supabase
    .from("master_bot_posts")
    .select("*")
    .limit(100); // Process in batches

  if (fetchError) {
    console.error("❌ Error fetching posts:", fetchError);
    return;
  }

  console.log(`📝 Found ${posts.length} posts to update`);

  const updates = [];
  let updatedCount = 0;

  for (const post of posts) {
    // Check if the post has placeholder content that needs updating
    const hasPlaceholders =
      post.title.includes("{") || post.content.includes("{");
    console.log(`Post ${post.id}: has placeholders = ${hasPlaceholders}`);

    if (hasPlaceholders) {
      // Try to find a real restaurant from our Google Places data
      const restaurantIds = Array.from(restaurantMap.keys());
      console.log(`Found ${restaurantIds.length} restaurants in map`);

      const randomRestaurantId =
        restaurantIds[Math.floor(Math.random() * restaurantIds.length)];
      const restaurantData = restaurantMap.get(randomRestaurantId);

      console.log(`Selected restaurant: ${restaurantData?.name}`);

      if (restaurantData) {
        const updatedTitle = replacePlaceholders(post.title, restaurantData);
        const updatedContent = replacePlaceholders(
          post.content,
          restaurantData
        );

        updates.push({
          id: post.id,
          title: updatedTitle,
          content: updatedContent,
          restaurant_id: randomRestaurantId,
          restaurant_name: restaurantData.name,
          restaurant_location: restaurantData.location,
          restaurant_rating: restaurantData.rating,
          restaurant_price_range: getPriceRange(restaurantData.price_level),
          restaurant_cuisine: getCuisineType(restaurantData.types),
        });

        updatedCount++;
        console.log(`Added to updates: ${restaurantData.name}`);
      }
    }
  }

  console.log(`🔄 Updating ${updates.length} posts...`);

  // Update posts in batches
  const batchSize = 10;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);

    for (const update of batch) {
      const { error: updateError } = await supabase
        .from("master_bot_posts")
        .update({
          title: update.title,
          content: update.content,
          restaurant_id: update.restaurant_id,
          restaurant_name: update.restaurant_name,
          restaurant_location: update.restaurant_location,
          restaurant_rating: update.restaurant_rating,
          restaurant_price_range: update.restaurant_price_range,
          restaurant_cuisine: update.restaurant_cuisine,
        })
        .eq("id", update.id);

      if (updateError) {
        console.error(
          `❌ Error updating post ${update.id}:`,
          updateError.message
        );
      } else {
        console.log(`✅ Updated post: ${update.restaurant_name}`);
      }
    }
  }

  console.log(
    `🎉 Successfully updated ${updatedCount} posts with real restaurant data!`
  );
}

// Run the update
updatePostsWithRealData().catch(console.error);
