#!/usr/bin/env node

/**
 * Environment Variables Checker
 * Checks if all required environment variables are properly set
 */

import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔍 Checking FUZO Environment Variables...\n");

// Check if .env.local exists
const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local file not found!");
  console.log("💡 Create a .env.local file with your environment variables.");
  process.exit(1);
}

console.log("✅ .env.local file found");

// Load environment variables
config({ path: envPath });

// Required environment variables
const requiredVars = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_GOOGLE_MAPS_API_KEY",
];

// Optional environment variables
const optionalVars = [
  "VITE_OPENAI_API_KEY",
  "VITE_STREAM_CHAT_API_KEY",
  "SPOONACULAR_API_KEY",
];

console.log("\n📋 Required Variables:");
let allRequired = true;
requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (value && value !== `your_${varName.toLowerCase()}_here`) {
    const displayValue =
      value.length > 30 ? `${value.substring(0, 30)}...` : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: ${value ? "Using default value" : "Not set"}`);
    allRequired = false;
  }
});

console.log("\n📋 Optional Variables:");
optionalVars.forEach((varName) => {
  const value = process.env[varName];
  if (value && value !== `your_${varName.toLowerCase()}_here`) {
    const displayValue =
      value.length > 30 ? `${value.substring(0, 30)}...` : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`⚠️ ${varName}: ${value ? "Using default value" : "Not set"}`);
  }
});

console.log("\n🔍 Vite Environment Check:");
console.log(
  "Note: Vite environment variables are only available in the browser."
);
console.log(
  "Make sure to restart your development server after changing .env.local"
);

if (allRequired) {
  console.log("\n🎉 All required environment variables are set!");
  console.log("💡 If you're still having issues, try:");
  console.log("   1. Restart your development server");
  console.log("   2. Clear browser cache");
  console.log("   3. Check browser console for detailed error messages");
} else {
  console.log("\n❌ Some required environment variables are missing.");
  console.log(
    "💡 Please update your .env.local file with the missing variables."
  );
  process.exit(1);
}
