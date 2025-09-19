import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugBotData() {
  console.log("🔍 Debugging bot data structure...");

  // Check the raw query that useBotPosts uses
  const { data: posts, error: postsError } = await supabase
    .from("bot_posts")
    .select(
      `
      *,
      bot:users!bot_id (
        username,
        display_name,
        avatar_url,
        master_bots (
          personality_type,
          specialties
        )
      )
    `
    )
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(3);

  if (postsError) {
    console.log("❌ Error fetching posts:", postsError);
    return;
  }

  console.log("📊 Found", posts.length, "posts");
  console.log("\n🔍 Raw post data structure:");
  posts.forEach((post, i) => {
    console.log(`\n--- Post ${i + 1}: ${post.title} ---`);
    console.log("Bot ID:", post.bot_id);
    console.log("Bot object:", JSON.stringify(post.bot, null, 2));
  });

  // Also check master_bots table directly
  console.log("\n🔍 Checking master_bots table...");
  const { data: masterBots, error: mbError } = await supabase
    .from("master_bots")
    .select("*")
    .limit(3);

  if (mbError) {
    console.log("❌ Error fetching master_bots:", mbError);
  } else {
    console.log("📊 Master bots found:", masterBots.length);
    masterBots.forEach((bot, i) => {
      console.log(`\n--- Master Bot ${i + 1} ---`);
      console.log("User ID:", bot.user_id);
      console.log("Personality Type:", bot.personality_type);
      console.log("Specialties:", bot.specialties);
    });
  }

  // Check if the relationship is working
  console.log("\n🔍 Testing relationship query...");
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select(
      `
      id,
      username,
      display_name,
      master_bots (
        personality_type,
        specialties
      )
    `
    )
    .eq("is_master_bot", true)
    .limit(3);

  if (usersError) {
    console.log("❌ Error fetching users with master_bots:", usersError);
  } else {
    console.log("📊 Users with master_bots found:", users.length);
    users.forEach((user, i) => {
      console.log(`\n--- User ${i + 1}: ${user.display_name} ---`);
      console.log("Master bots:", JSON.stringify(user.master_bots, null, 2));
    });
  }
}

debugBotData().catch(console.error);

