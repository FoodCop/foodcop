// Check what bot-related tables exist
// Run with: node scripts/check-bot-tables.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBotTables() {
  try {
    console.log("🔍 Checking bot-related tables...");

    // Check each table individually since we can't query information_schema easily
    const tablesToCheck = [
      "bot_history",
      "master_bots",
      "bot_posts",
      "bot_prompts",
      "tags_map",
    ];

    for (const tableName of tablesToCheck) {
      console.log(`\n📋 Checking ${tableName}...`);

      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .limit(5);

        if (error) {
          console.log(
            `   ❌ Table ${tableName} doesn't exist or is inaccessible: ${error.message}`
          );
        } else {
          console.log(
            `   ✅ Table ${tableName} exists with ${data.length} entries`
          );
          if (data.length > 0) {
            console.log(`   📊 Sample data:`, data[0]);
          }
        }
      } catch (err) {
        console.log(`   ❌ Error checking ${tableName}: ${err.message}`);
      }
    }

    // Also check the users table for Master Bots
    console.log(`\n📋 Checking users table for Master Bots...`);
    const { data: masterBots, error: usersError } = await supabase
      .from("users")
      .select("id, username, display_name, is_master_bot")
      .eq("is_master_bot", true);

    if (usersError) {
      console.log(`   ❌ Error checking users table: ${usersError.message}`);
    } else {
      console.log(
        `   ✅ Found ${masterBots.length} Master Bots in users table`
      );
      masterBots.forEach((bot, index) => {
        console.log(
          `      ${index + 1}. ${bot.display_name} (@${bot.username})`
        );
      });
    }

    console.log("\n📊 Summary:");
    console.log("   - Check which tables exist and have data");
    console.log("   - Tables with data might need migration or cleanup");
    console.log("   - Empty tables can be safely dropped");
  } catch (error) {
    console.error("❌ Error checking bot tables:", error.message);
  }
}

checkBotTables();

