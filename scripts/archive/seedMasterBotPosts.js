/**
 * Quick Master Bot Posts Seeder
 * Creates sample posts for each Master Bot using the restaurant data
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_MAPS_API_KEY =
  process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Generate Google Maps photo URL
function generateGoogleMapsPhotoUrl(placeId, photoIndex = 0) {
  if (!GOOGLE_MAPS_API_KEY) {
    // Fallback to Unsplash if no Google Maps API key
    return `https://images.unsplash.com/photo-${
      1579584425555 + photoIndex
    }?w=800&h=600&fit=crop`;
  }

  // Google Maps Places API photo URL format
  // Note: This requires a photo_reference from the Places API, but we can use a generic approach
  // For now, we'll use a placeholder that could be replaced with actual photo references
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=PLACEHOLDER&key=${GOOGLE_MAPS_API_KEY}`;
}

// Alternative: Use Google Street View or a more generic approach
function generateRestaurantImageUrl(restaurant, photoIndex = 0) {
  // Try to use Google Street View if coordinates are available
  if (
    restaurant.location &&
    restaurant.location.lat &&
    restaurant.location.lng
  ) {
    const { lat, lng } = restaurant.location;
    const heading = (photoIndex * 90) % 360; // Rotate view for different photos
    return `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${lat},${lng}&heading=${heading}&pitch=0&key=${
      GOOGLE_MAPS_API_KEY || "YOUR_API_KEY"
    }`;
  }

  // Fallback to Unsplash with food-related search
  const foodKeywords = ["restaurant", "food", "dining", "cuisine", "kitchen"];
  const keyword = foodKeywords[photoIndex % foodKeywords.length];
  return `https://images.unsplash.com/photo-${
    1579584425555 + photoIndex
  }?w=800&h=600&fit=crop&q=80`;
}

// Master Bot personalities (using actual IDs from database)
const MASTER_BOTS = [
  {
    id: "1b0f0628-295d-4a4a-85ca-48594eee15b3",
    username: "nomad_aurelia",
    display_name: "Aurelia Voss",
    personality: "adventurous_explorer",
    specialties: ["street_food", "hidden_gems", "cultural_exploration"],
  },
  {
    id: "78de3261-040d-492e-b511-50f71c0d9986",
    username: "som_sebastian",
    display_name: "Sebastian LeClair",
    personality: "expert_mentor",
    specialties: ["fine_dining", "cooking_techniques", "wine_pairing"],
  },
  {
    id: "2400b343-0e89-43f7-b3dc-6883fa486da3",
    username: "plantbased_lila",
    display_name: "Lila Cheng",
    personality: "passionate_innovator",
    specialties: [
      "vegan_cuisine",
      "plant_based_alternatives",
      "sustainable_dining",
    ],
  },
  {
    id: "86efa684-37ae-49bb-8e7c-2c0829aa6474",
    username: "rafa_eats",
    display_name: "Rafael Mendez",
    personality: "adventurous_energetic",
    specialties: ["adventure_food", "coastal_cuisine", "mountain_dining"],
  },
  {
    id: "f2e517b0-7dd2-4534-a678-5b64d4795b3a",
    username: "spice_scholar",
    display_name: "Anika Kapoor",
    personality: "knowledgeable_traditional",
    specialties: ["indian_cuisine", "asian_fusion", "spice_combinations"],
  },
  {
    id: "0a1092da-dea6-4d32-ac2b-fe50a31beae3",
    username: "coffee_pilgrim",
    display_name: "Omar Darzi",
    personality: "contemplative_detail_oriented",
    specialties: ["coffee_culture", "cafe_curation", "specialty_brewing"],
  },
  {
    id: "7cb0c0d0-996e-4afc-9c7a-95ed0152f63e",
    username: "minimal_jun",
    display_name: "Jun Tanaka",
    personality: "minimalist_philosophical",
    specialties: [
      "japanese_cuisine",
      "minimalist_philosophy",
      "traditional_craft",
    ],
  },
];

// Sample restaurants for each bot specialty
const SAMPLE_RESTAURANTS = [
  // Street Food / Hidden Gems
  {
    title: "Bangkok Street Kitchen",
    description:
      "Authentic Thai street food with traditional recipes passed down through generations",
    price: "$",
    categoryName: "Thai restaurant",
    address: "123 Market St, Bangkok, Thailand",
    city: "Bangkok",
    countryCode: "TH",
    placeId: "ChIJBangkok_Street_1",
    totalScore: 4.6,
    reviewsCount: 1247,
    location: { lat: 13.7563, lng: 100.5018 },
    categories: ["Thai restaurant", "Street food", "Authentic Thai"],
  },
  {
    title: "Marrakech Night Market",
    description:
      "Traditional Moroccan street food in a bustling market atmosphere",
    price: "$",
    categoryName: "Moroccan restaurant",
    address: "Jemaa el-Fnaa, Marrakech, Morocco",
    city: "Marrakech",
    countryCode: "MA",
    placeId: "ChIJMarrakech_Market_1",
    totalScore: 4.8,
    reviewsCount: 2156,
    location: { lat: 31.6258, lng: -7.9891 },
    categories: ["Moroccan restaurant", "Street food", "Night market"],
  },
  // Fine Dining
  {
    title: "Le Bernardin",
    description:
      "Michelin-starred seafood restaurant with exceptional wine pairings",
    price: "$$$$",
    categoryName: "Fine dining restaurant",
    address: "155 W 51st St, New York, NY 10019",
    city: "New York",
    countryCode: "US",
    placeId: "ChIJLe_Bernardin_NYC",
    totalScore: 4.9,
    reviewsCount: 3421,
    location: { lat: 40.7614, lng: -73.9776 },
    categories: ["Fine dining", "Seafood restaurant", "Michelin star"],
  },
  {
    title: "Septime",
    description:
      "Contemporary French cuisine with innovative techniques and local ingredients",
    price: "$$$",
    categoryName: "French restaurant",
    address: "80 Rue de Charonne, 75011 Paris, France",
    city: "Paris",
    countryCode: "FR",
    placeId: "ChIJSeptime_Paris_1",
    totalScore: 4.7,
    reviewsCount: 1892,
    location: { lat: 48.8566, lng: 2.3522 },
    categories: ["French restaurant", "Contemporary", "Fine dining"],
  },
  // Vegan/Plant-based
  {
    title: "Gracias Madre",
    description:
      "Plant-based Mexican cuisine with innovative vegan alternatives",
    price: "$$",
    categoryName: "Vegan restaurant",
    address: "8905 Melrose Ave, West Hollywood, CA 90069",
    city: "Los Angeles",
    countryCode: "US",
    placeId: "ChIJGracias_Madre_LA",
    totalScore: 4.5,
    reviewsCount: 1876,
    location: { lat: 34.0736, lng: -118.4004 },
    categories: ["Vegan restaurant", "Mexican cuisine", "Plant-based"],
  },
  {
    title: "Kopps Vegan",
    description: "Creative plant-based dishes with a focus on sustainability",
    price: "$$",
    categoryName: "Vegan restaurant",
    address: "Linienstraße 94, 10115 Berlin, Germany",
    city: "Berlin",
    countryCode: "DE",
    placeId: "ChIJKopps_Vegan_Berlin",
    totalScore: 4.4,
    reviewsCount: 1234,
    location: { lat: 52.52, lng: 13.405 },
    categories: ["Vegan restaurant", "Sustainable", "Creative cuisine"],
  },
  // Adventure/Coastal
  {
    title: "Cais do Sodré Fish Shack",
    description:
      "Fresh seafood by the water with traditional Portuguese flavors",
    price: "$$",
    categoryName: "Seafood restaurant",
    address: "Cais do Sodré, 1200-001 Lisboa, Portugal",
    city: "Lisbon",
    countryCode: "PT",
    placeId: "ChIJCais_Sodre_Lisbon",
    totalScore: 4.6,
    reviewsCount: 987,
    location: { lat: 38.7223, lng: -9.1393 },
    categories: ["Seafood restaurant", "Portuguese", "Waterfront"],
  },
  // Indian/Spice
  {
    title: "Paradise Biryani",
    description:
      "Authentic Hyderabadi biryani with traditional spice combinations",
    price: "$$",
    categoryName: "Indian restaurant",
    address: "Shop 1-2, Ground Floor, Paradise Circle, Secunderabad",
    city: "Hyderabad",
    countryCode: "IN",
    placeId: "ChIJParadise_Biryani_Hyderabad",
    totalScore: 4.8,
    reviewsCount: 3456,
    location: { lat: 17.385, lng: 78.4867 },
    categories: ["Indian restaurant", "Biryani", "Hyderabadi cuisine"],
  },
  // Coffee Culture
  {
    title: "Blue Bottle Coffee",
    description:
      "Specialty coffee with meticulous brewing techniques and minimalist design",
    price: "$$",
    categoryName: "Coffee shop",
    address: "66 Mint St, New York, NY 10038",
    city: "New York",
    countryCode: "US",
    placeId: "ChIJBlue_Bottle_NYC",
    totalScore: 4.3,
    reviewsCount: 2156,
    location: { lat: 40.7074, lng: -74.0113 },
    categories: ["Coffee shop", "Specialty coffee", "Minimalist"],
  },
];

// Generate content based on bot personality
function generateBotContent(bot, restaurant) {
  const baseTags = [
    restaurant.price.toLowerCase(),
    restaurant.city.toLowerCase().replace(" ", "-"),
    ...restaurant.categories
      .slice(0, 2)
      .map((c) => c.toLowerCase().replace(" ", "-")),
  ];

  switch (bot.personality) {
    case "adventurous_explorer": // Aurelia Voss & Street Food Samurai
      return {
        title: `Hidden Gem: ${restaurant.title}`,
        subtitle: `Authentic ${restaurant.categoryName.toLowerCase()} in ${
          restaurant.city
        }...`,
        content: `Just discovered this incredible ${restaurant.categoryName.toLowerCase()}! The atmosphere here is exactly what I look for - authentic, bustling, and full of local character. The ${restaurant.description
          .split(",")[0]
          .toLowerCase()} is pure magic, each bite telling a story of tradition and culture. Perfect for when you want to experience the real ${
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
        subtitle: `Perfect fuel for your next ${restaurant.city} adventure...`,
        content: `Found this spot while exploring ${
          restaurant.city
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

    case "minimalist_philosophical": // Jun Tanaka
      return {
        title: `Zen Dining: ${restaurant.title}`,
        subtitle: `Where simplicity reveals the essence of flavor...`,
        content: `In the art of restraint, we find perfection. ${
          restaurant.title
        } understands this philosophy - each dish is a meditation on simplicity and quality. The ${restaurant.description
          .split(",")[0]
          .toLowerCase()} here represents the true essence of mindful dining. Sometimes the smallest spaces hold the biggest flavors.`,
        tags: [
          ...baseTags,
          "minimalist",
          "zen",
          "philosophical",
          "traditional",
        ],
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

// Main function
async function seedMasterBotPosts() {
  try {
    console.log("🚀 Starting Master Bot Posts Seeding...");

    let totalPosts = 0;

    // Generate posts for each master bot
    for (let botIndex = 0; botIndex < MASTER_BOTS.length; botIndex++) {
      const bot = MASTER_BOTS[botIndex];
      console.log(`\n🤖 Generating posts for ${bot.display_name}...`);

      // Select restaurants for this bot (cycling through sample restaurants)
      const restaurantsForBot = SAMPLE_RESTAURANTS.slice(
        botIndex,
        botIndex + 3
      );

      // Generate 3 posts per bot
      for (let i = 0; i < restaurantsForBot.length; i++) {
        const restaurant = restaurantsForBot[i];
        const content = generateBotContent(bot, restaurant);

        // Create post data
        const postData = {
          bot_id: bot.id,
          title: content.title,
          subtitle: content.subtitle,
          content: content.content,
          restaurant_data: {
            placeId: restaurant.placeId,
            name: restaurant.title,
            address: restaurant.address,
            rating: restaurant.totalScore,
            reviewsCount: restaurant.reviewsCount,
            priceLevel: restaurant.price.length,
            website: restaurant.website || "",
            phone: restaurant.phone || "",
            coords: restaurant.location,
            googleUrl: `https://maps.google.com/?cid=${restaurant.placeId}`,
          },
          restaurant_place_id: restaurant.placeId,
          image_url: generateRestaurantImageUrl(restaurant, i),
          hero_url: generateRestaurantImageUrl(restaurant, i),
          tags: content.tags,
          post_type: "restaurant_review",
          kind: "restaurant",
          cta_label: "View Restaurant",
          cta_url: `https://maps.google.com/?cid=${restaurant.placeId}`,
          is_featured: i === 0, // First post is featured
          is_published: true,
          published_at: new Date(
            Date.now() - i * 2 * 60 * 60 * 1000
          ).toISOString(),
        };

        // Insert post into database
        const { error } = await supabase.from("bot_posts").insert(postData);

        if (error) {
          console.error(`   ❌ Error inserting post ${i + 1}:`, error.message);
        } else {
          console.log(`   ✅ Created post ${i + 1}: ${content.title}`);
          totalPosts++;
        }
      }
    }

    console.log(`\n🎉 Master Bot Posts Seeding Complete!`);
    console.log(`📊 Generated ${totalPosts} total posts`);
  } catch (error) {
    console.error("❌ Error seeding Master Bot posts:", error);
    throw error;
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  seedMasterBotPosts()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

export { seedMasterBotPosts };
