// Check the relationship between auth.users and public.users
// Run with: node scripts/check-auth-vs-public-users.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAuthVsPublicUsers() {
  try {
    console.log("🔍 Checking auth.users vs public.users relationship...");

    // Check public.users table
    console.log("\n📋 PUBLIC.USERS TABLE:");
    const { data: publicUsers, error: publicUsersError } = await supabase
      .from("users")
      .select("id, email, username, display_name, is_master_bot, created_at")
      .order("created_at");

    if (publicUsersError) {
      console.log(
        `   ❌ Error fetching public users: ${publicUsersError.message}`
      );
    } else {
      console.log(`   📊 Found ${publicUsers.length} users in public.users:`);
      publicUsers.forEach((user, index) => {
        console.log(`      ${index + 1}. ${user.display_name} (${user.email})`);
        console.log(`         ID: ${user.id}`);
        console.log(`         Username: @${user.username}`);
        console.log(`         Is Master Bot: ${user.is_master_bot}`);
        console.log(`         Created: ${user.created_at}`);
        console.log("");
      });
    }

    // Try to access auth.users (this might not work with service role)
    console.log("\n📋 AUTH.USERS TABLE (via auth schema):");
    try {
      // Try to query auth.users directly
      const { data: authUsers, error: authUsersError } = await supabase
        .from("auth.users")
        .select("id, email, created_at, email_confirmed_at")
        .order("created_at");

      if (authUsersError) {
        console.log(
          `   ❌ Cannot access auth.users: ${authUsersError.message}`
        );
        console.log(
          `   💡 This is expected - auth.users is managed by Supabase Auth`
        );
      } else {
        console.log(`   📊 Found ${authUsers.length} users in auth.users:`);
        authUsers.forEach((user, index) => {
          console.log(`      ${index + 1}. ${user.email}`);
          console.log(`         ID: ${user.id}`);
          console.log(`         Created: ${user.created_at}`);
          console.log(`         Email Confirmed: ${user.email_confirmed_at}`);
          console.log("");
        });
      }
    } catch (err) {
      console.log(`   ❌ Cannot access auth.users: ${err.message}`);
      console.log(
        `   💡 This is expected - auth.users is managed by Supabase Auth`
      );
    }

    // Check for fuzo.foodcop@gmail.com specifically
    console.log("\n📋 CHECKING FUZO.FOODCOP@GMAIL.COM:");

    // In public.users
    const { data: fuzoPublic, error: fuzoPublicError } = await supabase
      .from("users")
      .select("*")
      .eq("email", "fuzo.foodcop@gmail.com");

    if (fuzoPublicError) {
      console.log(
        `   ❌ Error checking public users: ${fuzoPublicError.message}`
      );
    } else {
      console.log(`   📊 In PUBLIC.USERS: ${fuzoPublic.length} entries`);
      fuzoPublic.forEach((user, index) => {
        console.log(`      ${index + 1}. ID: ${user.id}`);
        console.log(`         Username: ${user.username}`);
        console.log(`         Display Name: ${user.display_name}`);
        console.log(`         Is Master Bot: ${user.is_master_bot}`);
        console.log(`         Created: ${user.created_at}`);
      });
    }

    // Try to check auth.users for the same email
    try {
      const { data: fuzoAuth, error: fuzoAuthError } = await supabase
        .from("auth.users")
        .select("*")
        .eq("email", "fuzo.foodcop@gmail.com");

      if (fuzoAuthError) {
        console.log(`   ❌ Cannot check auth.users: ${fuzoAuthError.message}`);
      } else {
        console.log(`   📊 In AUTH.USERS: ${fuzoAuth.length} entries`);
        fuzoAuth.forEach((user, index) => {
          console.log(`      ${index + 1}. ID: ${user.id}`);
          console.log(`         Email: ${user.email}`);
          console.log(`         Created: ${user.created_at}`);
        });
      }
    } catch (err) {
      console.log(`   ❌ Cannot check auth.users: ${err.message}`);
    }

    // Analyze the relationship
    console.log("\n📝 ANALYSIS:");
    console.log("   🔍 Why do we have both auth.users and public.users?");
    console.log("   ");
    console.log("   📚 SUPABASE ARCHITECTURE:");
    console.log(
      "   - auth.users: Managed by Supabase Auth (authentication system)"
    );
    console.log("   - public.users: Your custom user profiles table");
    console.log("   ");
    console.log("   🎯 TYPICAL SETUP:");
    console.log(
      "   - auth.users: Stores authentication data (email, password, etc.)"
    );
    console.log(
      "   - public.users: Stores user profile data (username, display_name, etc.)"
    );
    console.log("   - They should be linked by the same UUID");
    console.log("   ");
    console.log("   ⚠️ COMMON ISSUES:");
    console.log("   - Duplicate users with different UUIDs");
    console.log("   - Users in auth.users but not in public.users");
    console.log("   - Users in public.users but not in auth.users");
    console.log("   ");
    console.log("   ✅ IDEAL SETUP:");
    console.log("   - Each user has ONE UUID that exists in BOTH tables");
    console.log("   - auth.users: Authentication data");
    console.log("   - public.users: Profile data (linked by same UUID)");

    // Check if we can see any patterns
    console.log("\n🔍 CHECKING FOR PATTERNS:");

    // Look for users that might be duplicates
    if (publicUsers && publicUsers.length > 0) {
      const emails = publicUsers.map((u) => u.email);
      const duplicateEmails = emails.filter(
        (email, index) => emails.indexOf(email) !== index
      );

      if (duplicateEmails.length > 0) {
        console.log(
          `   ⚠️ Found duplicate emails in public.users: ${duplicateEmails.join(
            ", "
          )}`
        );
      } else {
        console.log(`   ✅ No duplicate emails in public.users`);
      }
    }

    console.log("\n💡 RECOMMENDATIONS:");
    console.log("   1. Check if fuzo.foodcop@gmail.com exists in auth.users");
    console.log("   2. If it does, ensure both tables use the SAME UUID");
    console.log(
      "   3. If not, you may need to create the auth user or link them"
    );
    console.log(
      "   4. Consider using Supabase Auth triggers to auto-create public.users entries"
    );
  } catch (error) {
    console.error("❌ Error checking auth vs public users:", error.message);
  }
}

checkAuthVsPublicUsers();
