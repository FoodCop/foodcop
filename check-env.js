#!/usr/bin/env node

/**
 * Environment Variable Checker
 * Run this script to debug environment variable loading issues
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔍 Environment Variable Debug Checker");
console.log("=====================================\n");

// Check if .env or .env.local file exists
const envPath = path.join(process.cwd(), ".env");
const envLocalPath = path.join(process.cwd(), ".env.local");
const envExists = fs.existsSync(envPath);
const envLocalExists = fs.existsSync(envLocalPath);

console.log("📁 File System Check:");
console.log(`- .env file exists: ${envExists ? "✅ Yes" : "❌ No"}`);
console.log(`- .env.local file exists: ${envLocalExists ? "✅ Yes" : "❌ No"}`);

if (envExists) {
  try {
    const envContent = fs.readFileSync(envPath, "utf8");
    const lines = envContent.split("\n");
    const hasGoogleKey = lines.some((line) =>
      line.startsWith("VITE_GOOGLE_MAPS_API_KEY=")
    );

    console.log(`- .env file readable: ✅ Yes`);
    console.log(
      `- Contains Google Maps key: ${hasGoogleKey ? "✅ Yes" : "❌ No"}`
    );
    console.log(`- File size: ${envContent.length} characters`);
    console.log(`- Number of lines: ${lines.length}`);

    if (hasGoogleKey) {
      const keyLine = lines.find((line) =>
        line.startsWith("VITE_GOOGLE_MAPS_API_KEY=")
      );
      const keyValue = keyLine.split("=")[1];
      console.log(`- Key length: ${keyValue?.length || 0} characters`);
      console.log(
        `- Key starts with AIza: ${
          keyValue?.startsWith("AIza") ? "✅ Yes" : "❌ No"
        }`
      );
      console.log(
        `- Key preview: ${
          keyValue ? keyValue.substring(0, 12) + "..." : "Empty"
        }`
      );
    }
  } catch (error) {
    console.log(`- .env file readable: ❌ No (${error.message})`);
  }
}

if (envLocalExists) {
  try {
    const envLocalContent = fs.readFileSync(envLocalPath, "utf8");
    const lines = envLocalContent.split("\n");
    const hasGoogleKey = lines.some((line) =>
      line.startsWith("VITE_GOOGLE_MAPS_API_KEY=")
    );

    console.log(`- .env.local file readable: ✅ Yes`);
    console.log(
      `- Contains Google Maps key: ${hasGoogleKey ? "✅ Yes" : "❌ No"}`
    );
    console.log(`- File size: ${envLocalContent.length} characters`);
    console.log(`- Number of lines: ${lines.length}`);

    if (hasGoogleKey) {
      const keyLine = lines.find((line) =>
        line.startsWith("VITE_GOOGLE_MAPS_API_KEY=")
      );
      const keyValue = keyLine.split("=")[1];
      console.log(`- Key length: ${keyValue?.length || 0} characters`);
      console.log(
        `- Key starts with AIza: ${
          keyValue?.startsWith("AIza") ? "✅ Yes" : "❌ No"
        }`
      );
      console.log(
        `- Key preview: ${
          keyValue ? keyValue.substring(0, 12) + "..." : "Empty"
        }`
      );
    }
  } catch (error) {
    console.log(`- .env.local file readable: ❌ No (${error.message})`);
  }
}

if (!envExists && !envLocalExists) {
  console.log("💡 Create a .env file in your project root with:");
  console.log("   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here");
}

console.log("\n🔧 Process Environment Check:");
console.log(`- NODE_ENV: ${process.env.NODE_ENV || "undefined"}`);
console.log(`- Process CWD: ${process.cwd()}`);
console.log(
  `- VITE_GOOGLE_MAPS_API_KEY in process.env: ${
    !!process.env.VITE_GOOGLE_MAPS_API_KEY ? "✅ Yes" : "❌ No"
  }`
);

if (process.env.VITE_GOOGLE_MAPS_API_KEY) {
  console.log(
    `- Process env key length: ${process.env.VITE_GOOGLE_MAPS_API_KEY.length}`
  );
  console.log(
    `- Process env key preview: ${process.env.VITE_GOOGLE_MAPS_API_KEY.substring(
      0,
      12
    )}...`
  );
}

console.log("\n🚀 Recommended Actions:");
console.log("1. Ensure your .env file is in the project root directory");
console.log(
  "2. Restart your development server completely (stop and start again)"
);
console.log("3. Clear browser cache and hard refresh");
console.log("4. Make sure there are no spaces around the = in your .env file");
console.log("5. Check that your .env file doesn't have any special characters");

console.log("\n📝 Example .env file format:");
console.log("VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE");
console.log("# No spaces around = sign");
console.log("# No quotes needed");
console.log("# Must start with VITE_ for Vite to expose it to the browser");
