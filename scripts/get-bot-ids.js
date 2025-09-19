// Get actual bot IDs from bot_posts table
// Run with: node scripts/get-bot-ids.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function getBotIds() {
  try {
    const { data, error } = await supabase
      .from("bot_posts")
      .select("bot_id")
      .limit(10);

    if (error) {
      console.error("Error:", error);
      return;
    }

    const uniqueBotIds = [...new Set(data.map((p) => p.bot_id))];
    console.log("Bot IDs from bot_posts:");
    uniqueBotIds.forEach((id, index) => {
      console.log(`   ${index + 1}. ${id}`);
    });

    // Also get the master_bots table to see the user_id mappings
    const { data: masterBots, error: masterBotsError } = await supabase
      .from("master_bots")
      .select("id, user_id, bot_name");

    if (masterBotsError) {
      console.error("Error fetching master_bots:", masterBotsError);
      return;
    }

    console.log("\nMaster Bot configurations:");
    masterBots.forEach((bot, index) => {
      console.log(`   ${index + 1}. ${bot.bot_name}`);
      console.log(`      ID: ${bot.id}`);
      console.log(`      User ID: ${bot.user_id}`);
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

getBotIds();
