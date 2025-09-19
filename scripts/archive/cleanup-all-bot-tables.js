// Cleanup all unnecessary bot-related tables
// Run with: node scripts/cleanup-all-bot-tables.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupAllBotTables() {
  try {
    console.log("🧹 Cleaning up all bot-related tables...");

    // Tables to check and potentially drop
    const tablesToCheck = [
      {
        name: "bot_history",
        description: "Tracks bot content history (empty)",
        shouldDrop: true,
      },
      {
        name: "master_bots",
        description: "Master bot configurations (empty)",
        shouldDrop: true,
      },
      {
        name: "bot_posts",
        description: "Bot-generated posts (empty)",
        shouldDrop: true,
      },
      {
        name: "tags_map",
        description: "Content tagging mappings (has data)",
        shouldDrop: false, // Keep this one - it has useful data
      },
    ];

    console.log("\n📋 Analysis of bot-related tables:");

    for (const table of tablesToCheck) {
      console.log(`\n🔍 ${table.name}:`);
      console.log(`   Description: ${table.description}`);

      try {
        const { data, error } = await supabase
          .from(table.name)
          .select("*")
          .limit(1);

        if (error) {
          console.log(
            `   ❌ Table doesn't exist or is inaccessible: ${error.message}`
          );
        } else {
          console.log(`   ✅ Table exists`);

          // Get actual count
          const { count, error: countError } = await supabase
            .from(table.name)
            .select("*", { count: "exact", head: true });

          if (countError) {
            console.log(`   📊 Entries: Unknown (error getting count)`);
          } else {
            console.log(`   📊 Entries: ${count || 0}`);
          }

          if (table.shouldDrop && (count === 0 || !count)) {
            console.log(`   🗑️ RECOMMENDATION: Drop this table (empty)`);
          } else if (table.shouldDrop && count > 0) {
            console.log(
              `   ⚠️ WARNING: Table has ${count} entries - manual review needed`
            );
          } else {
            console.log(`   💡 KEEP: This table has useful data`);
          }
        }
      } catch (err) {
        console.log(`   ❌ Error checking ${table.name}: ${err.message}`);
      }
    }

    // Check the current simplified system
    console.log("\n✅ Current Simplified System:");
    const { data: masterBots, error: usersError } = await supabase
      .from("users")
      .select("id, username, display_name, is_master_bot")
      .eq("is_master_bot", true);

    if (usersError) {
      console.log(`   ❌ Error checking users table: ${usersError.message}`);
    } else {
      console.log(`   ✅ Master Bots in users table: ${masterBots.length}`);
      console.log("   ✅ All Master Bots are working correctly");
    }

    console.log("\n📝 Cleanup Recommendations:");
    console.log("   1. DROP TABLE bot_history (empty)");
    console.log("   2. DROP TABLE master_bots (empty)");
    console.log("   3. DROP TABLE bot_posts (empty)");
    console.log("   4. KEEP TABLE tags_map (has useful data)");
    console.log("   5. KEEP users table with is_master_bot flag");

    console.log("\n🗑️ SQL Commands to run in Supabase Dashboard:");
    console.log("   DROP TABLE IF EXISTS bot_history CASCADE;");
    console.log("   DROP TABLE IF EXISTS master_bots CASCADE;");
    console.log("   DROP TABLE IF EXISTS bot_posts CASCADE;");

    console.log("\n🎉 Cleanup analysis complete!");
    console.log("\n💡 Next Steps:");
    console.log("   1. Run the DROP TABLE commands in Supabase Dashboard");
    console.log("   2. Or add them to a migration file");
    console.log("   3. Update any code that references these old tables");
    console.log(
      "   4. Use the simplified masterBotService for all Master Bot operations"
    );
  } catch (error) {
    console.error("❌ Error during cleanup analysis:", error.message);
  }
}

cleanupAllBotTables();

