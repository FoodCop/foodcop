#!/usr/bin/env node

/**
 * Vercel Environment Variables Setup Helper
 * This script helps you set up environment variables in Vercel
 */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

console.log("🚀 Vercel Environment Variables Setup Helper\n");

// Required environment variables
const requiredVars = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_GOOGLE_MAPS_API_KEY",
  "VITE_SPOONACULAR_API_KEY",
];

console.log("📋 Environment Variables to Add to Vercel:\n");

let allPresent = true;

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (value && value !== `your_${varName.toLowerCase()}_here`) {
    console.log(`✅ ${varName}=${value}`);
  } else {
    console.log(`❌ ${varName}=[MISSING - Add this to Vercel]`);
    allPresent = false;
  }
});

console.log("\n🔧 How to Add These to Vercel:");
console.log("1. Go to https://vercel.com");
console.log("2. Select your project");
console.log("3. Go to Settings → Environment Variables");
console.log("4. Add each variable above");
console.log("5. Redeploy your project");

console.log("\n🌐 Supabase Configuration:");
console.log("1. Go to https://supabase.com");
console.log("2. Select your project");
console.log("3. Go to Settings → API");
console.log("4. Copy the URL and anon key");
console.log("5. Add your production domain to Site URL");

if (allPresent) {
  console.log(
    "\n✅ All required environment variables are present in .env.local"
  );
  console.log("💡 Copy the values above to your Vercel project settings");
} else {
  console.log("\n❌ Some environment variables are missing from .env.local");
  console.log("💡 Make sure your .env.local file has all required variables");
}

console.log("\n🔍 After adding variables to Vercel:");
console.log("1. Redeploy your project");
console.log("2. Check the debug component on your production site");
console.log("3. Verify all variables show as '✅ Set'");
console.log("4. Remove the debug component once everything works");
