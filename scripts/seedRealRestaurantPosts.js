/**
 * Real Restaurant Posts Seeder
 * Creates Master Bot posts using actual restaurant data from MasterBotBucket2.json
 */

import { getPlaceHeroUrl, staticMapFallback } from "@/src/lib/google/places.js";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Main function
async function seedRealRestaurantPosts() {
  // Load environment variables
  config({ path: ".env.local" });

  const SUPABASE_URL =
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const GOOGLE_MAPS_API_KEY =
    process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing Supabase environment variables");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

  function generateGooglePlacesPhotoUrl(restaurant, photoIndex = 0) {
    // A real implementation requires fetching photo_reference from Place Details API
    // This is a placeholder for what the URL structure would be.
    const photoReferencePlaceholder = `PHOTO_REF_FOR_${restaurant.placeId}_${photoIndex}`;
    if (GOOGLE_MAPS_API_KEY) {
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoReferencePlaceholder}&key=${GOOGLE_MAPS_API_KEY}`;
    }

    // Fallback to a more specific Unsplash search for relevant images
    const category = (restaurant.categories?.[0] || "food").split(" ")[0];
    return `https://source.unsplash.com/800x600/?${category},food`;
  }

  // Load restaurant data from MasterBotBucket2.json
  function loadRestaurantData() {
    const filePath = path.join(
      process.cwd(),
      "public",
      "MasterBotBucket2.json"
    );
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  }

  // Filter restaurants by bot specialty
  function filterRestaurantsForBot(restaurants, bot) {
    return restaurants.filter((restaurant) => {
      const categories = (restaurant.categories || []).map((c) =>
        c.toLowerCase()
      );
      const description = (restaurant.description || "").toLowerCase();
      const title = (restaurant.title || "").toLowerCase();

      // Check if restaurant matches bot's specialty
      const matchesSpecialty = bot.specialties.some((specialty) => {
        switch (specialty) {
          case "street_food":
            return categories.some(
              (c) =>
                c.includes("street") ||
                c.includes("food truck") ||
                c.includes("hawker") ||
                c.includes("market")
            );
          case "fine_dining":
            return categories.some(
              (c) =>
                c.includes("fine dining") ||
                c.includes("michelin") ||
                c.includes("tasting menu") ||
                c.includes("degustation")
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
              description.includes("beachside") ||
              description.includes("adventure")
            );
          case "indian_cuisine":
            return categories.some(
              (c) =>
                c.includes("indian") ||
                c.includes("curry") ||
                c.includes("spice") ||
                c.includes("biryani")
            );
          case "coffee_culture":
            return categories.some(
              (c) =>
                c.includes("coffee") ||
                c.includes("cafe") ||
                c.includes("roastery") ||
                c.includes("espresso")
            );
          case "japanese_cuisine":
            return categories.some(
              (c) =>
                c.includes("japanese") ||
                c.includes("sushi") ||
                c.includes("ramen") ||
                c.includes("izakaya")
            );
          default:
            return true;
        }
      });

      // Check price preference
      const priceMatch =
        bot.personality === "expert_mentor"
          ? restaurant.price === "$$$" || restaurant.price === "$$$$"
          : bot.personality === "adventurous_explorer"
          ? restaurant.price === "$" || restaurant.price === "$$"
          : true;

      return matchesSpecialty && priceMatch;
    });
  }

  // Generate content based on bot personality
  function generateBotContent(bot, restaurant) {
    const baseTags = [
      (restaurant.price || "$").toLowerCase(),
      (restaurant.city || "unknown").toLowerCase().replace(" ", "-"),
      ...(restaurant.categories || [])
        .slice(0, 2)
        .map((c) => c.toLowerCase().replace(" ", "-")),
    ];

    switch (bot.personality) {
      case "adventurous_explorer": // Aurelia Voss
        return {
          title: `Hidden Gem: ${restaurant.title}`,
          subtitle: `Authentic ${(
            restaurant.categoryName || "restaurant"
          ).toLowerCase()} in ${
            restaurant.neighborhood || restaurant.city || "the area"
          }...`,
          content: `Just discovered this incredible ${(
            restaurant.categoryName || "restaurant"
          ).toLowerCase()}! The atmosphere here is exactly what I look for - authentic, bustling, and full of local character. The ${(
            restaurant.description || "food"
          )
            .split(",")[0]
            .toLowerCase()} is pure magic, each bite telling a story of tradition and culture. Perfect for when you want to experience the real ${
            restaurant.city || "local"
          } food scene.`,
          tags: [...baseTags, "hidden-gem", "authentic", "local-discovery"],
        };

      case "expert_mentor": // Sebastian LeClair
        return {
          title: `Exquisite: ${restaurant.title}`,
          subtitle: `A ${restaurant.price} establishment showcasing refined technique...`,
          content: `An extraordinary dining experience at ${
            restaurant.title
          }. The attention to detail in every dish demonstrates the chef's mastery of technique and understanding of quality ingredients. The ${(
            restaurant.description || "cuisine"
          )
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
          } has mastered the art of creating innovative dishes that celebrate vegetables and plant proteins. The creativity in their approach to ${(
            restaurant.description || "plant-based cuisine"
          )
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
            restaurant.neighborhood || restaurant.city || "the area"
          } and it's exactly what I needed! The ${(
            restaurant.description || "food"
          )
            .split(",")[0]
            .toLowerCase()} here hits different when you're in adventure mode. Great energy, perfect location, and food that fuels your next exploration. Sometimes the best meals come with a side of discovery!`,
          tags: [
            ...baseTags,
            "adventure",
            "energetic",
            "exploration",
            "fuel-up",
          ],
        };

      case "knowledgeable_traditional": // Anika Kapoor
        return {
          title: `Spice Mastery: ${restaurant.title}`,
          subtitle: `Authentic ${restaurant.categoryName.toLowerCase()} with traditional techniques...`,
          content: `The spice combinations at ${
            restaurant.title
          } are a masterclass in traditional cooking. Each dish showcases the perfect balance of flavors that only comes from generations of culinary wisdom. The ${(
            restaurant.description || "cuisine"
          )
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
          } understands this philosophy - each dish is a meditation on simplicity and quality. The ${(
            restaurant.description || "cuisine"
          )
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
          subtitle: `${
            (restaurant.description || "Great food").split(",")[0]
          } in ${restaurant.city || "the area"}`,
          content: `Discovered this amazing ${(
            restaurant.categoryName || "restaurant"
          ).toLowerCase()} and had to share! The quality and atmosphere here are exactly what I look for. Perfect for anyone who appreciates good food and great experiences.`,
          tags: baseTags,
        };
    }
  }

  try {
    console.log("🚀 Starting Real Restaurant Posts Seeding...");

    // Load restaurant data
    console.log("📊 Loading restaurant data from MasterBotBucket2.json...");
    const restaurants = loadRestaurantData();
    console.log(`✅ Loaded ${restaurants.length} restaurants`);

    let totalPosts = 0;

    // Generate posts for each master bot
    for (let botIndex = 0; botIndex < MASTER_BOTS.length; botIndex++) {
      const bot = MASTER_BOTS[botIndex];
      console.log(`\n🤖 Generating posts for ${bot.display_name}...`);

      // Filter restaurants for this bot
      const botRestaurants = filterRestaurantsForBot(restaurants, bot);
      console.log(`   Found ${botRestaurants.length} matching restaurants`);

      // Select 5 restaurants with some randomization to ensure diversity
      const shuffled = [...botRestaurants].sort(() => Math.random() - 0.5);
      const selectedRestaurants = shuffled.slice(0, 5);

      // Generate posts
      for (let i = 0; i < selectedRestaurants.length; i++) {
        const restaurant = selectedRestaurants[i];
        const content = generateBotContent(bot, restaurant);

        // Fetch hero image from Google Places API
        const hero = await getPlaceHeroUrl(restaurant.placeId).catch(
          () => null
        );
        let heroUrl = hero?.url ?? null;
        if (!heroUrl && restaurant.location?.lat && restaurant.location?.lng) {
          heroUrl = staticMapFallback(
            restaurant.location.lat,
            restaurant.location.lng
          );
        }
        const attributions = hero?.attributions ?? [];

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
            priceLevel: (restaurant.price || "$").length,
            website: restaurant.website || "",
            phone: restaurant.phone || "",
            coords: restaurant.location,
            googleUrl: `https://maps.google.com/?cid=${restaurant.placeId}`,
            categories: restaurant.categories,
            description: restaurant.description,
            photoAttributions: attributions, // Add attributions to payload
          },
          restaurant_place_id: restaurant.placeId,
          image_url: heroUrl,
          hero_url: heroUrl,
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

    console.log(`\n🎉 Real Restaurant Posts Seeding Complete!`);
    console.log(`📊 Generated ${totalPosts} total posts`);
  } catch (error) {
    console.error("❌ Error seeding real restaurant posts:", error);
    throw error;
  }
}

// Run the script
seedRealRestaurantPosts()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
