#!/usr/bin/env node

/**
 * Test Supabase MCP Connection
 * This script helps test and run the Supabase MCP server
 */

import { spawn } from "child_process";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("🔧 Supabase MCP Connection Test");
console.log("=================================");

if (!SUPABASE_URL) {
  console.error("❌ SUPABASE_URL not found in environment");
  console.log("💡 Make sure to set it in .env.local:");
  console.log("   SUPABASE_URL=https://lgladnskxmbkhcnrsfxv.supabase.co");
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY not found in environment");
  console.log(
    "💡 Get it from: Supabase Dashboard > Settings > API > service_role key"
  );
  console.log("💡 Add it to .env.local:");
  console.log("   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here");
  process.exit(1);
}

console.log("✅ Environment variables loaded:");
console.log(`   SUPABASE_URL: ${SUPABASE_URL}`);
console.log(
  `   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY.substring(
    0,
    20
  )}...`
);

console.log("\n🚀 Starting Supabase MCP Server...");

// Run the Supabase MCP server
const mcpProcess = spawn(
  "npx",
  ["-y", "@supabase/mcp-server-supabase@latest"],
  {
    env: {
      ...process.env,
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    },
    stdio: ["pipe", "pipe", "inherit"],
  }
);

mcpProcess.stdout.on("data", (data) => {
  console.log("📡 MCP Server:", data.toString());
});

mcpProcess.on("error", (error) => {
  console.error("❌ MCP Server error:", error);
});

mcpProcess.on("close", (code) => {
  console.log(`🏁 MCP Server exited with code ${code}`);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down MCP Server...");
  mcpProcess.kill("SIGINT");
  process.exit(0);
});

console.log("✅ MCP Server started! Press Ctrl+C to stop.");
console.log("📝 This server will provide MCP tools for Cursor IDE.");







