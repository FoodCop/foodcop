// Check users table schema
// Run with: node scripts/check-users-schema.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkUsersSchema() {
  try {
    const { data, error } = await supabase.from("users").select("*").limit(1);

    if (error) {
      console.error("Error:", error);
      return;
    }

    if (data && data.length > 0) {
      console.log("Users table columns:");
      Object.keys(data[0]).forEach((key) => {
        console.log(`   - ${key}`);
      });
    } else {
      console.log("No users found, checking schema...");

      // Try to get schema info
      const { data: schemaData, error: schemaError } = await supabase
        .from("users")
        .select("*")
        .limit(0);

      if (schemaError) {
        console.error("Schema error:", schemaError);
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkUsersSchema();
