// Drop the remaining bot tables (bot_posts and bot_history)
// Run with: node scripts/drop-remaining-bot-tables.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function dropRemainingBotTables() {
  try {
    console.log("🗑️ Dropping remaining bot tables...");

    const tablesToDrop = [
      {
        name: "bot_history",
        description: "Bot content history tracking",
      },
      {
        name: "bot_posts",
        description: "Bot-generated posts",
      },
    ];

    for (const table of tablesToDrop) {
      console.log(`\n🔍 Checking ${table.name}...`);

      try {
        // First check if table exists and is empty
        const { data, error } = await supabase
          .from(table.name)
          .select("*")
          .limit(1);

        if (error) {
          console.log(
            `   ✅ Table ${table.name} doesn't exist (already dropped)`
          );
          continue;
        }

        // Get count to confirm it's empty
        const { count, error: countError } = await supabase
          .from(table.name)
          .select("*", { count: "exact", head: true });

        if (countError) {
          console.log(
            `   ⚠️ Could not get count for ${table.name}: ${countError.message}`
          );
        } else {
          console.log(`   📊 Table ${table.name} has ${count || 0} entries`);

          if (count > 0) {
            console.log(
              `   ⚠️ WARNING: ${table.name} has data! Skipping drop.`
            );
            console.log(
              `   💡 Manual review needed before dropping this table.`
            );
            continue;
          }
        }

        console.log(`   🗑️ Dropping ${table.name}...`);

        // Note: We can't actually drop tables via the Supabase client
        // This would need to be done in the Supabase Dashboard or via SQL
        console.log(`   📝 SQL to run in Supabase Dashboard:`);
        console.log(`   DROP TABLE IF EXISTS ${table.name} CASCADE;`);
      } catch (err) {
        console.log(`   ❌ Error checking ${table.name}: ${err.message}`);
      }
    }

    console.log("\n✅ Summary:");
    console.log("   - master_bots table: ✅ Already deleted manually");
    console.log("   - bot_history table: Check status above");
    console.log("   - bot_posts table: Check status above");
    console.log("   - tags_map table: ✅ Keep (has useful data)");

    console.log("\n📝 Next Steps:");
    console.log("   1. Copy the SQL commands above");
    console.log("   2. Run them in your Supabase Dashboard SQL Editor");
    console.log("   3. Or run: DROP TABLE IF EXISTS bot_history CASCADE;");
    console.log("   4. Or run: DROP TABLE IF EXISTS bot_posts CASCADE;");

    console.log("\n🎉 After dropping these tables:");
    console.log("   ✅ Master Bots are just users with is_master_bot = true");
    console.log("   ✅ No unnecessary tables cluttering the database");
    console.log("   ✅ Clean, simple structure");
    console.log("   ✅ Easy to maintain and understand");
  } catch (error) {
    console.error("❌ Error during table cleanup:", error.message);
  }
}

dropRemainingBotTables();
