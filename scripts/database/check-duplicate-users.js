// Check for duplicate users with same email
// Run with: node scripts/check-duplicate-users.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDuplicateUsers() {
  try {
    console.log("🔍 Checking for duplicate users...");

    // Check the specific IDs mentioned
    const specificIds = [
      "0bb7272a-953d-4ce6-b1ae-3fd51e2ba7a9",
      "ecb48e71-5511-43fd-a450-7143629c9ce0",
    ];

    console.log("\n📋 Checking specific user IDs:");
    for (const id of specificIds) {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.log(`   ❌ ID ${id}: ${error.message}`);
        } else {
          console.log(`   ✅ ID ${id}:`);
          console.log(`      Email: ${data.email}`);
          console.log(`      Username: ${data.username}`);
          console.log(`      Display Name: ${data.display_name}`);
          console.log(`      Is Master Bot: ${data.is_master_bot}`);
          console.log(`      Created: ${data.created_at}`);
        }
      } catch (err) {
        console.log(`   ❌ Error checking ID ${id}: ${err.message}`);
      }
    }

    // Check for users with fuzo.foodcop@gmail.com email
    console.log("\n📋 Checking for fuzo.foodcop@gmail.com:");
    const { data: fuzoUsers, error: fuzoError } = await supabase
      .from("users")
      .select("*")
      .eq("email", "fuzo.foodcop@gmail.com");

    if (fuzoError) {
      console.log(`   ❌ Error: ${fuzoError.message}`);
    } else {
      console.log(
        `   📊 Found ${fuzoUsers.length} users with fuzo.foodcop@gmail.com:`
      );
      fuzoUsers.forEach((user, index) => {
        console.log(`      ${index + 1}. ID: ${user.id}`);
        console.log(`         Username: ${user.username}`);
        console.log(`         Display Name: ${user.display_name}`);
        console.log(`         Is Master Bot: ${user.is_master_bot}`);
        console.log(`         Created: ${user.created_at}`);
        console.log(`         Points: ${user.total_points}`);
      });
    }

    // Check for any duplicate emails in the users table
    console.log("\n📋 Checking for all duplicate emails:");
    const { data: allUsers, error: allUsersError } = await supabase
      .from("users")
      .select("id, email, username, display_name, is_master_bot, created_at");

    if (allUsersError) {
      console.log(`   ❌ Error fetching all users: ${allUsersError.message}`);
    } else {
      // Group by email to find duplicates
      const emailGroups = {};
      allUsers.forEach((user) => {
        if (!emailGroups[user.email]) {
          emailGroups[user.email] = [];
        }
        emailGroups[user.email].push(user);
      });

      const duplicateEmails = Object.entries(emailGroups).filter(
        ([email, users]) => users.length > 1
      );

      if (duplicateEmails.length > 0) {
        console.log(
          `   ⚠️ Found ${duplicateEmails.length} emails with duplicates:`
        );
        duplicateEmails.forEach(([email, users]) => {
          console.log(`\n   📧 ${email}:`);
          users.forEach((user, index) => {
            console.log(`      ${index + 1}. ID: ${user.id}`);
            console.log(`         Username: ${user.username}`);
            console.log(`         Display Name: ${user.display_name}`);
            console.log(`         Is Master Bot: ${user.is_master_bot}`);
            console.log(`         Created: ${user.created_at}`);
          });
        });
      } else {
        console.log(`   ✅ No duplicate emails found`);
      }

      // Check for duplicate usernames too
      const usernameGroups = {};
      allUsers.forEach((user) => {
        if (!usernameGroups[user.username]) {
          usernameGroups[user.username] = [];
        }
        usernameGroups[user.username].push(user);
      });

      const duplicateUsernames = Object.entries(usernameGroups).filter(
        ([username, users]) => users.length > 1
      );

      if (duplicateUsernames.length > 0) {
        console.log(
          `\n   ⚠️ Found ${duplicateUsernames.length} usernames with duplicates:`
        );
        duplicateUsernames.forEach(([username, users]) => {
          console.log(`\n   👤 @${username}:`);
          users.forEach((user, index) => {
            console.log(`      ${index + 1}. ID: ${user.id}`);
            console.log(`         Email: ${user.email}`);
            console.log(`         Display Name: ${user.display_name}`);
            console.log(`         Is Master Bot: ${user.is_master_bot}`);
            console.log(`         Created: ${user.created_at}`);
          });
        });
      } else {
        console.log(`   ✅ No duplicate usernames found`);
      }
    }

    console.log("\n📝 Recommendations:");
    console.log("   1. Identify which duplicate user should be kept");
    console.log("   2. Merge any important data from the duplicate");
    console.log("   3. Delete the duplicate user");
    console.log("   4. Ensure no references to the deleted user exist");
  } catch (error) {
    console.error("❌ Error checking duplicate users:", error.message);
  }
}

checkDuplicateUsers();
