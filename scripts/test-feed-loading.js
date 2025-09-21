import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test feed loading functionality
async function testFeedLoading() {
  console.log("🧪 Testing feed loading functionality...");

  try {
    // Test 1: Check if we can query public_master_bot_posts
    console.log("📋 Testing public_master_bot_posts query...");
    const { data: posts, error: postsError } = await supabase
      .from("public_master_bot_posts")
      .select("*")
      .limit(5);

    if (postsError) {
      console.error(
        "❌ Error querying public_master_bot_posts:",
        postsError.message
      );
      console.error("Error details:", postsError);
      return;
    }

    console.log("✅ Successfully queried public_master_bot_posts");
    console.log("📊 Found", posts.length, "posts");
    console.log("📝 Sample post:", {
      id: posts[0]?.id,
      title: posts[0]?.title,
      bot_username: posts[0]?.bot_username,
    });

    // Test 2: Check if we can query master_bot_posts (the original table)
    console.log("\n📋 Testing master_bot_posts query...");
    const { data: masterPosts, error: masterError } = await supabase
      .from("master_bot_posts")
      .select("*")
      .limit(5);

    if (masterError) {
      console.error("❌ Error querying master_bot_posts:", masterError.message);
    } else {
      console.log("✅ Successfully queried master_bot_posts");
      console.log("📊 Found", masterPosts.length, "posts");
    }

    // Test 3: Check RLS policies
    console.log("\n🔒 Testing RLS policies...");
    const { data: rlsTest, error: rlsError } = await supabase
      .from("public_master_bot_posts")
      .select("id")
      .limit(1);

    if (rlsError) {
      console.error("❌ RLS test failed:", rlsError.message);
    } else {
      console.log("✅ RLS test passed");
    }

    console.log("\n🎉 Feed loading test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testFeedLoading().catch(console.error);
