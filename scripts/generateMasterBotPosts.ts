/**
 * Master Bot Posts Generator
 * Creates 7 posts per Master Bot based on their personalities and restaurant data
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Master Bot personalities and specialties
const MASTER_BOTS = [
  {
    id: "550e8400-e29b-41d4-a716-446655440010",
    username: "nomad_aurelia",
    display_name: "Aurelia Voss",
    personality: "adventurous_explorer",
    specialties: ["street_food", "hidden_gems", "cultural_exploration"],
    voice:
      "Poetic and immersive, focuses on sensory details and cultural connections",
    content_style: "Storytelling with deep cultural context and family history",
    favorite_cuisines: [
      "street_food",
      "southeast_asian",
      "middle_eastern",
      "north_african",
    ],
    price_preference: "budget",
    atmosphere: ["bustling", "authentic", "local", "open_air"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440011",
    username: "chef_sophia",
    display_name: "Chef Sophia",
    personality: "expert_mentor",
    specialties: ["fine_dining", "cooking_techniques", "wine_pairing"],
    voice:
      "Sophisticated analysis with technical wine knowledge and artistic appreciation",
    content_style:
      "Technical expertise combined with passion for terroir and local ingredients",
    favorite_cuisines: ["french", "italian", "mediterranean", "contemporary"],
    price_preference: "luxury",
    atmosphere: ["elegant", "intimate", "sophisticated", "quiet"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440012",
    username: "street_samurai",
    display_name: "Street Food Samurai",
    personality: "adventurous_explorer",
    specialties: ["street_food", "authentic_local", "hidden_gems"],
    voice: "Educational and passionate about culinary history and technique",
    content_style:
      "Deep cultural knowledge with focus on ingredients and tradition",
    favorite_cuisines: ["japanese", "korean", "vietnamese", "thai"],
    price_preference: "budget",
    atmosphere: ["traditional", "authentic", "bustling", "local"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440013",
    username: "plantbased_lila",
    display_name: "Lila Cheng",
    personality: "passionate_innovator",
    specialties: [
      "vegan_cuisine",
      "plant_based_alternatives",
      "sustainable_dining",
    ],
    voice:
      "Enthusiastic about plant-based innovation, educational yet approachable",
    content_style:
      "Bridges tradition with innovation, passionate about accessibility",
    favorite_cuisines: [
      "vegan",
      "plant_based",
      "mediterranean",
      "asian_fusion",
    ],
    price_preference: "affordable",
    atmosphere: ["modern", "health_conscious", "sustainable", "creative"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440014",
    username: "rafa_eats",
    display_name: "Rafael Mendez",
    personality: "adventurous_energetic",
    specialties: ["adventure_food", "coastal_cuisine", "mountain_dining"],
    voice: "Casual and energetic, emphasizes the adventure and experience",
    content_style:
      "Enthusiastic about unique locations and physical challenges",
    favorite_cuisines: ["seafood", "latin_american", "fusion", "coastal"],
    price_preference: "budget",
    atmosphere: ["outdoor", "casual", "adventure", "beachside"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440015",
    username: "spice_scholar",
    display_name: "Anika Kapoor",
    personality: "knowledgeable_traditional",
    specialties: ["indian_cuisine", "asian_fusion", "spice_combinations"],
    voice: "Educational and passionate about culinary history and technique",
    content_style:
      "Deep cultural knowledge with focus on ingredients and tradition",
    favorite_cuisines: ["indian", "southeast_asian", "thai", "malaysian"],
    price_preference: "budget",
    atmosphere: ["traditional", "authentic", "bustling", "local"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440016",
    username: "coffee_pilgrim",
    display_name: "Omar Darzi",
    personality: "contemplative_detail_oriented",
    specialties: ["coffee_culture", "cafe_curation", "specialty_brewing"],
    voice: "Reverent and meditative, focuses on ritual and origin stories",
    content_style:
      "Philosophical approach with attention to brewing craft and space design",
    favorite_cuisines: ["coffee", "pastries", "light_bites", "desserts"],
    price_preference: "affordable",
    atmosphere: ["quiet", "minimal", "cozy", "artistic"],
  },
];

// Restaurant data structure from MasterBotBucket2.json
interface Restaurant {
  title: string;
  description: string;
  price: string;
  categoryName: string;
  address: string;
  neighborhood: string;
  city: string;
  countryCode: string;
  website: string;
  phone: string;
  location: { lat: number; lng: number };
  totalScore: number;
  placeId: string;
  categories: string[];
  reviewsCount: number;
  imagesCount: number;
}

// Load restaurant data
function loadRestaurantData(): Restaurant[] {
  const filePath = path.join(process.cwd(), "public", "MasterBotBucket2.json");
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

// Filter restaurants by bot specialty
function filterRestaurantsForBot(
  restaurants: Restaurant[],
  bot: any
): Restaurant[] {
  return restaurants.filter((restaurant) => {
    const categories = restaurant.categories.map((c) => c.toLowerCase());
    const description = restaurant.description.toLowerCase();
    const title = restaurant.title.toLowerCase();

    // Check if restaurant matches bot's specialty
    const matchesSpecialty = bot.specialties.some((specialty: string) => {
      switch (specialty) {
        case "street_food":
          return categories.some(
            (c) =>
              c.includes("street") ||
              c.includes("food truck") ||
              c.includes("hawker")
          );
        case "fine_dining":
          return categories.some(
            (c) =>
              c.includes("fine dining") ||
              c.includes("michelin") ||
              c.includes("tasting menu")
          );
        case "vegan_cuisine":
          return (
            categories.some(
              (c) => c.includes("vegan") || c.includes("vegetarian")
            ) ||
            description.includes("vegan") ||
            description.includes("plant-based")
          );
        case "adventure_food":
          return (
            categories.some(
              (c) =>
                c.includes("outdoor") ||
                c.includes("beach") ||
                c.includes("mountain")
            ) ||
            description.includes("outdoor") ||
            description.includes("beachside")
          );
        case "indian_cuisine":
          return categories.some(
            (c) =>
              c.includes("indian") || c.includes("curry") || c.includes("spice")
          );
        case "coffee_culture":
          return categories.some(
            (c) =>
              c.includes("coffee") ||
              c.includes("cafe") ||
              c.includes("roastery")
          );
        default:
          return true;
      }
    });

    // Check price preference
    const priceMatch =
      bot.price_preference === "budget"
        ? restaurant.price === "$" || restaurant.price === "$$"
        : bot.price_preference === "luxury"
        ? restaurant.price === "$$$" || restaurant.price === "$$$$"
        : true;

    // Check cuisine match
    const cuisineMatch = bot.favorite_cuisines.some((cuisine: string) =>
      categories.some((c) => c.includes(cuisine.replace("_", " ")))
    );

    return matchesSpecialty && priceMatch && (cuisineMatch || matchesSpecialty);
  });
}

// Generate AI-powered content for each bot
function generateBotContent(
  bot: any,
  restaurant: Restaurant
): {
  title: string;
  subtitle: string;
  content: string;
  tags: string[];
} {
  const baseTags = [
    restaurant.price.toLowerCase(),
    restaurant.city.toLowerCase().replace(" ", "-"),
    ...restaurant.categories
      .slice(0, 3)
      .map((c) => c.toLowerCase().replace(" ", "-")),
  ];

  switch (bot.personality) {
    case "adventurous_explorer": // Aurelia Voss
      return {
        title: `Hidden Gem: ${restaurant.title}`,
        subtitle: `Authentic ${restaurant.categoryName.toLowerCase()} in ${
          restaurant.neighborhood
        }...`,
        content: `Just discovered this incredible ${restaurant.categoryName.toLowerCase()}! The ${restaurant.description
          .split(",")[0]
          .toLowerCase()} here is pure magic - each bite tells a story of tradition and local culture. The atmosphere is exactly what I look for: authentic, bustling, and full of life. Perfect for when you want to experience the real ${
          restaurant.city
        } food scene.`,
        tags: [...baseTags, "hidden-gem", "authentic", "local-discovery"],
      };

    case "expert_mentor": // Chef Sophia
      return {
        title: `Exquisite: ${restaurant.title}`,
        subtitle: `A ${restaurant.price} establishment showcasing refined technique...`,
        content: `An extraordinary dining experience at ${
          restaurant.title
        }. The attention to detail in every dish demonstrates the chef's mastery of technique and understanding of quality ingredients. The ${restaurant.description
          .split(",")[0]
          .toLowerCase()} is particularly noteworthy - perfectly executed with sophisticated presentation. This is how fine dining should be done.`,
        tags: [
          ...baseTags,
          "fine-dining",
          "sophisticated",
          "technique-focused",
        ],
      };

    case "passionate_innovator": // Lila Cheng
      return {
        title: `Plant-Based Innovation: ${restaurant.title}`,
        subtitle: `Where traditional flavors meet sustainable dining...`,
        content: `Proof that plant-based doesn't mean boring! ${
          restaurant.title
        } has mastered the art of creating innovative dishes that celebrate vegetables and plant proteins. The creativity in their approach to ${restaurant.description
          .split(",")[0]
          .toLowerCase()} is truly inspiring. Every dish tells a story of sustainability and flavor innovation.`,
        tags: [
          ...baseTags,
          "plant-based",
          "sustainable",
          "innovative",
          "vegan-friendly",
        ],
      };

    case "adventurous_energetic": // Rafael Mendez
      return {
        title: `Adventure Find: ${restaurant.title}`,
        subtitle: `Perfect fuel for your next ${restaurant.neighborhood} adventure...`,
        content: `Found this spot while exploring ${
          restaurant.neighborhood
        } and it's exactly what I needed! The ${restaurant.description
          .split(",")[0]
          .toLowerCase()} here hits different when you're in adventure mode. Great energy, perfect location, and food that fuels your next exploration. Sometimes the best meals come with a side of discovery!`,
        tags: [...baseTags, "adventure", "energetic", "exploration", "fuel-up"],
      };

    case "knowledgeable_traditional": // Anika Kapoor
      return {
        title: `Spice Mastery: ${restaurant.title}`,
        subtitle: `Authentic ${restaurant.categoryName.toLowerCase()} with traditional techniques...`,
        content: `The spice combinations at ${
          restaurant.title
        } are a masterclass in traditional cooking. Each dish showcases the perfect balance of flavors that only comes from generations of culinary wisdom. The ${restaurant.description
          .split(",")[0]
          .toLowerCase()} here represents the true essence of authentic cuisine. This is how traditional food should taste.`,
        tags: [
          ...baseTags,
          "traditional",
          "spices",
          "authentic",
          "cultural-heritage",
        ],
      };

    case "contemplative_detail_oriented": // Omar Darzi
      return {
        title: `Coffee Ritual: ${restaurant.title}`,
        subtitle: `Where every cup tells a story of craft and culture...`,
        content: `The coffee experience at ${restaurant.title} is pure meditation. The attention to brewing technique and bean selection creates something truly special. Each cup is a moment of pause in our busy world - a reminder that the best things in life are worth savoring slowly. This is coffee culture at its finest.`,
        tags: [...baseTags, "coffee", "craft", "meditation", "culture"],
      };

    default:
      return {
        title: `${bot.display_name} recommends: ${restaurant.title}`,
        subtitle: `${restaurant.description.split(",")[0]} in ${
          restaurant.city
        }`,
        content: `Discovered this amazing ${restaurant.categoryName.toLowerCase()} and had to share! The quality and atmosphere here are exactly what I look for. Perfect for anyone who appreciates good food and great experiences.`,
        tags: baseTags,
      };
  }
}

// Main function to generate and insert posts
async function generateMasterBotPosts() {
  try {
    console.log("🚀 Starting Master Bot Posts Generation...");

    // Load restaurant data
    console.log("📊 Loading restaurant data...");
    const restaurants = loadRestaurantData();
    console.log(`✅ Loaded ${restaurants.length} restaurants`);

    // Generate posts for each master bot
    for (const bot of MASTER_BOTS) {
      console.log(`\n🤖 Generating posts for ${bot.display_name}...`);

      // Filter restaurants for this bot
      const botRestaurants = filterRestaurantsForBot(restaurants, bot);
      console.log(`   Found ${botRestaurants.length} matching restaurants`);

      // Select 7 restaurants (or fewer if not enough available)
      const selectedRestaurants = botRestaurants.slice(0, 7);

      // Generate posts
      for (let i = 0; i < selectedRestaurants.length; i++) {
        const restaurant = selectedRestaurants[i];
        const content = generateBotContent(bot, restaurant);

        // Create post data
        const postData = {
          id: `post_${bot.id}_${i + 1}_${Date.now()}`,
          user_id: bot.id,
          bot_id: bot.id,
          restaurant_id: restaurant.placeId,
          title: content.title,
          subtitle: content.subtitle,
          content: content.content,
          hero_url: `https://images.unsplash.com/photo-${
            1579584425555 + i
          }?w=800&h=600&fit=crop`,
          images: [
            `https://images.unsplash.com/photo-${
              1579584425555 + i
            }?w=800&h=600&fit=crop`,
          ],
          kind: "restaurant",
          payload: {
            placeId: restaurant.placeId,
            name: restaurant.title,
            address: restaurant.address,
            rating: restaurant.totalScore,
            reviewsCount: restaurant.reviewsCount,
            priceLevel: restaurant.price.length,
            website: restaurant.website,
            phone: restaurant.phone,
            coords: restaurant.location,
            googleUrl: `https://maps.google.com/?cid=${restaurant.placeId}`,
          },
          tags: content.tags,
          visibility: "public",
          is_featured: i < 2, // First 2 posts are featured
          posted_at: new Date(
            Date.now() - i * 2 * 60 * 60 * 1000
          ).toISOString(), // Stagger posts
          created_at: new Date().toISOString(),
        };

        // Insert post into database
        const { error } = await supabase.from("posts").insert(postData);

        if (error) {
          console.error(`   ❌ Error inserting post ${i + 1}:`, error.message);
        } else {
          console.log(`   ✅ Created post ${i + 1}: ${content.title}`);
        }
      }
    }

    console.log("\n🎉 Master Bot Posts Generation Complete!");
    console.log(`📊 Generated ${MASTER_BOTS.length * 7} total posts`);
  } catch (error) {
    console.error("❌ Error generating Master Bot posts:", error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  generateMasterBotPosts()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

export { generateMasterBotPosts };
