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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to check table structure
async function checkTableStructure() {
  console.log("🔍 Checking current table structure...");

  try {
    // Check plates table structure
    console.log("\n📋 Checking plates table...");
    const { data: plates, error: platesError } = await supabase
      .from("plates")
      .select("*")
      .limit(1);

    if (platesError) {
      console.error("❌ Error querying plates table:", platesError.message);
    } else {
      console.log("✅ plates table accessible");
      if (plates && plates.length > 0) {
        console.log("📊 Sample plates record columns:", Object.keys(plates[0]));
      } else {
        console.log("📊 plates table is empty");
      }
    }

    // Check if plate_items table exists
    console.log("\n📋 Checking plate_items table...");
    const { data: plateItems, error: plateItemsError } = await supabase
      .from("plate_items")
      .select("*")
      .limit(1);

    if (plateItemsError) {
      if (
        plateItemsError.message.includes("relation") &&
        plateItemsError.message.includes("does not exist")
      ) {
        console.log("❌ plate_items table does not exist");
      } else {
        console.error(
          "❌ Error querying plate_items table:",
          plateItemsError.message
        );
      }
    } else {
      console.log("✅ plate_items table accessible");
      if (plateItems && plateItems.length > 0) {
        console.log(
          "📊 Sample plate_items record columns:",
          Object.keys(plateItems[0])
        );
      } else {
        console.log("📊 plate_items table is empty");
      }
    }

    // Check if saved_places table exists
    console.log("\n📋 Checking saved_places table...");
    const { data: savedPlaces, error: savedPlacesError } = await supabase
      .from("saved_places")
      .select("*")
      .limit(1);

    if (savedPlacesError) {
      if (
        savedPlacesError.message.includes("relation") &&
        savedPlacesError.message.includes("does not exist")
      ) {
        console.log("❌ saved_places table does not exist");
      } else {
        console.error(
          "❌ Error querying saved_places table:",
          savedPlacesError.message
        );
      }
    } else {
      console.log("✅ saved_places table accessible");
      if (savedPlaces && savedPlaces.length > 0) {
        console.log(
          "📊 Sample saved_places record columns:",
          Object.keys(savedPlaces[0])
        );
      } else {
        console.log("📊 saved_places table is empty");
      }
    }

    console.log("\n📝 Migration Status:");
    console.log("   - plates table: EXISTS but needs schema update");
    console.log("   - plate_items table: MISSING");
    console.log("   - saved_places table: MISSING");

    console.log("\n🔧 Required Actions:");
    console.log("1. Go to your Supabase project dashboard");
    console.log("2. Navigate to SQL Editor");
    console.log("3. Run the following SQL commands in order:");
    console.log("\n   -- First, add missing columns to plates table");
    console.log(
      "   ALTER TABLE plates ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);"
    );
    console.log(
      "   ALTER TABLE plates ADD COLUMN IF NOT EXISTS username VARCHAR(50);"
    );
    console.log("   ALTER TABLE plates ADD COLUMN IF NOT EXISTS bio TEXT;");
    console.log(
      "   ALTER TABLE plates ADD COLUMN IF NOT EXISTS avatar_url TEXT;"
    );
    console.log(
      "   ALTER TABLE plates ADD COLUMN IF NOT EXISTS cover_photo_url TEXT;"
    );
    console.log(
      "   ALTER TABLE plates ADD COLUMN IF NOT EXISTS location_city VARCHAR(100);"
    );
    console.log(
      "   ALTER TABLE plates ADD COLUMN IF NOT EXISTS location_state VARCHAR(100);"
    );
    console.log(
      "   ALTER TABLE plates ADD COLUMN IF NOT EXISTS location_country VARCHAR(100);"
    );
    console.log(
      "   ALTER TABLE plates ADD COLUMN IF NOT EXISTS dietary_preferences JSONB DEFAULT '[]'::jsonb;"
    );
    console.log(
      "   ALTER TABLE plates ADD COLUMN IF NOT EXISTS cuisine_preferences JSONB DEFAULT '[]'::jsonb;"
    );
    console.log(
      "   ALTER TABLE plates ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;"
    );
    console.log(
      "   ALTER TABLE plates ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1;"
    );
    console.log(
      "   ALTER TABLE plates ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0;"
    );
    console.log(
      "   ALTER TABLE plates ADD COLUMN IF NOT EXISTS friends_count INTEGER DEFAULT 0;"
    );
    console.log(
      "   ALTER TABLE plates ADD COLUMN IF NOT EXISTS saved_places_count INTEGER DEFAULT 0;"
    );
    console.log(
      "   ALTER TABLE plates ADD COLUMN IF NOT EXISTS saved_recipes_count INTEGER DEFAULT 0;"
    );
    console.log(
      "   ALTER TABLE plates ADD COLUMN IF NOT EXISTS saved_photos_count INTEGER DEFAULT 0;"
    );
    console.log(
      "   ALTER TABLE plates ADD COLUMN IF NOT EXISTS saved_videos_count INTEGER DEFAULT 0;"
    );
    console.log(
      "\n   -- Then run the migration files from database/migrations/"
    );
    console.log("   -- Copy and paste the contents of:");
    console.log("   -- database/migrations/13_create_saved_places_table.sql");
    console.log("   -- database/migrations/14_create_plate_items_table.sql");
    console.log("   -- database/migrations/15_migrate_data_to_plates.sql");
  } catch (error) {
    console.error("❌ Error checking table structure:", error.message);
  }
}

// Run the script
checkTableStructure().catch(console.error);
