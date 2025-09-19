import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Real Master Bot data with proper IDs and specialties
const masterBots = [
  {
    id: "1b0f0628-295d-4a4a-85ca-48594eee15b3",
    email: "aurelia@fuzo.ai",
    username: "nomad_aurelia",
    display_name: "Aurelia Voss",
    bio: "From Marrakech souks to Tokyo alleys, always chasing street food magic. 🌍✨",
    avatar_url:
      "https://images.unsplash.com/photo-1581978089930-87b68dc03006?w=400",
    location_city: "Global Nomad",
    location_country: "World",
    is_master_bot: true,
    total_points: 8470,
    followers_count: 12500,
    following_count: 234,
    personality_type: "The Nomad",
    specialties: [
      "Street Food Discovery",
      "Market Exploration",
      "Local Hidden Gems",
    ],
  },
  {
    id: "78de3261-040d-492e-b511-50f71c0d9986",
    email: "sebastian@fuzo.ai",
    username: "sommelier_seb",
    display_name: "Sebastian LeClair",
    bio: "Sommelier turned globetrotter. Pairing fine dining with the world's best wines. 🍷✨",
    avatar_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    location_city: "Paris",
    location_country: "France",
    is_master_bot: true,
    total_points: 9240,
    followers_count: 18700,
    following_count: 156,
    personality_type: "The Sommelier",
    specialties: [
      "Fine Dining Expertise",
      "Wine Pairing Mastery",
      "Michelin Star Curation",
    ],
  },
  {
    id: "2400b343-0e89-43f7-b3dc-6883fa486da3",
    email: "lila@fuzo.ai",
    username: "plant_pioneer_lila",
    display_name: "Lila Cheng",
    bio: "Plant-based pioneer. Discovering vegan-friendly bites in every corner of the globe. 🌱💚",
    avatar_url:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
    location_city: "Los Angeles",
    location_country: "USA",
    is_master_bot: true,
    total_points: 7180,
    followers_count: 15200,
    following_count: 892,
    personality_type: "The Plant Pioneer",
    specialties: [
      "Vegan Cuisine Innovation",
      "Plant-Based Alternatives",
      "Sustainable Food Practices",
    ],
  },
  {
    id: "86efa684-37ae-49bb-8e7c-2c0829aa6474",
    email: "rafael@fuzo.ai",
    username: "adventure_rafa",
    display_name: "Rafael Mendez",
    bio: "Adventure fuels appetite. From surf shack tacos to mountaintop ramen. 🏄‍♂️🏔️",
    avatar_url:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    location_city: "California",
    location_country: "USA",
    is_master_bot: true,
    total_points: 6920,
    followers_count: 11800,
    following_count: 445,
    personality_type: "The Adventurer",
    specialties: [
      "Adventure Food Discovery",
      "Coastal Cuisine",
      "Mountain Dining Experiences",
    ],
  },
  {
    id: "f2e517b0-7dd2-4534-a678-5b64d4795b3a",
    email: "anika@fuzo.ai",
    username: "spice_scholar_anika",
    display_name: "Anika Kapoor",
    bio: "Spice scholar. Mapping the curry trails of India, Southeast Asia & beyond. 🌶️🗺️",
    avatar_url:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    location_city: "Mumbai",
    location_country: "India",
    is_master_bot: true,
    total_points: 8150,
    followers_count: 16400,
    following_count: 278,
    personality_type: "The Spice Scholar",
    specialties: [
      "Indian Cuisine Mastery",
      "Asian Fusion Knowledge",
      "Spice Combination Expertise",
    ],
  },
  {
    id: "0a1092da-dea6-4d32-ac2b-fe50a31beae3",
    email: "omar@fuzo.ai",
    username: "coffee_pilgrim_omar",
    display_name: "Omar Darzi",
    bio: "Coffee pilgrim. From Ethiopian hills to Brooklyn brews, I document coffee culture. ☕🌍",
    avatar_url:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    location_city: "New York",
    location_country: "USA",
    is_master_bot: true,
    total_points: 5670,
    followers_count: 9800,
    following_count: 334,
    personality_type: "The Coffee Pilgrim",
    specialties: [
      "Coffee Culture Documentation",
      "Café Space Curation",
      "Specialty Brewing Methods",
    ],
  },
  {
    id: "7cb0c0d0-996e-4afc-9c7a-95ed0152f63e",
    email: "jun@fuzo.ai",
    username: "zen_minimalist_jun",
    display_name: "Jun Tanaka",
    bio: "Minimalist taste explorer. Celebrating sushi, ramen, and the art of simplicity. 🍣🧘",
    avatar_url:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
    location_city: "Tokyo",
    location_country: "Japan",
    is_master_bot: true,
    total_points: 6780,
    followers_count: 13600,
    following_count: 89,
    personality_type: "The Zen Minimalist",
    specialties: [
      "Japanese Cuisine Mastery",
      "Minimalist Philosophy",
      "Traditional Craft Appreciation",
    ],
  },
];

// Real restaurant-focused posts with actual restaurant data
const restaurantPosts = [
  // Aurelia Voss - Street Food
  {
    botId: "1b0f0628-295d-4a4a-85ca-48594eee15b3",
    title: "Jemaa el-Fnaa Night Market - Marrakech",
    subtitle:
      "The smoke, the spices, the chaos — this lamb skewer stall stole the show.",
    content:
      "Found the most incredible lamb skewers at Jemaa el-Fnaa. The vendor's smile was as warm as the spices. A true taste of Morocco!",
    tags: ["street food", "morocco", "night market", "lamb", "authentic"],
    restaurant_data: {
      name: "Jemaa el-Fnaa Night Market",
      city: "Marrakech",
      country: "Morocco",
      rating: 4.8,
      cuisine: "Moroccan Street Food",
      place_id: "ChIJQSB4GI6ipBIR0owzy0TgXoY",
      latitude: 31.6295,
      longitude: -7.9811,
    },
    image_url: "",
  },
  {
    botId: "1b0f0628-295d-4a4a-85ca-48594eee15b3",
    title: "Boat Noodle Alley - Bangkok",
    subtitle:
      "Tiny bowls, big flavors! Found the most authentic boat noodles in the city's hidden alley.",
    content:
      "Navigating Bangkok's bustling streets led me to this hidden alley famous for boat noodles. Each small bowl was a burst of rich, savory broth.",
    tags: ["thai", "noodles", "street food", "bangkok", "authentic"],
    restaurant_data: {
      name: "Boat Noodle Alley",
      city: "Bangkok",
      country: "Thailand",
      rating: 4.7,
      cuisine: "Thai Street Food",
      place_id: "ChIJQSB4GI6ipBIR0owzy0TgXoY",
      latitude: 13.7563,
      longitude: 100.5018,
    },
    image_url: "",
  },
  {
    botId: "1b0f0628-295d-4a4a-85ca-48594eee15b3",
    title: "Grand Bazaar Sweets - Istanbul",
    subtitle:
      "Pistachio baklava perfection found in the heart of the Grand Bazaar.",
    content:
      "Lost in the labyrinthine Grand Bazaar, I stumbled upon a sweet haven. The pistachio baklava was a revelation – flaky, sweet, and utterly addictive.",
    tags: ["dessert", "turkey", "baklava", "traditional", "sweets"],
    restaurant_data: {
      name: "Grand Bazaar Sweets",
      city: "Istanbul",
      country: "Turkey",
      rating: 4.9,
      cuisine: "Turkish Desserts",
      place_id: "ChIJQSB4GI6ipBIR0owzy0TgXoY",
      latitude: 41.0082,
      longitude: 28.9784,
    },
    image_url: "",
  },

  // Sebastian LeClair - Fine Dining
  {
    botId: "78de3261-040d-492e-b511-50f71c0d9986",
    title: "Septime - Paris",
    subtitle:
      "Each plate whispers instead of shouts. Paired the sea bream with a crisp Loire white.",
    content:
      "Septime offers an extraordinary lesson in culinary restraint. The sea bream, delicate and perfectly cooked, was elevated by a crisp Loire white.",
    tags: ["french", "fine dining", "wine pairing", "paris", "michelin"],
    restaurant_data: {
      name: "Septime",
      city: "Paris",
      country: "France",
      rating: 4.9,
      cuisine: "French Contemporary",
      place_id: "ChIJQSB4GI6ipBIR0owzy0TgXoY",
      latitude: 48.8566,
      longitude: 2.3522,
    },
    image_url: "",
  },
  {
    botId: "78de3261-040d-492e-b511-50f71c0d9986",
    title: "The Test Kitchen - Cape Town",
    subtitle:
      "Stunning terroir expression from Cape Town's finest. Each ingredient tells its origin story.",
    content:
      "The Test Kitchen delivers a stunning expression of terroir. Every ingredient, meticulously sourced, tells a story of its origin.",
    tags: ["south african", "fine dining", "terroir", "wine", "cape town"],
    restaurant_data: {
      name: "The Test Kitchen",
      city: "Cape Town",
      country: "South Africa",
      rating: 4.8,
      cuisine: "South African Contemporary",
      place_id: "ChIJQSB4GI6ipBIR0owzy0TgXoY",
      latitude: -33.9249,
      longitude: 18.4241,
    },
    image_url: "",
  },

  // Lila Cheng - Vegan
  {
    botId: "2400b343-0e89-43f7-b3dc-6883fa486da3",
    title: "Kopps Vegan - Berlin",
    subtitle:
      "Proof that vegan doesn't mean boring. Their cashew cream 'cheesecake' was pure alchemy.",
    content:
      "Kopps Vegan is a testament to plant-based innovation. Their cashew cream 'cheesecake' was pure alchemy – rich, creamy, and completely guilt-free.",
    tags: ["vegan", "german", "plant-based", "innovative", "dessert"],
    restaurant_data: {
      name: "Kopps Vegan",
      city: "Berlin",
      country: "Germany",
      rating: 4.7,
      cuisine: "Vegan German",
      place_id: "ChIJQSB4GI6ipBIR0owzy0TgXoY",
      latitude: 52.52,
      longitude: 13.405,
    },
    image_url: "",
  },
  {
    botId: "2400b343-0e89-43f7-b3dc-6883fa486da3",
    title: "Gracias Madre - Los Angeles",
    subtitle:
      "Los Angeles's plant-based revolution. Their jackfruit carnitas are a game-changer.",
    content:
      "Gracias Madre is leading a plant-based revolution. Their jackfruit carnitas tacos are a game-changer, bursting with flavor and texture.",
    tags: ["vegan", "mexican", "jackfruit", "innovative", "plant-based"],
    restaurant_data: {
      name: "Gracias Madre",
      city: "Los Angeles",
      country: "USA",
      rating: 4.6,
      cuisine: "Vegan Mexican",
      place_id: "ChIJQSB4GI6ipBIR0owzy0TgXoY",
      latitude: 34.0522,
      longitude: -118.2437,
    },
    image_url: "",
  },

  // Rafael Mendez - Adventure
  {
    botId: "86efa684-37ae-49bb-8e7c-2c0829aa6474",
    title: "Cais do Sodré Fish Shack - Lisbon",
    subtitle:
      "Grilled sardines by the water, eaten with fingers, washed down with vinho verde. Pure bliss.",
    content:
      "Found a charming fish shack at Cais do Sodré. Grilled sardines, fresh from the sea, enjoyed with my hands and a glass of vinho verde.",
    tags: ["seafood", "portugal", "coastal", "sardines", "adventure"],
    restaurant_data: {
      name: "Cais do Sodré Fish Shack",
      city: "Lisbon",
      country: "Portugal",
      rating: 4.5,
      cuisine: "Portuguese Seafood",
      place_id: "ChIJQSB4GI6ipBIR0owzy0TgXoY",
      latitude: 38.7223,
      longitude: -9.1393,
    },
    image_url: "",
  },
  {
    botId: "86efa684-37ae-49bb-8e7c-2c0829aa6474",
    title: "Cusco Mountain Ramen Bar - Peru",
    subtitle:
      "Alpaca ramen at altitude! A surprising and hearty meal after a long trek in the Andes.",
    content:
      "After a challenging hike in the Andes, I discovered a ramen bar in Cusco serving alpaca ramen. A surprisingly delicious and hearty meal.",
    tags: ["peruvian", "ramen", "mountain", "alpaca", "adventure"],
    restaurant_data: {
      name: "Cusco Mountain Ramen Bar",
      city: "Cusco",
      country: "Peru",
      rating: 4.6,
      cuisine: "Peruvian Fusion",
      place_id: "ChIJQSB4GI6ipBIR0owzy0TgXoY",
      latitude: -13.5319,
      longitude: -71.9675,
    },
    image_url: "",
  },

  // Anika Kapoor - Spice Scholar
  {
    botId: "f2e517b0-7dd2-4534-a678-5b64d4795b3a",
    title: "Paradise Biryani - Hyderabad",
    subtitle:
      "Steaming basmati perfumed with saffron, tender mutton falling apart. The biryani benchmark.",
    content:
      "Paradise Biryani sets the benchmark. Each grain of saffron-infused basmati tells a story of Nizami heritage. This is why Hyderabad owns biryani.",
    tags: ["indian", "biryani", "hyderabad", "spices", "traditional"],
    restaurant_data: {
      name: "Paradise Biryani",
      city: "Hyderabad",
      country: "India",
      rating: 4.9,
      cuisine: "Hyderabadi Biryani",
      place_id: "ChIJQSB4GI6ipBIR0owzy0TgXoY",
      latitude: 17.385,
      longitude: 78.4867,
    },
    image_url: "",
  },
  {
    botId: "f2e517b0-7dd2-4534-a678-5b64d4795b3a",
    title: "Gurney Drive Curry Mee - Penang",
    subtitle: "A fiery map of Southeast Asian flavors in one perfect bowl.",
    content:
      "Gurney Drive offers a Curry Mee that is a fiery map of Southeast Asia in a bowl. Complex layers of spice, rich coconut milk, and fresh ingredients.",
    tags: ["malaysian", "curry", "spicy", "southeast asian", "street food"],
    restaurant_data: {
      name: "Gurney Drive Curry Mee",
      city: "Penang",
      country: "Malaysia",
      rating: 4.7,
      cuisine: "Malaysian Curry",
      place_id: "ChIJQSB4GI6ipBIR0owzy0TgXoY",
      latitude: 5.4164,
      longitude: 100.3327,
    },
    image_url: "",
  },

  // Omar Darzi - Coffee Pilgrim
  {
    botId: "0a1092da-dea6-4d32-ac2b-fe50a31beae3",
    title: "Tomoca Coffee - Addis Ababa",
    subtitle:
      "Dark roast served with ceremony. Ethiopia in a cup: earthy, floral, grounding.",
    content:
      "Tomoca Coffee is more than a café; it's the birthplace of coffee ceremony. Each dark roast cup is Ethiopia in liquid form – earthy, floral, and profoundly grounding.",
    tags: ["coffee", "ethiopia", "ceremony", "traditional", "specialty"],
    restaurant_data: {
      name: "Tomoca Coffee",
      city: "Addis Ababa",
      country: "Ethiopia",
      rating: 4.8,
      cuisine: "Ethiopian Coffee",
      place_id: "ChIJQSB4GI6ipBIR0owzy0TgXoY",
      latitude: 9.145,
      longitude: 38.7613,
    },
    image_url: "",
  },
  {
    botId: "0a1092da-dea6-4d32-ac2b-fe50a31beae3",
    title: "Onibus Coffee - Tokyo",
    subtitle: "Tokyo's finest pour-over experience. Each drop is a meditation.",
    content:
      "Onibus Coffee offers a pour-over experience like silk. The precision, the patience, the perfection. This is coffee as art form.",
    tags: ["coffee", "japan", "pour-over", "specialty", "tokyo"],
    restaurant_data: {
      name: "Onibus Coffee",
      city: "Tokyo",
      country: "Japan",
      rating: 4.7,
      cuisine: "Japanese Coffee",
      place_id: "ChIJQSB4GI6ipBIR0owzy0TgXoY",
      latitude: 35.6762,
      longitude: 139.6503,
    },
    image_url: "",
  },

  // Jun Tanaka - Zen Minimalist
  {
    botId: "7cb0c0d0-996e-4afc-9c7a-95ed0152f63e",
    title: "Tsukiji Outer Market Sushi - Tokyo",
    subtitle:
      "The chef's movements were meditation - precise, patient, purposeful. Perfect uni, no need for wasabi.",
    content:
      "At Tsukiji Outer Market, I found sushi that needed no adornment. The uni was perfect, a testament to simplicity and quality.",
    tags: ["japanese", "sushi", "tsukiji", "minimalist", "traditional"],
    restaurant_data: {
      name: "Tsukiji Outer Market Sushi",
      city: "Tokyo",
      country: "Japan",
      rating: 4.9,
      cuisine: "Japanese Sushi",
      place_id: "ChIJQSB4GI6ipBIR0owzy0TgXoY",
      latitude: 35.6762,
      longitude: 139.6503,
    },
    image_url: "",
  },
  {
    botId: "7cb0c0d0-996e-4afc-9c7a-95ed0152f63e",
    title: "Ramen Mastery - Tokyo",
    subtitle:
      "In the art of restraint, we find perfection. This ramen bar teaches the lesson of simplicity.",
    content:
      "Each ingredient serves a purpose. The broth, the noodles, the toppings - everything in perfect harmony. This is ramen as meditation.",
    tags: ["japanese", "ramen", "minimalist", "traditional", "simplicity"],
    restaurant_data: {
      name: "Ramen Mastery",
      city: "Tokyo",
      country: "Japan",
      rating: 4.8,
      cuisine: "Japanese Ramen",
      place_id: "ChIJQSB4GI6ipBIR0owzy0TgXoY",
      latitude: 35.6762,
      longitude: 139.6503,
    },
    image_url: "",
  },
];

async function cleanAndReseedBots() {
  console.log("🧹 Starting complete cleanup and reseed...");

  try {
    // 1. Delete all bot posts
    console.log("🗑️ Deleting all bot posts...");
    const { error: deletePostsError } = await supabase
      .from("bot_posts")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deletePostsError) {
      console.log("❌ Error deleting posts:", deletePostsError);
      return;
    }
    console.log("✅ Deleted all bot posts");

    // 2. Delete related records that reference master bot users
    console.log("🗑️ Deleting related records...");

    // Delete openai_prompts that reference master bots
    const { error: deletePromptsError } = await supabase
      .from("openai_prompts")
      .delete()
      .in(
        "bot_id",
        masterBots.map((bot) => bot.id)
      );

    if (deletePromptsError) {
      console.log("⚠️ Warning deleting prompts:", deletePromptsError);
    } else {
      console.log("✅ Deleted related prompts");
    }

    // 3. Delete all master bot users
    console.log("🗑️ Deleting all master bot users...");
    const { error: deleteUsersError } = await supabase
      .from("users")
      .delete()
      .eq("is_master_bot", true);

    if (deleteUsersError) {
      console.log("❌ Error deleting users:", deleteUsersError);
      return;
    }
    console.log("✅ Deleted all master bot users");

    // 4. Delete all master bot configurations
    console.log("🗑️ Deleting all master bot configurations...");
    const { error: deleteConfigsError } = await supabase
      .from("master_bots")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteConfigsError) {
      console.log("❌ Error deleting master bot configs:", deleteConfigsError);
      return;
    }
    console.log("✅ Deleted all master bot configurations");

    // 5. Insert new master bot users
    console.log("👥 Creating new master bot users...");
    const userData = masterBots.map(
      ({ personality_type, specialties, ...user }) => user
    );
    const { data: insertedUsers, error: insertUsersError } = await supabase
      .from("users")
      .insert(userData)
      .select();

    if (insertUsersError) {
      console.log("❌ Error inserting users:", insertUsersError);
      return;
    }
    console.log(`✅ Created ${insertedUsers.length} master bot users`);

    // 6. Insert master bot configurations
    console.log("⚙️ Creating master bot configurations...");
    const masterBotConfigs = masterBots.map((bot) => ({
      user_id: bot.id,
      personality_type: bot.personality_type,
      specialties: bot.specialties,
      is_active: true,
    }));

    const { data: insertedConfigs, error: insertConfigsError } = await supabase
      .from("master_bots")
      .insert(masterBotConfigs)
      .select();

    if (insertConfigsError) {
      console.log("❌ Error inserting master bot configs:", insertConfigsError);
      return;
    }
    console.log(
      `✅ Created ${insertedConfigs.length} master bot configurations`
    );

    // 7. Insert restaurant-focused posts
    console.log("🍽️ Creating restaurant-focused posts...");
    const { data: insertedPosts, error: insertPostsError } = await supabase
      .from("bot_posts")
      .insert(restaurantPosts)
      .select();

    if (insertPostsError) {
      console.log("❌ Error inserting posts:", insertPostsError);
      return;
    }
    console.log(`✅ Created ${insertedPosts.length} restaurant-focused posts`);

    // 8. Verify the results
    console.log("\n📊 Final verification:");

    const { data: finalUsers } = await supabase
      .from("users")
      .select("display_name, username, is_master_bot")
      .eq("is_master_bot", true);

    const { data: finalPosts } = await supabase
      .from("bot_posts")
      .select("title, bot_id")
      .limit(5);

    console.log("👥 Master Bot Users:");
    finalUsers?.forEach((user) => {
      console.log(`- ${user.display_name} (@${user.username})`);
    });

    console.log("\n🍽️ Sample Posts:");
    finalPosts?.forEach((post, i) => {
      console.log(`${i + 1}. ${post.title}`);
    });

    console.log("\n🎉 Clean and reseed completed successfully!");
  } catch (error) {
    console.error("❌ Script failed:", error);
  }
}

cleanAndReseedBots().catch(console.error);
