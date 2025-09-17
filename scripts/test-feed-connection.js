// Test Feed Connection to Database Master Bots
// Run with: node scripts/test-feed-connection.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing environment variables:");
  console.error("SUPABASE_URL:", supabaseUrl ? "✅" : "❌");
  console.error("SUPABASE_ANON_KEY:", supabaseAnonKey ? "✅" : "❌");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFeedConnection() {
  console.log("🔗 Testing Feed Connection to Master Bots...\n");

  try {
    // Test 1: Fetch Master Bot users
    console.log("1️⃣ Fetching Master Bot profiles...");
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .eq("is_master_bot", true)
      .order("total_points", { ascending: false });

    if (usersError) {
      throw new Error(`Users fetch error: ${usersError.message}`);
    }

    console.log(`✅ Found ${users?.length || 0} Master Bot users`);

    // Test 2: Fetch Master Bot configurations
    console.log("\n2️⃣ Fetching Master Bot configurations...");
    const { data: configs, error: configsError } = await supabase
      .from("master_bots")
      .select("*")
      .eq("is_active", true);

    if (configsError) {
      throw new Error(`Configs fetch error: ${configsError.message}`);
    }

    console.log(`✅ Found ${configs?.length || 0} Master Bot configurations`);

    // Test 3: Try joined query (like the hook will do)
    console.log("\n3️⃣ Testing joined query...");
    const { data: joinedData, error: joinedError } = await supabase
      .from("users")
      .select(
        `
        *,
        master_bots (
          bot_name,
          personality_type,
          specialties,
          system_prompt,
          is_active
        )
      `
      )
      .eq("is_master_bot", true)
      .eq("master_bots.is_active", true);

    if (joinedError) {
      throw new Error(`Joined query error: ${joinedError.message}`);
    }

    console.log(`✅ Joined query returned ${joinedData?.length || 0} records`);

    // Display results
    console.log("\n📊 Master Bots for Feed:");
    console.log("=====================================");

    joinedData?.forEach((bot, index) => {
      console.log(`${index + 1}. ${bot.display_name} (@${bot.username})`);
      console.log(
        `   Type: ${bot.master_bots?.[0]?.personality_type || "No config"}`
      );
      console.log(`   Points: ${bot.total_points?.toLocaleString()}`);
      console.log(`   Followers: ${bot.followers_count?.toLocaleString()}`);
      console.log(`   Location: ${bot.location_city}, ${bot.location_country}`);
      console.log("");
    });

    // Summary
    console.log("🎉 Feed Connection Test Results:");
    console.log(`✅ Master Bot Users: ${users?.length || 0}/7`);
    console.log(`✅ Bot Configurations: ${configs?.length || 0}/7`);
    console.log(`✅ Feed-Ready Bots: ${joinedData?.length || 0}/7`);

    if (joinedData?.length === 7) {
      console.log(
        "\n🚀 Your feed is ready! All Master Bots will populate the swipe cards."
      );
    } else {
      console.log(
        "\n⚠️  Some Master Bots may be missing. Check database seeding."
      );
    }
  } catch (error) {
    console.error("❌ Feed connection test failed:", error.message);
    console.error("\n🔧 Troubleshooting:");
    console.error(
      "1. Check your .env.local file has correct Supabase credentials"
    );
    console.error("2. Verify Master Bots are seeded: npm run seed:masterbots");
    console.error("3. Test MCP connection: npm run test:mcp");
    process.exit(1);
  }
}

testFeedConnection();
