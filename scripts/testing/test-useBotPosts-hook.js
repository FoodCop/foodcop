// Test the useBotPosts hook directly
// Run with: node scripts/test-useBotPosts-hook.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUseBotPostsLogic() {
  try {
    console.log("🔍 Testing useBotPosts hook logic...\n");

    // Simulate the exact query from useBotPosts hook
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
      .limit(20);

    if (postsError) {
      console.error("❌ Posts query error:", postsError);
      return;
    }

    console.log(`✅ Found ${posts?.length || 0} posts`);

    if (posts && posts.length > 0) {
      // Test the first post
      const post = posts[0];
      console.log("\n📝 First post details:");
      console.log(`   Title: ${post.title}`);
      console.log(`   Bot ID: ${post.bot_id}`);
      console.log(`   Bot User: ${post.bot?.display_name || "undefined"}`);
      console.log(`   Bot Username: ${post.bot?.username || "undefined"}`);
      console.log(
        `   Personality: ${
          post.bot?.master_bots?.[0]?.personality_type || "undefined"
        }`
      );

      // Test the conversion logic
      console.log("\n🎯 Testing conversion logic:");
      const profileName = post.bot?.display_name || "";
      const profileDesignation =
        post.bot?.master_bots?.[0]?.personality_type || "";
      const username = post.bot?.username || "";

      console.log(`   Profile Name: "${profileName}"`);
      console.log(`   Profile Designation: "${profileDesignation}"`);
      console.log(`   Username: "${username}"`);

      if (profileName === "") {
        console.log("❌ PROBLEM: Profile name is empty!");
      } else {
        console.log("✅ SUCCESS: Profile name has real data!");
      }

      // Test all posts
      console.log("\n📊 All posts summary:");
      posts.forEach((p, index) => {
        const botName = p.bot?.display_name || "NO BOT DATA";
        const botType = p.bot?.master_bots?.[0]?.personality_type || "NO TYPE";
        console.log(
          `   ${index + 1}. "${p.title}" - Bot: ${botName} (${botType})`
        );
      });
    } else {
      console.log("❌ No posts found in database");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testUseBotPostsLogic();
