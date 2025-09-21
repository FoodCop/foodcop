import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// Initialize Supabase client (same as in the app)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "fuzo-auth-token",
  },
});

// Test the exact same query as the app
async function testClientFeed() {
  console.log("🧪 Testing client-side feed loading...");

  try {
    // Test the exact query from SupabaseContentService
    console.log("📋 Querying public_master_bot_posts...");
    const { data, error } = await supabase
      .from("public_master_bot_posts")
      .select("*")
      .limit(20);

    if (error) {
      console.error("❌ Error:", error.message);
      console.error("Error details:", error);
      return;
    }

    console.log("✅ Successfully fetched", data.length, "posts");
    console.log("📝 Sample post:", {
      id: data[0]?.id,
      title: data[0]?.title,
      bot_username: data[0]?.bot_username,
    });

    // Test the conversion logic
    console.log("\n🔄 Testing post conversion...");
    const samplePost = data[0];
    if (samplePost) {
      const convertedPost = {
        id: samplePost.id,
        bot_id: samplePost.master_bot_id,
        user_id: samplePost.master_bot_id,
        restaurant_id: samplePost.restaurant_id,
        title: samplePost.title,
        subtitle: samplePost.content?.substring(0, 200) + "...",
        content: samplePost.content,
        hero_url: samplePost.image_url,
        images: samplePost.image_url ? [samplePost.image_url] : [],
        videos: [],
        rating: samplePost.restaurant_rating,
        visit_date: samplePost.created_at,
        dish_names: samplePost.tags || [],
        spent_amount: 0,
        likes_count: samplePost.engagement_likes,
        comments_count: samplePost.engagement_comments,
        shares_count: samplePost.engagement_shares,
        saves_count: 0,
        visibility: "public",
        is_featured: false,
        is_verified: true,
        kind: samplePost.content_type,
        payload: {},
        cta_label: "",
        cta_url: "",
        tags: samplePost.tags || [],
        posted_at: samplePost.created_at,
        created_at: samplePost.created_at,
        updated_at: samplePost.updated_at,
        restaurant_data: {
          name: samplePost.restaurant_name || "Restaurant",
          location: samplePost.restaurant_location || "Location",
          rating: samplePost.restaurant_rating || 4.5,
          price_range: samplePost.restaurant_price_range || "$$$",
          cuisine: samplePost.restaurant_cuisine || "Restaurant",
          reviews_count:
            samplePost.engagement_likes +
            samplePost.engagement_comments +
            samplePost.engagement_shares,
        },
        bot: {
          username: samplePost.bot_username,
          display_name: samplePost.bot_display_name,
          avatar_url: samplePost.bot_avatar_url,
          personality_type: samplePost.personality_trait || "Food Expert",
          specialties: [samplePost.personality_trait || "Food Expert"],
        },
      };

      console.log("✅ Post conversion successful");
      console.log("📊 Converted post:", {
        id: convertedPost.id,
        title: convertedPost.title,
        bot_username: convertedPost.bot.username,
        restaurant_name: convertedPost.restaurant_data.name,
      });
    }

    console.log("\n🎉 Client-side feed test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testClientFeed().catch(console.error);
