// Check Supabase Auth users using the auth admin API
// Run with: node scripts/check-supabase-auth-users.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSupabaseAuthUsers() {
  try {
    console.log("🔍 Checking Supabase Auth users...");

    // Try to use the auth admin API to list users
    console.log("\n📋 AUTH USERS (via auth.admin.listUsers):");
    try {
      const { data: authUsers, error: authError } =
        await supabase.auth.admin.listUsers();

      if (authError) {
        console.log(`   ❌ Error accessing auth users: ${authError.message}`);
      } else {
        console.log(
          `   📊 Found ${authUsers.users.length} users in auth.users:`
        );
        authUsers.users.forEach((user, index) => {
          console.log(`      ${index + 1}. ${user.email}`);
          console.log(`         ID: ${user.id}`);
          console.log(`         Created: ${user.created_at}`);
          console.log(`         Email Confirmed: ${user.email_confirmed_at}`);
          console.log(`         Last Sign In: ${user.last_sign_in_at}`);
          console.log("");
        });
      }
    } catch (err) {
      console.log(`   ❌ Cannot access auth users: ${err.message}`);
      console.log(
        `   💡 This might require different permissions or API approach`
      );
    }

    // Check for fuzo.foodcop@gmail.com specifically
    console.log("\n📋 CHECKING FUZO.FOODCOP@GMAIL.COM IN AUTH:");
    try {
      const { data: fuzoAuth, error: fuzoAuthError } =
        await supabase.auth.admin.getUserByEmail("fuzo.foodcop@gmail.com");

      if (fuzoAuthError) {
        console.log(`   ❌ Error checking auth user: ${fuzoAuthError.message}`);
      } else if (fuzoAuth.user) {
        console.log(`   ✅ Found in AUTH.USERS:`);
        console.log(`      ID: ${fuzoAuth.user.id}`);
        console.log(`      Email: ${fuzoAuth.user.email}`);
        console.log(`      Created: ${fuzoAuth.user.created_at}`);
        console.log(
          `      Email Confirmed: ${fuzoAuth.user.email_confirmed_at}`
        );
        console.log(`      Last Sign In: ${fuzoAuth.user.last_sign_in_at}`);
      } else {
        console.log(`   ❌ fuzo.foodcop@gmail.com NOT found in auth.users`);
      }
    } catch (err) {
      console.log(`   ❌ Cannot check auth user: ${err.message}`);
    }

    // Compare with public.users
    console.log("\n📋 COMPARISON WITH PUBLIC.USERS:");
    const { data: fuzoPublic, error: fuzoPublicError } = await supabase
      .from("users")
      .select("*")
      .eq("email", "fuzo.foodcop@gmail.com")
      .single();

    if (fuzoPublicError) {
      console.log(
        `   ❌ Error checking public user: ${fuzoPublicError.message}`
      );
    } else {
      console.log(`   ✅ Found in PUBLIC.USERS:`);
      console.log(`      ID: ${fuzoPublic.id}`);
      console.log(`      Email: ${fuzoPublic.email}`);
      console.log(`      Username: ${fuzoPublic.username}`);
      console.log(`      Display Name: ${fuzoPublic.display_name}`);
      console.log(`      Created: ${fuzoPublic.created_at}`);
    }

    console.log("\n📚 SUPABASE ARCHITECTURE EXPLAINED:");
    console.log("   ");
    console.log("   🏗️ WHY TWO TABLES?");
    console.log("   - auth.users: Supabase's built-in authentication system");
    console.log("   - public.users: Your custom user profiles table");
    console.log("   ");
    console.log("   🔐 AUTH.USERS (Supabase Auth):");
    console.log("   - Managed by Supabase Auth service");
    console.log("   - Stores: email, password hash, email confirmation, etc.");
    console.log("   - Used for: login, signup, password reset, etc.");
    console.log("   - Cannot be directly modified by your app");
    console.log("   ");
    console.log("   👤 PUBLIC.USERS (Your Custom Table):");
    console.log("   - Managed by your application");
    console.log("   - Stores: username, display_name, avatar, bio, etc.");
    console.log("   - Used for: user profiles, social features, etc.");
    console.log("   - Can be modified by your app");
    console.log("   ");
    console.log("   🔗 THE CONNECTION:");
    console.log("   - Both tables should use the SAME UUID");
    console.log("   - auth.users.id === public.users.id");
    console.log("   - This links authentication with profile data");

    console.log("\n⚠️ COMMON ISSUES:");
    console.log("   1. User exists in auth.users but not in public.users");
    console.log("   2. User exists in public.users but not in auth.users");
    console.log("   3. Same user has DIFFERENT UUIDs in both tables");
    console.log("   4. Duplicate users with same email but different UUIDs");

    console.log("\n✅ IDEAL SOLUTION:");
    console.log(
      "   1. Use Supabase Auth triggers to auto-create public.users entries"
    );
    console.log("   2. Ensure both tables always use the same UUID");
    console.log("   3. Handle edge cases where users exist in only one table");
  } catch (error) {
    console.error("❌ Error checking Supabase Auth users:", error.message);
  }
}

checkSupabaseAuthUsers();
