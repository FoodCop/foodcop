// Check bot_id mapping between bot_posts and users
// Run with: node scripts/check-bot-id-mapping.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBotIdMapping() {
  try {
    console.log("🔍 Checking bot_id mapping between bot_posts and users...\n");

    // Get bot_ids from posts
    const { data: posts, error: postsError } = await supabase
      .from("bot_posts")
      .select("bot_id, title")
      .limit(3);

    if (postsError) {
      console.error("❌ Error fetching posts:", postsError);
      return;
    }

    console.log("📝 Bot IDs in posts:");
    posts.forEach((post) => {
      console.log(`   - ${post.title}: ${post.bot_id}`);
    });

    // Check if these bot_ids exist in users table
    const botIds = posts.map((p) => p.bot_id);
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id, display_name")
      .in("id", botIds);

    if (userError) {
      console.error("❌ User error:", userError);
    } else {
      console.log("\n👤 Matching users:");
      users.forEach((user) => {
        console.log(`   - ${user.display_name}: ${user.id}`);
      });
    }

    // Test the join query
    console.log("\n🔗 Testing join query...");
    const { data: joinedData, error: joinError } = await supabase
      .from("bot_posts")
      .select(
        `
        *,
        bot:users!bot_id (
          username,
          display_name,
          avatar_url
        )
      `
      )
      .limit(1);

    if (joinError) {
      console.error("❌ Join query error:", joinError);
    } else {
      console.log("✅ Join query result:");
      if (joinedData && joinedData.length > 0) {
        const post = joinedData[0];
        console.log(`   Title: ${post.title}`);
        console.log(`   Bot ID: ${post.bot_id}`);
        console.log(`   Bot User: ${post.bot?.display_name || "undefined"}`);
        console.log(`   Bot Username: ${post.bot?.username || "undefined"}`);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkBotIdMapping();

