// Check real Master Bots in database
// Run with: node scripts/check-real-masterbots.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRealMasterBots() {
  console.log("🔍 Checking real Master Bots in database...\n");

  try {
    // Check users table for master bots
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, username, display_name, is_master_bot")
      .eq("is_master_bot", true);

    if (usersError) {
      console.error("❌ Error fetching users:", usersError);
      return;
    }

    console.log("👤 Master Bot Users:");
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.display_name} (@${user.username})`);
    });

    // Check master_bots table
    const { data: configs, error: configsError } = await supabase
      .from("master_bots")
      .select("id, user_id, bot_name, personality_type, specialties");

    if (configsError) {
      console.error("❌ Error fetching master_bots:", configsError);
      return;
    }

    console.log("\n🤖 Master Bot Configurations:");
    configs.forEach((config, index) => {
      console.log(`   ${index + 1}. ${config.bot_name} (${config.personality_type})`);
      console.log(`      Specialties: ${config.specialties?.join(", ")}`);
    });

    // Check bot_posts count
    const { count: postsCount, error: postsError } = await supabase
      .from("bot_posts")
      .select("*", { count: "exact", head: true });

    if (postsError) {
      console.error("❌ Error counting posts:", postsError);
    } else {
      console.log(`\n📝 Total Bot Posts: ${postsCount}`);
    }

    // Check if we have the 7 AI connoisseurs
    console.log("\n🎯 Summary:");
    console.log(`   Users with is_master_bot=true: ${users?.length || 0}`);
    console.log(`   Master Bot configurations: ${configs?.length || 0}`);
    console.log(`   Total bot posts: ${postsCount || 0}`);

    if (users?.length === 0) {
      console.log("\n⚠️  No Master Bot users found! Need to seed them.");
    } else if (users?.length < 7) {
      console.log(`\n⚠️  Only ${users.length}/7 Master Bots found. Need to seed more.`);
    } else {
      console.log("\n✅ All 7 Master Bots are seeded!");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkRealMasterBots();
