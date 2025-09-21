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

// Function to test if a table exists
async function tableExists(tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select("*").limit(1);

    if (error) {
      if (
        error.message.includes("relation") &&
        error.message.includes("does not exist")
      ) {
        return false;
      }
      throw error;
    }
    return true;
  } catch (error) {
    if (
      error.message.includes("relation") &&
      error.message.includes("does not exist")
    ) {
      return false;
    }
    throw error;
  }
}

// Function to create plates table using direct SQL
async function createPlatesTable() {
  console.log("📋 Creating plates table...");

  try {
    // Try to create the table by attempting to insert a test record
    // This will fail if the table doesn't exist, which is what we want
    const { error: testError } = await supabase
      .from("plates")
      .select("id")
      .limit(1);

    if (
      testError &&
      testError.message.includes("relation") &&
      testError.message.includes("does not exist")
    ) {
      console.log(
        "❌ plates table doesn't exist. Cannot create tables without SQL access."
      );
      console.log("Please create the tables manually in Supabase Dashboard:");
      console.log("1. Go to your Supabase project dashboard");
      console.log("2. Navigate to SQL Editor");
      console.log("3. Run the migration files from database/migrations/");
      return false;
    } else if (testError) {
      throw testError;
    } else {
      console.log("✅ plates table already exists");
      return true;
    }
  } catch (error) {
    console.error("❌ Error checking plates table:", error.message);
    return false;
  }
}

// Function to test the SaveToPlate functionality
async function testSaveToPlate() {
  console.log("\n🧪 Testing SaveToPlate functionality...");

  try {
    // Test if we can query plates table
    const { data: plates, error: platesError } = await supabase
      .from("plates")
      .select("id, user_id, display_name")
      .limit(5);

    if (platesError) {
      console.error("❌ Error querying plates table:", platesError.message);
      return false;
    }

    console.log(
      `✅ plates table accessible, found ${plates?.length || 0} records`
    );

    // Test if we can query plate_items table
    const { data: plateItems, error: plateItemsError } = await supabase
      .from("plate_items")
      .select("id, item_type, item_id")
      .limit(5);

    if (plateItemsError) {
      console.error(
        "❌ Error querying plate_items table:",
        plateItemsError.message
      );
      return false;
    }

    console.log(
      `✅ plate_items table accessible, found ${
        plateItems?.length || 0
      } records`
    );

    return true;
  } catch (error) {
    console.error("❌ Error testing tables:", error.message);
    return false;
  }
}

// Main function
async function checkPlateTables() {
  console.log("🚀 Checking plate table setup...");

  try {
    const platesExists = await createPlatesTable();

    if (platesExists) {
      const testPassed = await testSaveToPlate();

      if (testPassed) {
        console.log(
          "\n🎉 Plate tables are ready! SaveToPlate should work now."
        );
        console.log("\n📝 Next steps:");
        console.log("1. Try using the SaveToPlate widget in the app");
        console.log("2. Check the browser console for any remaining errors");
        console.log("3. Test saving items to your plate");
      } else {
        console.log("\n⚠️  Tables exist but there might be permission issues.");
      }
    } else {
      console.log("\n❌ Plate tables need to be created manually.");
      console.log("\n📋 Manual setup required:");
      console.log("1. Open your Supabase project dashboard");
      console.log("2. Go to SQL Editor");
      console.log("3. Copy and run the SQL from these files:");
      console.log("   - database/migrations/12_create_plates_table.sql");
      console.log("   - database/migrations/13_create_saved_places_table.sql");
      console.log("   - database/migrations/14_create_plate_items_table.sql");
      console.log("   - database/migrations/15_migrate_data_to_plates.sql");
      console.log("4. Run this script again to verify");
    }
  } catch (error) {
    console.error("❌ Error during table check:", error.message);
    process.exit(1);
  }
}

// Run the script
checkPlateTables().catch(console.error);
