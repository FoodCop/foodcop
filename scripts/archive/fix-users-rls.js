// Fix RLS policies for users table
// Run with: node scripts/fix-users-rls.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUsersRLS() {
  try {
    console.log("🔧 Fixing users RLS policies...");

    // Step 1: Drop existing policies
    console.log("📝 Dropping existing policies...");
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view their own profile" ON users;',
      'DROP POLICY IF EXISTS "Users can update their own profile" ON users;',
      'DROP POLICY IF EXISTS "Users can insert their own profile" ON users;',
    ];

    for (const sql of dropPolicies) {
      const { error } = await supabase.rpc("exec", { sql });
      if (error) {
        console.warn(`⚠️ Warning dropping policy: ${error.message}`);
      }
    }

    // Step 2: Create new policies
    console.log("📝 Creating new policies...");

    // Policy 1: Public read access to Master Bot profiles
    const { error: policy1Error } = await supabase.rpc("exec", {
      sql: `CREATE POLICY "Public can read master bot profiles" ON users
            FOR SELECT
            TO anon, authenticated
            USING (is_master_bot = true);`,
    });
    if (policy1Error) {
      console.error(
        "❌ Error creating public master bot policy:",
        policy1Error.message
      );
    } else {
      console.log("✅ Created public master bot read policy");
    }

    // Policy 2: Users can view their own profile
    const { error: policy2Error } = await supabase.rpc("exec", {
      sql: `CREATE POLICY "Users can view their own profile" ON users
            FOR SELECT
            TO authenticated
            USING (auth.uid() = id);`,
    });
    if (policy2Error) {
      console.error(
        "❌ Error creating user view policy:",
        policy2Error.message
      );
    } else {
      console.log("✅ Created user view own profile policy");
    }

    // Policy 3: Users can update their own profile
    const { error: policy3Error } = await supabase.rpc("exec", {
      sql: `CREATE POLICY "Users can update their own profile" ON users
            FOR UPDATE
            TO authenticated
            USING (auth.uid() = id);`,
    });
    if (policy3Error) {
      console.error(
        "❌ Error creating user update policy:",
        policy3Error.message
      );
    } else {
      console.log("✅ Created user update own profile policy");
    }

    // Policy 4: Users can insert their own profile
    const { error: policy4Error } = await supabase.rpc("exec", {
      sql: `CREATE POLICY "Users can insert their own profile" ON users
            FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = id);`,
    });
    if (policy4Error) {
      console.error(
        "❌ Error creating user insert policy:",
        policy4Error.message
      );
    } else {
      console.log("✅ Created user insert own profile policy");
    }

    console.log("🎉 RLS policies updated successfully!");

    // Test the new policies
    console.log("🧪 Testing new policies...");

    // Test anonymous access to master bots
    const anonClient = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    const { data: masterBots, error: masterBotsError } = await anonClient
      .from("users")
      .select("id, username, display_name, is_master_bot")
      .eq("is_master_bot", true);

    if (masterBotsError) {
      console.error(
        "❌ Error testing anonymous access to master bots:",
        masterBotsError.message
      );
    } else {
      console.log(
        `✅ Anonymous access works! Found ${masterBots.length} master bots`
      );
      masterBots.forEach((bot) => {
        console.log(`   - ${bot.display_name} (@${bot.username})`);
      });
    }
  } catch (error) {
    console.error("❌ Error fixing RLS policies:", error.message);
  }
}

fixUsersRLS();

