// Check for Sufood post in database
// Run with: node scripts/check-sufood-post.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSufoodPost() {
  try {
    console.log("🔍 Checking for Sufood post in database...\n");

    const { data, error } = await supabase
      .from("bot_posts")
      .select("*")
      .ilike("title", "%Sufood%")
      .limit(1);

    if (error) {
      console.error("❌ Error:", error);
      return;
    }

    if (data && data.length > 0) {
      console.log("✅ Found Sufood post:");
      console.log(`   Title: ${data[0].title}`);
      console.log(`   Bot ID: ${data[0].bot_id}`);
      console.log(`   Image URL: ${data[0].image_url}`);
      console.log(`   Tags: ${data[0].tags?.join(", ")}`);

      // Check if this bot_id has a corresponding user
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, username, display_name")
        .eq("id", data[0].bot_id)
        .single();

      if (userError) {
        console.log("❌ No user found for bot_id:", data[0].bot_id);
      } else {
        console.log(`   Bot User: ${user.display_name} (@${user.username})`);
      }
    } else {
      console.log("❌ No Sufood post found in database");

      // Let's check what posts we do have
      const { data: allPosts, error: allError } = await supabase
        .from("bot_posts")
        .select("title, bot_id")
        .limit(5);

      if (allError) {
        console.error("Error fetching posts:", allError);
      } else {
        console.log("\n📝 Sample posts in database:");
        allPosts.forEach((post, index) => {
          console.log(`   ${index + 1}. ${post.title} (Bot: ${post.bot_id})`);
        });
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkSufoodPost();
