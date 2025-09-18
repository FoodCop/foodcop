#!/usr/bin/env node

/**
 * Vercel CLI Environment Variables Setup
 * Automatically sets up environment variables in Vercel using the CLI
 */

import { execSync } from "child_process";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

console.log("🚀 Setting up Vercel Environment Variables via CLI\n");

// Get Vercel credentials
const VERCEL_ACCESS_TOKEN = process.env.VERCEL_ACCESS_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

if (!VERCEL_ACCESS_TOKEN || !VERCEL_PROJECT_ID) {
  console.error("❌ Missing Vercel credentials in .env.local");
  console.error(
    "Make sure you have VERCEL_ACCESS_TOKEN and VERCEL_PROJECT_ID set"
  );
  process.exit(1);
}

console.log(`📋 Project ID: ${VERCEL_PROJECT_ID}`);
console.log(`🔑 Access Token: ${VERCEL_ACCESS_TOKEN.substring(0, 10)}...\n`);

// Required environment variables
const envVars = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  VITE_GOOGLE_MAPS_API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY,
  VITE_SPOONACULAR_API_KEY: process.env.VITE_SPOONACULAR_API_KEY,
};

// Set environment variables using Vercel CLI
async function setVercelEnvVars() {
  console.log("🔧 Setting environment variables in Vercel...\n");

  for (const [key, value] of Object.entries(envVars)) {
    if (!value || value === `your_${key.toLowerCase()}_here`) {
      console.log(`❌ Skipping ${key} - value not set or is placeholder`);
      continue;
    }

    try {
      console.log(`Setting ${key}...`);

      // Use Vercel CLI to set environment variable
      const command = `vercel env add ${key} production --token ${VERCEL_ACCESS_TOKEN}`;

      // Create a temporary input file for the value
      const fs = await import("fs");
      const tempFile = `temp_${key}.txt`;
      fs.writeFileSync(tempFile, value);

      // Execute the command with input from file
      execSync(
        `echo "${value}" | vercel env add ${key} production --token ${VERCEL_ACCESS_TOKEN}`,
        {
          stdio: "inherit",
          shell: true,
        }
      );

      // Clean up temp file
      fs.unlinkSync(tempFile);

      console.log(`✅ ${key} set successfully`);
    } catch (error) {
      console.error(`❌ Failed to set ${key}:`, error.message);
    }
  }
}

// List current environment variables
async function listCurrentEnvVars() {
  try {
    console.log("\n📋 Current Vercel Environment Variables:");
    execSync(`vercel env ls --token ${VERCEL_ACCESS_TOKEN}`, {
      stdio: "inherit",
      shell: true,
    });
  } catch (error) {
    console.error("❌ Failed to list environment variables:", error.message);
  }
}

// Main execution
async function main() {
  try {
    // First, let's check if we're logged in
    console.log("🔍 Checking Vercel authentication...");
    execSync(`vercel whoami --token ${VERCEL_PROJECT_ID}`, {
      stdio: "pipe",
      shell: true,
    });
    console.log("✅ Vercel authentication successful\n");

    // List current environment variables
    await listCurrentEnvVars();

    // Set new environment variables
    await setVercelEnvVars();

    // List environment variables again to confirm
    console.log("\n📋 Updated Environment Variables:");
    await listCurrentEnvVars();

    console.log("\n🎉 Environment variables setup complete!");
    console.log("💡 Next steps:");
    console.log("1. Redeploy your Vercel project");
    console.log("2. Check the debug component on your production site");
    console.log("3. Verify all variables show as '✅ Set'");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log("\n💡 Troubleshooting:");
    console.log("1. Make sure your Vercel access token is valid");
    console.log("2. Check that the project ID is correct");
    console.log("3. Try running: vercel login");
  }
}

main();
