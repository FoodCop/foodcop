// Fix the UUID mismatch between auth.users and public.users
// Run with: node scripts/fix-user-uuid-mismatch.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUserUuidMismatch() {
  try {
    console.log(
      "🔧 Fixing UUID mismatch between auth.users and public.users..."
    );

    // The problem: fuzo.foodcop@gmail.com has different UUIDs in both tables
    const authUserId = "0bb7272a-953d-4ce6-b1ae-3fd51e2ba7a9"; // From auth.users
    const publicUserId = "ecb48e71-5511-43fd-a450-7143629c9ce0"; // From public.users

    console.log("\n📋 Current Situation:");
    console.log(`   AUTH.USERS ID: ${authUserId}`);
    console.log(`   PUBLIC.USERS ID: ${publicUserId}`);
    console.log(`   ❌ These are DIFFERENT - this is the problem!`);

    console.log("\n🎯 Solution Options:");
    console.log("   1. Update public.users to use the auth.users UUID");
    console.log(
      "   2. Delete the public.users entry and recreate with correct UUID"
    );
    console.log(
      "   3. Update auth.users to use the public.users UUID (NOT RECOMMENDED)"
    );

    console.log("\n✅ RECOMMENDED APPROACH:");
    console.log("   Option 1: Update public.users to use auth.users UUID");
    console.log("   - This preserves the authentication data");
    console.log("   - Updates the profile to link to the correct auth user");

    // Check if there are any references to the old public.users ID
    console.log("\n🔍 Checking for references to the old public.users ID:");
    const tablesToCheck = [
      "posts",
      "likes",
      "comments",
      "friends",
      "followers",
    ];

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .limit(1);

        if (error && error.message.includes("Could not find the table")) {
          console.log(`   📋 ${tableName}: Table doesn't exist`);
          continue;
        }

        // Check for references in common columns
        const possibleColumns = [
          "user_id",
          "author_id",
          "from_user_id",
          "to_user_id",
        ];
        let foundRefs = false;

        for (const column of possibleColumns) {
          try {
            const { data: refData, error: refError } = await supabase
              .from(tableName)
              .select("*")
              .eq(column, publicUserId)
              .limit(5);

            if (!refError && refData && refData.length > 0) {
              console.log(
                `   ⚠️ ${tableName}: Found ${refData.length} references to old ID in column '${column}'`
              );
              foundRefs = true;
            }
          } catch (err) {
            // Column doesn't exist, that's fine
          }
        }

        if (!foundRefs) {
          console.log(`   ✅ ${tableName}: No references to old ID`);
        }
      } catch (err) {
        console.log(`   📋 ${tableName}: Error - ${err.message}`);
      }
    }

    console.log("\n📝 SQL COMMANDS TO FIX THE ISSUE:");
    console.log("   ");
    console.log(
      "   -- Step 1: Update the public.users entry to use the auth.users UUID"
    );
    console.log(
      `   UPDATE users SET id = '${authUserId}' WHERE id = '${publicUserId}';`
    );
    console.log("   ");
    console.log("   -- Step 2: Verify the fix");
    console.log(
      "   SELECT id, email, username, display_name FROM users WHERE email = 'fuzo.foodcop@gmail.com';"
    );

    console.log("\n⚠️ IMPORTANT NOTES:");
    console.log(
      "   - This will change the UUID in public.users to match auth.users"
    );
    console.log(
      "   - Make sure no other tables reference the old public.users ID"
    );
    console.log("   - Test the fix thoroughly after applying");
    console.log(
      "   - Consider setting up triggers to prevent this in the future"
    );

    console.log("\n🔧 FUTURE PREVENTION:");
    console.log(
      "   - Set up a trigger to auto-create public.users entries when auth.users are created"
    );
    console.log(
      "   - Always use auth.users.id when creating public.users entries"
    );
    console.log("   - Add validation to ensure UUIDs match between tables");
  } catch (error) {
    console.error("❌ Error analyzing UUID mismatch:", error.message);
  }
}

fixUserUuidMismatch();
