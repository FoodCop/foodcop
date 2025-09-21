import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
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

// Migration files to apply in order
const migrationFiles = [
  "12_create_plates_table.sql",
  "13_create_saved_places_table.sql",
  "14_create_plate_items_table.sql",
  "15_migrate_data_to_plates.sql",
];

// Function to check if update_updated_at_column function exists
async function checkUpdateFunction() {
  try {
    const { data, error } = await supabase.rpc("exec", {
      sql: `
        SELECT EXISTS (
          SELECT 1 FROM pg_proc
          WHERE proname = 'update_updated_at_column'
        ) as function_exists;
      `,
    });

    if (error) {
      console.log("⚠️  Could not check for update function:", error.message);
      return false;
    }

    return data && data.length > 0 && data[0].function_exists;
  } catch (error) {
    console.log("⚠️  Error checking for update function:", error.message);
    return false;
  }
}

// Function to create update_updated_at_column function if it doesn't exist
async function createUpdateFunction() {
  const functionSQL = `
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `;

  try {
    const { error } = await supabase.rpc("exec", { sql: functionSQL });

    if (error) {
      console.error("❌ Error creating update function:", error.message);
      return false;
    }

    console.log("✅ Created update_updated_at_column function");
    return true;
  } catch (error) {
    console.error("❌ Error creating update function:", error.message);
    return false;
  }
}

// Function to apply a single migration
async function applyMigration(filename) {
  console.log(`\n📋 Applying migration: ${filename}`);

  const migrationPath = path.join(
    __dirname,
    `../database/migrations/${filename}`
  );

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    return false;
  }

  const migrationSQL = fs.readFileSync(migrationPath, "utf8");

  try {
    const { error } = await supabase.rpc("exec", { sql: migrationSQL });

    if (error) {
      console.error(`❌ Migration error for ${filename}:`, error.message);
      // Check if it's a "already exists" error which is usually fine
      if (
        error.message.includes("already exists") ||
        error.message.includes("duplicate key") ||
        (error.message.includes("relation") &&
          error.message.includes("already exists"))
      ) {
        console.log(
          `   ⚠️  ${filename} - Some objects already exist, continuing...`
        );
        return true;
      }
      return false;
    }

    console.log(`✅ Successfully applied ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Error applying ${filename}:`, error.message);
    return false;
  }
}

// Main function
async function applyPlateMigrations() {
  console.log("🚀 Starting application of plate migrations to Supabase...");

  try {
    // First, check if update function exists and create it if needed
    console.log("🔍 Checking for update_updated_at_column function...");
    const functionExists = await checkUpdateFunction();

    if (!functionExists) {
      console.log("📝 Creating update_updated_at_column function...");
      const created = await createUpdateFunction();
      if (!created) {
        console.error("❌ Failed to create update function, but continuing...");
      }
    } else {
      console.log("✅ update_updated_at_column function already exists");
    }

    let successCount = 0;
    let totalCount = migrationFiles.length;

    // Apply each migration in order
    for (const filename of migrationFiles) {
      const success = await applyMigration(filename);
      if (success) {
        successCount++;
      } else {
        console.error(
          `❌ Failed to apply ${filename}, stopping migration process`
        );
        break;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(
      `   ✅ Successfully applied: ${successCount}/${totalCount} migrations`
    );

    if (successCount === totalCount) {
      console.log("🎉 All plate migrations applied successfully!");

      // Test the tables by trying to query them
      console.log("\n🧪 Testing new tables...");

      try {
        const { data: plates, error: platesError } = await supabase
          .from("plates")
          .select("id")
          .limit(1);

        if (platesError) {
          console.error("❌ Error testing plates table:", platesError.message);
        } else {
          console.log("✅ plates table is accessible");
        }
      } catch (error) {
        console.error("❌ Error testing plates table:", error.message);
      }

      try {
        const { data: plateItems, error: plateItemsError } = await supabase
          .from("plate_items")
          .select("id")
          .limit(1);

        if (plateItemsError) {
          console.error(
            "❌ Error testing plate_items table:",
            plateItemsError.message
          );
        } else {
          console.log("✅ plate_items table is accessible");
        }
      } catch (error) {
        console.error("❌ Error testing plate_items table:", error.message);
      }
    } else {
      console.log("⚠️  Some migrations failed. Please check the errors above.");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error during migration process:", error.message);
    process.exit(1);
  }
}

// Run the script
applyPlateMigrations().catch(console.error);
