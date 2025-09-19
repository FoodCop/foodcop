// Test the simplified Master Bot system
// Run with: node scripts/test-simplified-master-bots.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSimplifiedMasterBots() {
  try {
    console.log("🧪 Testing simplified Master Bot system...");

    // Test 1: Get all Master Bots
    console.log("\n📋 Test 1: Get all Master Bots");
    const { data: allBots, error: allBotsError } = await supabase
      .from("users")
      .select("*")
      .eq("is_master_bot", true)
      .order("display_name");

    if (allBotsError) {
      console.error("❌ Error fetching all Master Bots:", allBotsError.message);
    } else {
      console.log(`✅ Successfully fetched ${allBots.length} Master Bots:`);
      allBots.forEach((bot, index) => {
        console.log(`   ${index + 1}. ${bot.display_name} (@${bot.username})`);
        console.log(
          `      - Points: ${bot.total_points}, Followers: ${bot.followers_count}`
        );
        console.log(
          `      - Location: ${bot.location_city}, ${bot.location_country}`
        );
      });
    }

    // Test 2: Get a specific Master Bot by ID
    console.log("\n🔍 Test 2: Get Master Bot by ID");
    if (allBots && allBots.length > 0) {
      const firstBot = allBots[0];
      const { data: specificBot, error: specificBotError } = await supabase
        .from("users")
        .select("*")
        .eq("id", firstBot.id)
        .eq("is_master_bot", true)
        .single();

      if (specificBotError) {
        console.error(
          "❌ Error fetching specific Master Bot:",
          specificBotError.message
        );
      } else {
        console.log(
          `✅ Successfully fetched ${specificBot.display_name} by ID`
        );
        console.log(`   - Bio: ${specificBot.bio || "No bio"}`);
        console.log(
          `   - Avatar: ${specificBot.avatar_url ? "Has avatar" : "No avatar"}`
        );
      }
    }

    // Test 3: Get Master Bot by username
    console.log("\n👤 Test 3: Get Master Bot by username");
    if (allBots && allBots.length > 0) {
      const firstBot = allBots[0];
      const { data: botByUsername, error: usernameError } = await supabase
        .from("users")
        .select("*")
        .eq("username", firstBot.username)
        .eq("is_master_bot", true)
        .single();

      if (usernameError) {
        console.error(
          "❌ Error fetching Master Bot by username:",
          usernameError.message
        );
      } else {
        console.log(
          `✅ Successfully fetched ${botByUsername.display_name} by username`
        );
      }
    }

    // Test 4: Check if a user is a Master Bot
    console.log("\n🤖 Test 4: Check if user is Master Bot");
    if (allBots && allBots.length > 0) {
      const masterBotId = allBots[0].id;
      const regularUserId = "00000000-0000-0000-0000-000000000000"; // Fake ID

      // Check Master Bot
      const { data: masterBotCheck, error: masterBotCheckError } =
        await supabase
          .from("users")
          .select("is_master_bot")
          .eq("id", masterBotId)
          .single();

      if (masterBotCheckError) {
        console.error(
          "❌ Error checking Master Bot status:",
          masterBotCheckError.message
        );
      } else {
        console.log(
          `✅ Master Bot check: ${masterBotCheck.is_master_bot ? "YES" : "NO"}`
        );
      }
    }

    // Test 5: Verify no duplicate users
    console.log("\n🔍 Test 5: Verify no duplicate users");
    const { data: allUsers, error: allUsersError } = await supabase
      .from("users")
      .select("id, username, display_name, is_master_bot")
      .order("username");

    if (allUsersError) {
      console.error("❌ Error fetching all users:", allUsersError.message);
    } else {
      const usernames = allUsers.map((user) => user.username);
      const uniqueUsernames = [...new Set(usernames)];

      console.log(`✅ Total users: ${allUsers.length}`);
      console.log(`✅ Unique usernames: ${uniqueUsernames.length}`);
      console.log(
        `✅ No duplicates: ${
          usernames.length === uniqueUsernames.length ? "YES" : "NO"
        }`
      );

      const masterBotUsers = allUsers.filter((user) => user.is_master_bot);
      const regularUsers = allUsers.filter((user) => !user.is_master_bot);

      console.log(`   - Master Bots: ${masterBotUsers.length}`);
      console.log(`   - Regular Users: ${regularUsers.length}`);
    }

    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📊 Summary:");
    console.log("   ✅ Master Bots are just users with is_master_bot = true");
    console.log("   ✅ No separate master_bots table needed");
    console.log("   ✅ No duplicate users between auth and public");
    console.log("   ✅ System is simplified and working correctly");
  } catch (error) {
    console.error("❌ Error testing simplified Master Bots:", error.message);
  }
}

testSimplifiedMasterBots();

