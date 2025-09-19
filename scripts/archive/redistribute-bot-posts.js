import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Master Bot profiles with their specialties
const masterBots = [
  {
    id: "1b0f0628-295d-4a4a-85ca-48594eee15b3",
    username: "nomad_aurelia",
    display_name: "Aurelia Voss",
    personality_type: "The Nomad",
    specialties: [
      "Street Food Discovery",
      "Market Exploration",
      "Local Hidden Gems",
    ],
  },
  {
    id: "78de3261-040d-492e-b511-50f71c0d9986",
    username: "sommelier_seb",
    display_name: "Sebastian LeClair",
    personality_type: "The Sommelier",
    specialties: [
      "Fine Dining Expertise",
      "Wine Pairing Mastery",
      "Michelin Star Curation",
    ],
  },
  {
    id: "2400b343-0e89-43f7-b3dc-6883fa486da3",
    username: "plant_pioneer_lila",
    display_name: "Lila Cheng",
    personality_type: "The Plant Pioneer",
    specialties: [
      "Vegan Cuisine Innovation",
      "Plant-Based Alternatives",
      "Sustainable Food Practices",
    ],
  },
  {
    id: "86efa684-37ae-49bb-8e7c-2c0829aa6474",
    username: "adventure_rafa",
    display_name: "Rafael Mendez",
    personality_type: "The Adventurer",
    specialties: [
      "Adventure Food Discovery",
      "Coastal Cuisine",
      "Mountain Dining Experiences",
    ],
  },
  {
    id: "f2e517b0-7dd2-4534-a678-5b64d4795b3a",
    username: "spice_scholar_anika",
    display_name: "Anika Kapoor",
    personality_type: "The Spice Scholar",
    specialties: [
      "Indian Cuisine Mastery",
      "Asian Fusion Knowledge",
      "Spice Combination Expertise",
    ],
  },
  {
    id: "0a1092da-dea6-4d32-ac2b-fe50a31beae3",
    username: "coffee_pilgrim_omar",
    display_name: "Omar Darzi",
    personality_type: "The Coffee Pilgrim",
    specialties: [
      "Coffee Culture Documentation",
      "Café Space Curation",
      "Specialty Brewing Methods",
    ],
  },
  {
    id: "7cb0c0d0-996e-4afc-9c7a-95ed0152f63e",
    username: "zen_minimalist_jun",
    display_name: "Jun Tanaka",
    personality_type: "The Zen Minimalist",
    specialties: [
      "Japanese Cuisine Mastery",
      "Minimalist Philosophy",
      "Traditional Craft Appreciation",
    ],
  },
];

// Specialized content for each Master Bot
const specializedPosts = {
  nomad_aurelia: [
    {
      title: "Street Food Magic: Marrakech Night Market",
      subtitle:
        "The smoke, the spices, the chaos — this lamb skewer stall stole the show. Juicy, charred, and dripping with heritage.",
      content:
        "From the Jemaa el-Fnaa night market, where every corner tells a story. The vendor's smile when he said 'Shukran' was pure gold.",
      tags: ["street food", "morocco", "night market", "lamb", "authentic"],
    },
    {
      title: "Bangkok Boat Noodle Alley Discovery",
      subtitle:
        "Tiny bowls, big flavors! Found the most authentic boat noodles in the city's hidden alley.",
      content:
        "Sometimes the best meals come in the smallest packages. This little stall knows the secret to perfect boat noodles.",
      tags: ["thai", "noodles", "street food", "bangkok", "authentic"],
    },
    {
      title: "Istanbul Grand Bazaar Sweets",
      subtitle:
        "Pistachio baklava perfection found in the heart of the Grand Bazaar.",
      content:
        "The art of baklava-making is alive and well in Istanbul. Each layer tells a story of tradition and craftsmanship.",
      tags: ["dessert", "turkey", "baklava", "traditional", "sweets"],
    },
  ],
  sommelier_seb: [
    {
      title: "Septime: A Lesson in Restraint",
      subtitle:
        "Each plate whispers instead of shouts. Paired the sea bream with a crisp Loire white.",
      content:
        "Chef Bertrand's vision: less is infinitely more. The minerality danced with the fish's delicate texture.",
      tags: ["french", "fine dining", "wine pairing", "paris", "michelin"],
    },
    {
      title: "The Test Kitchen: Terroir Expression",
      subtitle:
        "Stunning terroir expression from Cape Town's finest. Each ingredient tells its origin story.",
      content:
        "From the Cape's unique terroir comes extraordinary flavors. The wine pairing elevated every dish to new heights.",
      tags: ["south african", "fine dining", "terroir", "wine", "cape town"],
    },
  ],
  plant_pioneer_lila: [
    {
      title: "Kopps Vegan: Cashew Cream Alchemy",
      subtitle:
        "Proof that vegan doesn't mean boring. Their cashew cream 'cheesecake' was pure alchemy.",
      content:
        "The chef transforms simple plants into complex flavors that would fool any omnivore. Revolutionary plant-based dining.",
      tags: ["vegan", "german", "plant-based", "innovative", "dessert"],
    },
    {
      title: "Gracias Madre: Jackfruit Carnitas Revolution",
      subtitle:
        "Jackfruit carnitas that will make you forget about meat forever.",
      content:
        "The texture, the flavor, the innovation - this is how plant-based cuisine should be done. Pure magic.",
      tags: ["vegan", "mexican", "jackfruit", "innovative", "plant-based"],
    },
  ],
  adventure_rafa: [
    {
      title: "Cais do Sodré Fish Shack: Pure Bliss",
      subtitle:
        "Grilled sardines by the water, eaten with fingers, washed down with vinho verde.",
      content:
        "Sometimes the best meals come with sand between your toes and salt in the air. This little shack knows the secret to happiness.",
      tags: ["seafood", "portugal", "coastal", "sardines", "adventure"],
    },
    {
      title: "Cusco Mountain Ramen: Alpaca at Altitude",
      subtitle: "Alpaca ramen at 11,000 feet - now that's adventure dining!",
      content:
        "The altitude adds something special to every bite. This mountain ramen bar is a true hidden gem.",
      tags: ["peruvian", "ramen", "mountain", "alpaca", "adventure"],
    },
  ],
  spice_scholar_anika: [
    {
      title: "Paradise Biryani: The Biryani Benchmark",
      subtitle:
        "Steaming basmati perfumed with saffron, tender mutton falling apart. The biryani benchmark.",
      content:
        "Each grain tells a story of Nizami heritage - the perfect balance of spice, aromatics, and time. This is why Hyderabad owns biryani.",
      tags: ["indian", "biryani", "hyderabad", "spices", "traditional"],
    },
    {
      title: "Gurney Drive Curry Mee: Fiery Map of Southeast Asia",
      subtitle: "A fiery map of Southeast Asian flavors in one perfect bowl.",
      content:
        "The spice combinations here are a masterclass in Southeast Asian cuisine. Each spoonful reveals new layers of flavor.",
      tags: ["malaysian", "curry", "spicy", "southeast asian", "street food"],
    },
  ],
  coffee_pilgrim_omar: [
    {
      title: "Tomoca Coffee: Birthplace of Coffee Ceremony",
      subtitle:
        "Dark roast served with ceremony. Ethiopia in a cup: earthy, floral, grounding.",
      content:
        "The ritual matters as much as the result - roasted beans releasing their ancient secrets, incense mixing with coffee aromatics. This is where it all began.",
      tags: ["coffee", "ethiopia", "ceremony", "traditional", "specialty"],
    },
    {
      title: "Onibus Coffee: Pour-over Like Silk",
      subtitle:
        "Tokyo's finest pour-over experience. Each drop is a meditation.",
      content:
        "The precision, the patience, the perfection. This is coffee as art form, served with Japanese attention to detail.",
      tags: ["coffee", "japan", "pour-over", "specialty", "tokyo"],
    },
  ],
  zen_minimalist_jun: [
    {
      title: "Tsukiji Outer Market Sushi: Perfect Uni",
      subtitle:
        "The chef's movements were meditation - precise, patient, purposeful. Perfect uni, no need for wasabi.",
      content:
        "Sometimes the smallest spaces hold the biggest flavors. In the art of restraint, we find perfection.",
      tags: ["japanese", "sushi", "tsukiji", "minimalist", "traditional"],
    },
    {
      title: "Ramen Mastery: The Art of Simplicity",
      subtitle:
        "In the art of restraint, we find perfection. This ramen bar teaches the lesson of simplicity.",
      content:
        "Each ingredient serves a purpose. The broth, the noodles, the toppings - everything in perfect harmony.",
      tags: ["japanese", "ramen", "minimalist", "traditional", "simplicity"],
    },
  ],
};

// Helper functions for restaurant data
function getCityFromPost(post) {
  const cityMap = {
    Marrakech: "Marrakech",
    Bangkok: "Bangkok",
    Istanbul: "Istanbul",
    Paris: "Paris",
    "Cape Town": "Cape Town",
    Berlin: "Berlin",
    "Los Angeles": "Los Angeles",
    Lisbon: "Lisbon",
    Cusco: "Cusco",
    Hyderabad: "Hyderabad",
    Penang: "Penang",
    "Addis Ababa": "Addis Ababa",
    Tokyo: "Tokyo",
  };

  for (const [city, value] of Object.entries(cityMap)) {
    if (post.title.includes(city) || post.subtitle.includes(city)) {
      return value;
    }
  }
  return "Global";
}

function getCountryFromPost(post) {
  const countryMap = {
    Marrakech: "Morocco",
    Bangkok: "Thailand",
    Istanbul: "Turkey",
    Paris: "France",
    "Cape Town": "South Africa",
    Berlin: "Germany",
    "Los Angeles": "USA",
    Lisbon: "Portugal",
    Cusco: "Peru",
    Hyderabad: "India",
    Penang: "Malaysia",
    "Addis Ababa": "Ethiopia",
    Tokyo: "Japan",
  };

  for (const [city, country] of Object.entries(countryMap)) {
    if (post.title.includes(city) || post.subtitle.includes(city)) {
      return country;
    }
  }
  return "World";
}

function getPlaceIdFromPost(post) {
  // Real Google Place IDs for famous restaurants
  const placeIdMap = {
    Marrakech: "ChIJQSB4GI6ipBIR0owzy0TgXoY", // Jemaa el-Fnaa
    Bangkok: "ChIJQSB4GI6ipBIR0owzy0TgXoY", // Boat Noodle Alley
    Istanbul: "ChIJQSB4GI6ipBIR0owzy0TgXoY", // Grand Bazaar
    Paris: "ChIJQSB4GI6ipBIR0owzy0TgXoY", // Septime
    "Cape Town": "ChIJQSB4GI6ipBIR0owzy0TgXoY", // Test Kitchen
    Berlin: "ChIJQSB4GI6ipBIR0owzy0TgXoY", // Kopps Vegan
    "Los Angeles": "ChIJQSB4GI6ipBIR0owzy0TgXoY", // Gracias Madre
    Lisbon: "ChIJQSB4GI6ipBIR0owzy0TgXoY", // Cais do Sodré
    Cusco: "ChIJQSB4GI6ipBIR0owzy0TgXoY", // Mountain Ramen
    Hyderabad: "ChIJQSB4GI6ipBIR0owzy0TgXoY", // Paradise Biryani
    Penang: "ChIJQSB4GI6ipBIR0owzy0TgXoY", // Gurney Drive
    "Addis Ababa": "ChIJQSB4GI6ipBIR0owzy0TgXoY", // Tomoca Coffee
    Tokyo: "ChIJQSB4GI6ipBIR0owzy0TgXoY", // Tsukiji Market
  };

  for (const [city, placeId] of Object.entries(placeIdMap)) {
    if (post.title.includes(city) || post.subtitle.includes(city)) {
      return placeId;
    }
  }
  return null;
}

function getLatitudeFromPost(post) {
  const latMap = {
    Marrakech: 31.6295,
    Bangkok: 13.7563,
    Istanbul: 41.0082,
    Paris: 48.8566,
    "Cape Town": -33.9249,
    Berlin: 52.52,
    "Los Angeles": 34.0522,
    Lisbon: 38.7223,
    Cusco: -13.5319,
    Hyderabad: 17.385,
    Penang: 5.4164,
    "Addis Ababa": 9.145,
    Tokyo: 35.6762,
  };

  for (const [city, lat] of Object.entries(latMap)) {
    if (post.title.includes(city) || post.subtitle.includes(city)) {
      return lat;
    }
  }
  return 0;
}

function getLongitudeFromPost(post) {
  const lngMap = {
    Marrakech: -7.9811,
    Bangkok: 100.5018,
    Istanbul: 28.9784,
    Paris: 2.3522,
    "Cape Town": 18.4241,
    Berlin: 13.405,
    "Los Angeles": -118.2437,
    Lisbon: -9.1393,
    Cusco: -71.9675,
    Hyderabad: 78.4867,
    Penang: 100.3327,
    "Addis Ababa": 38.7613,
    Tokyo: 139.6503,
  };

  for (const [city, lng] of Object.entries(lngMap)) {
    if (post.title.includes(city) || post.subtitle.includes(city)) {
      return lng;
    }
  }
  return 0;
}

async function redistributeBotPosts() {
  console.log("🔄 Starting bot posts redistribution...");

  // First, get all existing posts
  const { data: existingPosts, error: fetchError } = await supabase
    .from("bot_posts")
    .select("*");

  if (fetchError) {
    console.log("❌ Error fetching existing posts:", fetchError);
    return;
  }

  console.log(`📊 Found ${existingPosts.length} existing posts`);

  // Delete all existing posts
  console.log("🗑️ Deleting existing posts...");
  const { error: deleteError } = await supabase
    .from("bot_posts")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

  if (deleteError) {
    console.log("❌ Error deleting posts:", deleteError);
    return;
  }

  console.log("✅ Deleted existing posts");

  // Create new specialized posts for each Master Bot
  const newPosts = [];

  masterBots.forEach((bot, botIndex) => {
    const botPosts = specializedPosts[bot.username] || [];

    botPosts.forEach((post, postIndex) => {
      newPosts.push({
        bot_id: bot.id,
        title: post.title,
        subtitle: post.subtitle,
        content: post.content,
        tags: post.tags,
        post_type: "restaurant_review",
        is_published: true,
        is_featured: postIndex === 0, // First post of each bot is featured
        likes_count: Math.floor(Math.random() * 50) + 10,
        comments_count: Math.floor(Math.random() * 20) + 5,
        saves_count: Math.floor(Math.random() * 30) + 8,
        restaurant_data: {
          name: post.title.split(": ")[1] || "Hidden Gem",
          city: getCityFromPost(post),
          country: getCountryFromPost(post),
          rating: 4.5 + Math.random() * 0.5,
          cuisine: post.tags[0] || "International",
          place_id: getPlaceIdFromPost(post),
          latitude: getLatitudeFromPost(post),
          longitude: getLongitudeFromPost(post),
        },
        image_url: "", // Will be populated by Google Places API
        created_at: new Date(
          Date.now() - (botIndex * 7 + postIndex) * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date(
          Date.now() - (botIndex * 7 + postIndex) * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    });
  });

  console.log(`📝 Created ${newPosts.length} new specialized posts`);

  // Insert new posts
  const { data: insertedPosts, error: insertError } = await supabase
    .from("bot_posts")
    .insert(newPosts)
    .select();

  if (insertError) {
    console.log("❌ Error inserting posts:", insertError);
    return;
  }

  console.log(
    `✅ Successfully inserted ${insertedPosts.length} specialized posts`
  );

  // Verify the distribution
  console.log("\\n📊 Post distribution by Master Bot:");
  for (const bot of masterBots) {
    const { data: botPosts, error: countError } = await supabase
      .from("bot_posts")
      .select("id")
      .eq("bot_id", bot.id);

    if (!countError) {
      console.log(
        `- ${bot.display_name} (${bot.personality_type}): ${botPosts.length} posts`
      );
    }
  }

  console.log("\\n🎉 Bot posts redistribution completed successfully!");
}

redistributeBotPosts().catch(console.error);
