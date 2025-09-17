/**
 * Test Feed Posts
 * Quick test to verify Master Bot posts are loading correctly
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFeedPosts() {
  try {
    console.log("🧪 Testing Master Bot Posts Feed...");

    // Test the same query that useBotPosts uses
    const { data: posts, error } = await supabase
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
      .limit(5);

    if (error) {
      console.error("❌ Error fetching posts:", error);
      return;
    }

    console.log(`✅ Successfully fetched ${posts.length} posts`);

    // Display sample posts
    posts.forEach((post, index) => {
      console.log(`\n📝 Post ${index + 1}:`);
      console.log(`   Title: ${post.title}`);
      console.log(`   Subtitle: ${post.subtitle}`);
      console.log(`   Bot: ${post.bot?.display_name} (@${post.bot?.username})`);
      console.log(
        `   Image: ${post.image_url ? "✅ Has image" : "❌ No image"}`
      );
      console.log(`   Tags: ${post.tags?.join(", ") || "None"}`);
    });

    console.log("\n🎉 Feed test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testFeedPosts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Test failed:", error);
      process.exit(1);
    });
}

export { testFeedPosts };
