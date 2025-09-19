// Check for references to specific user IDs across all tables
// Run with: node scripts/check-user-references.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserReferences() {
  try {
    console.log("🔍 Checking for references to specific user IDs...");

    const userIds = [
      "0bb7272a-953d-4ce6-b1ae-3fd51e2ba7a9",
      "ecb48e71-5511-43fd-a450-7143629c9ce0",
    ];

    // Tables that might reference user IDs
    const tablesToCheck = [
      "users",
      "posts",
      "bot_posts",
      "bot_history",
      "friends",
      "followers",
      "likes",
      "comments",
      "notifications",
    ];

    for (const userId of userIds) {
      console.log(`\n👤 Checking ID: ${userId}`);

      for (const tableName of tablesToCheck) {
        try {
          // Check if table exists first
          const { data, error } = await supabase
            .from(tableName)
            .select("*")
            .limit(1);

          if (error && error.message.includes("Could not find the table")) {
            console.log(`   📋 ${tableName}: Table doesn't exist`);
            continue;
          }

          // Look for references to this user ID in common columns
          const possibleColumns = [
            "id",
            "user_id",
            "author_id",
            "from_user_id",
            "to_user_id",
            "created_by",
          ];
          let foundReferences = false;

          for (const column of possibleColumns) {
            try {
              const { data: refData, error: refError } = await supabase
                .from(tableName)
                .select("*")
                .eq(column, userId)
                .limit(5);

              if (!refError && refData && refData.length > 0) {
                console.log(
                  `   📋 ${tableName}: Found ${refData.length} references in column '${column}'`
                );
                refData.forEach((ref, index) => {
                  console.log(
                    `      ${index + 1}. ${JSON.stringify(ref).substring(
                      0,
                      100
                    )}...`
                  );
                });
                foundReferences = true;
              }
            } catch (err) {
              // Column doesn't exist, that's fine
            }
          }

          if (!foundReferences) {
            console.log(`   📋 ${tableName}: No references found`);
          }
        } catch (err) {
          console.log(`   📋 ${tableName}: Error - ${err.message}`);
        }
      }
    }

    // Also check if the missing ID might be a Master Bot
    console.log(`\n🤖 Checking if missing ID is a Master Bot:`);
    const { data: masterBots, error: masterBotsError } = await supabase
      .from("users")
      .select("id, username, display_name, email, is_master_bot")
      .eq("is_master_bot", true);

    if (masterBotsError) {
      console.log(
        `   ❌ Error fetching Master Bots: ${masterBotsError.message}`
      );
    } else {
      console.log(`   📊 Found ${masterBots.length} Master Bots:`);
      masterBots.forEach((bot, index) => {
        console.log(
          `      ${index + 1}. ${bot.display_name} (@${bot.username})`
        );
        console.log(`         ID: ${bot.id}`);
        console.log(`         Email: ${bot.email || "No email"}`);
      });

      // Check if any Master Bot has similar ID or email
      const missingId = "0bb7272a-953d-4ce6-b1ae-3fd51e2ba7a9";
      const foundBot = masterBots.find(
        (bot) => bot.id === missingId || bot.email === "fuzo.foodcop@gmail.com"
      );

      if (foundBot) {
        console.log(`\n   ✅ Found Master Bot matching criteria:`);
        console.log(`      ${foundBot.display_name} (@${foundBot.username})`);
        console.log(`      ID: ${foundBot.id}`);
        console.log(`      Email: ${foundBot.email}`);
      } else {
        console.log(
          `\n   ❌ No Master Bot found matching the missing ID or email`
        );
      }
    }

    console.log("\n📝 Analysis:");
    console.log(
      "   - ID ecb48e71-5511-43fd-a450-7143629c9ce0: Regular user (fuzo_foodcop)"
    );
    console.log(
      "   - ID 0bb7272a-953d-4ce6-b1ae-3fd51e2ba7a9: Not found in users table"
    );
    console.log(
      "   - This suggests the missing ID might be in auth.users or was deleted"
    );
  } catch (error) {
    console.error("❌ Error checking user references:", error.message);
  }
}

checkUserReferences();
