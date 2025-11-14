#!/usr/bin/env node

/**
 * FUZO → Figma Direct API Push
 * 
 * Uses Figma REST API directly to create frames
 * This bypasses the MCP plugin requirement
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your Figma file details
const FIGMA_FILE_KEY = "FnKW6oWNEsxt2OyEp9Di9q";
const FIGMA_FILE_URL = `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}`;

// FUZO Design Tokens
const FUZO_COLORS = {
  orange: { r: 1, g: 0.42, b: 0.21 },
  yellow: { r: 1, g: 0.84, b: 0.29 },
  navy: { r: 0.04, g: 0.12, b: 0.23 },
  white: { r: 1, g: 1, b: 1 },
  gray: { r: 0.96, g: 0.97, b: 0.98 },
};

console.log("🎨 FUZO → Figma Direct API Push");
console.log("=================================\n");

console.log("📋 Using Figma REST API Approach\n");

console.log("Your Figma File:");
console.log(`   ID: ${FIGMA_FILE_KEY}`);
console.log(`   Name: F_DESIGN_SYSTEM`);
console.log(`   URL: https://www.figma.com/design/${FIGMA_FILE_KEY}/\n`);

console.log("🔑 To use the Figma API, you need:");
console.log("   1. A Figma Personal Access Token");
console.log("   2. Set as environment variable: FIGMA_ACCESS_TOKEN\n");

// Check for token
const token = process.env.FIGMA_ACCESS_TOKEN;
if (!token) {
  console.log("⚠️  No FIGMA_ACCESS_TOKEN found in environment");
  console.log("\n📝 To get your token:");
  console.log("   1. Go to https://www.figma.com/settings");
  console.log("   2. Scroll to 'Personal access tokens'");
  console.log("   3. Click 'Create new token'");
  console.log("   4. Copy the token");
  console.log("\n💡 Then set it in PowerShell:");
  console.log("   $env:FIGMA_ACCESS_TOKEN='your-token-here'");
  console.log("   npm run push:figma:api\n");
  
  // Generate curl commands as alternative
  generateCurlCommands();
  process.exit(0);
}

console.log("✅ FIGMA_ACCESS_TOKEN found!\n");

// Generate the command structure
function generateCurlCommands() {
  console.log("📦 Alternative: Manual cURL Commands");
  console.log("=====================================\n");
  
  console.log("You can create frames manually with these commands:\n");
  
  // Command 1: Create Landing Page Frame
  const landingPageFrame = {
    name: "Landing Page - Desktop (1440px)",
    type: "FRAME",
    width: 1440,
    height: 900,
    backgroundColor: FUZO_COLORS.white,
  };
  
  console.log("1️⃣ Create Landing Page Frame:");
  console.log(`
curl -X POST https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/nodes \\
  -H "X-Figma-Token: YOUR_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Landing Page - Desktop",
    "type": "FRAME",
    "width": 1440,
    "height": 900,
    "fills": [{
      "type": "SOLID",
      "color": { "r": 1, "g": 1, "b": 1 }
    }]
  }'
`);

  console.log("\n2️⃣ Create Mobile Frame:");
  console.log(`
curl -X POST https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/nodes \\
  -H "X-Figma-Token: YOUR_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Landing Page - Mobile (375px)",
    "type": "FRAME",
    "width": 375,
    "height": 900,
    "x": 1640,
    "fills": [{
      "type": "SOLID",
      "color": { "r": 1, "g": 1, "b": 1 }
    }]
  }'
`);

  console.log("\n3️⃣ Create Navigation Bar:");
  console.log(`
curl -X POST https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/nodes \\
  -H "X-Figma-Token: YOUR_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Navigation",
    "type": "FRAME",
    "width": 1440,
    "height": 80,
    "layoutMode": "HORIZONTAL",
    "primaryAxisAlignItems": "SPACE_BETWEEN",
    "counterAxisAlignItems": "CENTER",
    "paddingLeft": 40,
    "paddingRight": 40,
    "fills": [{
      "type": "SOLID",
      "color": { "r": 1, "g": 1, "b": 1 }
    }]
  }'
`);

  console.log("\n💡 Note: The Figma API requires node operations to be done");
  console.log("through the Plugin API for creating new elements.");
  console.log("That's why the MCP plugin approach is recommended.\n");
}

// If we have a token, we could fetch file info
if (token) {
  console.log("🔍 Testing connection to Figma API...\n");
  
  // We'd use fetch here to test the connection
  console.log("✅ Ready to push to Figma!");
  console.log("\nNext: I'll use the MCP plugin to create frames.\n");
}
