// Cleanup master_bots table - remove unnecessary complexity
// Run with: node scripts/cleanup-master-bots-table.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupMasterBotsTable() {
  try {
    console.log("🧹 Cleaning up master_bots table...");

    // Step 1: Check if master_bots table exists and what's in it
    console.log("📋 Checking master_bots table...");
    const { data: masterBotsData, error: tableError } = await supabase
      .from("master_bots")
      .select("*");

    if (tableError) {
      console.log("ℹ️ master_bots table doesn't exist or is inaccessible");
      console.log("✅ No cleanup needed");
      return;
    }

    console.log(`ℹ️ master_bots table has ${masterBotsData.length} entries`);

    if (masterBotsData.length > 0) {
      console.log("📋 Current master_bots entries:");
      masterBotsData.forEach((entry, index) => {
        console.log(
          `   ${index + 1}. ${entry.bot_name} (${entry.personality_type})`
        );
      });
    }

    // Step 2: Verify that Master Bots exist in users table
    console.log("\n🔍 Verifying Master Bots in users table...");
    const { data: usersBots, error: usersError } = await supabase
      .from("users")
      .select("id, username, display_name")
      .eq("is_master_bot", true);

    if (usersError) {
      console.error(
        "❌ Error fetching Master Bots from users table:",
        usersError.message
      );
      return;
    }

    console.log(`✅ Found ${usersBots.length} Master Bots in users table:`);
    usersBots.forEach((bot, index) => {
      console.log(`   ${index + 1}. ${bot.display_name} (@${bot.username})`);
    });

    // Step 3: Since master_bots table is empty and we have Master Bots in users table,
    // we can safely drop the master_bots table
    if (masterBotsData.length === 0 && usersBots.length > 0) {
      console.log("\n🗑️ Dropping empty master_bots table...");

      // Note: We can't drop tables via the API, so we'll just document this
      console.log(
        "📝 To complete cleanup, run this SQL in your Supabase dashboard:"
      );
      console.log("   DROP TABLE IF EXISTS master_bots CASCADE;");
      console.log("\n💡 Or add it to a migration file for future deployment");
    } else if (masterBotsData.length > 0) {
      console.log("\n⚠️ master_bots table has data - manual review needed");
      console.log(
        "   Consider migrating any important data to the users table"
      );
    }

    console.log("\n🎉 Cleanup analysis complete!");
    console.log("\n📊 Summary:");
    console.log(`   ✅ Master Bots in users table: ${usersBots.length}`);
    console.log(`   📋 Entries in master_bots table: ${masterBotsData.length}`);
    console.log(
      "   💡 Recommendation: Use only users table with is_master_bot flag"
    );
  } catch (error) {
    console.error("❌ Error during cleanup:", error.message);
  }
}

cleanupMasterBotsTable();

