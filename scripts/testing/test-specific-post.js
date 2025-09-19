// Test specific Sufood post
// Run with: node scripts/test-specific-post.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSpecificPost() {
  try {
    console.log("🔍 Testing specific Sufood post...\n");

    // Get the Sufood post with join
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
      .ilike("title", "%Sufood%")
      .limit(1);

    if (postsError) {
      console.error("❌ Error:", postsError);
      return;
    }

    if (posts && posts.length > 0) {
      const post = posts[0];
      console.log("✅ Sufood post with join data:");
      console.log(`   Title: ${post.title}`);
      console.log(`   Bot ID: ${post.bot_id}`);
      console.log(`   Bot User: ${post.bot?.display_name || "undefined"}`);
      console.log(`   Bot Username: ${post.bot?.username || "undefined"}`);
      console.log(`   Bot Avatar: ${post.bot?.avatar_url || "undefined"}`);
      console.log(
        `   Personality: ${
          post.bot?.master_bots?.[0]?.personality_type || "undefined"
        }`
      );
      console.log(
        `   Specialties: ${
          post.bot?.master_bots?.[0]?.specialties?.join(", ") || "undefined"
        }`
      );

      // Test the conversion function logic
      console.log("\n🎯 Testing conversion logic:");
      const profileName = post.bot?.display_name || "Master Bot";
      const profileDesignation =
        post.bot?.master_bots?.[0]?.personality_type || "Food Explorer";
      const username = post.bot?.username || "@masterbot";

      console.log(`   Profile Name: ${profileName}`);
      console.log(`   Profile Designation: ${profileDesignation}`);
      console.log(`   Username: ${username}`);

      if (profileName === "Master Bot") {
        console.log("❌ PROBLEM: Still using fallback 'Master Bot' name!");
      } else {
        console.log("✅ SUCCESS: Using real bot data!");
      }
    } else {
      console.log("❌ No Sufood post found");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testSpecificPost();

