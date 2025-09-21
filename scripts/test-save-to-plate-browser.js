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

// Test SaveToPlate functionality with the exact same logic as the app
async function testSaveToPlateBrowser() {
  console.log("🧪 Testing SaveToPlate functionality (browser simulation)...");

  try {
    // Get the test user
    const { data: user, error: userError } = await supabase
      .from("plates")
      .select("id, user_id, display_name, username")
      .eq("user_id", "fd8f0001-04a4-46bb-83aa-c4585c97f069")
      .single();

    if (userError) {
      console.error("❌ Error getting user:", userError.message);
      return;
    }

    console.log("✅ Found user:", user.display_name, "(" + user.username + ")");
    console.log("📋 Plate ID:", user.id);

    // Test saving a restaurant item (same as in the app)
    const testItem = {
      plate_id: user.id,
      item_type: "restaurant",
      item_id: "test-restaurant-456",
      metadata: {
        title: "Test Restaurant Browser",
        imageUrl: "https://example.com/image.jpg",
        saved_at: new Date().toISOString(),
        rating: 4.5,
        cuisine: ["Italian"],
        priceLevel: 2,
        address: "123 Test St, Test City",
        coordinates: { lat: 40.7128, lng: -74.006 },
      },
    };

    console.log("📝 Testing save operation...");
    const { data: savedItem, error: saveError } = await supabase
      .from("plate_items")
      .insert(testItem)
      .select()
      .single();

    if (saveError) {
      console.error("❌ Error saving item:", saveError.message);
      console.error("Error details:", saveError);
      return;
    }

    console.log("✅ Successfully saved item:", savedItem.id);

    // Test listing saved items
    console.log("📋 Testing list operation...");
    const { data: items, error: listError } = await supabase
      .from("plate_items")
      .select("*")
      .eq("plate_id", user.id)
      .eq("item_type", "restaurant");

    if (listError) {
      console.error("❌ Error listing items:", listError.message);
      return;
    }

    console.log("✅ Found", items.length, "saved items");
    console.log(
      "📊 Items:",
      items.map((item) => ({
        id: item.id,
        type: item.item_type,
        title: item.metadata.title,
      }))
    );

    // Clean up test data
    console.log("🧹 Cleaning up test data...");
    const { error: deleteError } = await supabase
      .from("plate_items")
      .delete()
      .eq("id", savedItem.id);

    if (deleteError) {
      console.error("❌ Error cleaning up:", deleteError.message);
    } else {
      console.log("✅ Test data cleaned up");
    }

    console.log("\n🎉 SaveToPlate functionality test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testSaveToPlateBrowser().catch(console.error);
