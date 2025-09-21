#!/usr/bin/env node

/**
 * Test AI Integration
 *
 * This script tests the AI integration to make sure everything is working properly.
 */

// Note: This test requires TypeScript compilation or a different approach
// For now, we'll test the environment variables directly

// import { getAIConfig, isAIConfigured } from './lib/ai-config.js';

async function testAIIntegration() {
  console.log("🧪 Testing AI Integration");
  console.log("=========================\n");

  // Test AI configuration
  console.log("1. Testing AI Configuration...");
  try {
    const openaiKey =
      process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    const configured = !!openaiKey && openaiKey !== "your_openai_api_key_here";

    console.log(`   OpenAI API Key: ${openaiKey ? "SET" : "NOT SET"}`);
    console.log(`   Model: gpt-4o-mini (default)`);
    console.log(`   Configured: ${configured ? "✅" : "❌"}`);

    if (configured) {
      console.log("   ✅ AI is properly configured!");
    } else {
      console.log("   ❌ AI is not configured. Please run: npm run setup:ai");
    }
  } catch (error) {
    console.log(`   ❌ Error testing AI config: ${error.message}`);
  }

  // Test environment variables
  console.log("\n2. Testing Environment Variables...");
  const envVars = [
    "OPENAI_API_KEY",
    "VITE_OPENAI_API_KEY",
    "GOOGLE_MAPS_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
  ];

  envVars.forEach((varName) => {
    const value = process.env[varName];
    const status = value ? "✅" : "❌";
    const display = value ? `${value.substring(0, 8)}...` : "NOT SET";
    console.log(`   ${status} ${varName}: ${display}`);
  });

  // Test AI API endpoints
  console.log("\n3. Testing AI API Endpoints...");
  const endpoints = [
    "/api/ai/status",
    "/api/ai/chat",
    "/api/ai/complete",
    "/api/ai/actions",
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:5173${endpoint}`, {
        method: endpoint === "/api/ai/status" ? "GET" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body:
          endpoint !== "/api/ai/status"
            ? JSON.stringify({ test: true })
            : undefined,
      });

      const status = response.ok ? "✅" : "❌";
      console.log(
        `   ${status} ${endpoint}: ${response.status} ${response.statusText}`
      );
    } catch (error) {
      console.log(`   ❌ ${endpoint}: ${error.message}`);
    }
  }

  console.log("\n🎉 AI Integration Test Complete!");
  console.log("================================");
  console.log("If you see any ❌ errors above, please:");
  console.log("1. Run: npm run setup:ai");
  console.log("2. Start the dev server: npm run dev");
  console.log("3. Test the AI assistant in the browser");
}

testAIIntegration().catch(console.error);
