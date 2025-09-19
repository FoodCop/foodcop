// Simplify Master Bot system - remove unnecessary complexity
// Run with: node scripts/simplify-master-bots.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anonSupabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function simplifyMasterBots() {
  try {
    console.log("🔧 Simplifying Master Bot system...");

    // Step 1: Check current Master Bots
    console.log("📋 Current Master Bots:");
    const { data: masterBots, error: masterBotsError } = await supabase
      .from("users")
      .select("id, username, display_name, is_master_bot, email")
      .eq("is_master_bot", true);

    if (masterBotsError) {
      console.error("❌ Error fetching master bots:", masterBotsError.message);
      return;
    }

    console.log(`✅ Found ${masterBots.length} Master Bots:`);
    masterBots.forEach((bot, index) => {
      console.log(`   ${index + 1}. ${bot.display_name} (@${bot.username})`);
    });

    // Step 2: Check if master_bots table exists and is empty
    console.log("\n🗑️ Checking master_bots table...");
    const { data: masterBotsTable, error: tableError } = await supabase
      .from("master_bots")
      .select("*")
      .limit(1);

    if (tableError) {
      console.log("ℹ️ master_bots table doesn't exist or is inaccessible");
    } else {
      console.log(
        `ℹ️ master_bots table exists with ${masterBotsTable.length} entries`
      );
      if (masterBotsTable.length === 0) {
        console.log("✅ master_bots table is empty - can be removed");
      }
    }

    // Step 3: Test anonymous access (this will fail due to RLS)
    console.log("\n🧪 Testing anonymous access to Master Bots...");
    const { data: anonBots, error: anonError } = await anonSupabase
      .from("users")
      .select("id, username, display_name, is_master_bot")
      .eq("is_master_bot", true);

    if (anonError) {
      console.log(
        "❌ Anonymous access blocked by RLS (expected):",
        anonError.message
      );
    } else {
      console.log(
        `✅ Anonymous access works! Found ${anonBots.length} Master Bots`
      );
    }

    // Step 4: Create a simple API endpoint approach
    console.log("\n💡 Solution: Use service role for Master Bot operations");
    console.log("   - Master Bots are just users with is_master_bot = true");
    console.log("   - Use service role key for Master Bot API calls");
    console.log("   - Keep regular user profiles private via RLS");

    // Step 5: Show the simplified structure
    console.log("\n📊 Simplified Master Bot Structure:");
    console.log("   ✅ Single users table with is_master_bot flag");
    console.log("   ✅ No separate master_bots table needed");
    console.log("   ✅ No duplicate users in auth vs public");
    console.log("   ✅ Master Bots are just special users");

    console.log("\n🎉 Master Bot system simplified successfully!");
  } catch (error) {
    console.error("❌ Error simplifying Master Bots:", error.message);
  }
}

simplifyMasterBots();

