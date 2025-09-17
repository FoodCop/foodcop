import "dotenv/config";

/**
 * Test script for Supabase MCP Master Bot seeding
 * Tests the complete flow: MCP connection → database health → seeding → verification
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables:");
  console.error("   SUPABASE_URL:", !!SUPABASE_URL);
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", !!SUPABASE_SERVICE_ROLE_KEY);
  process.exit(1);
}

const MCP_BASE_URL = `${SUPABASE_URL}/functions/v1/make-server-5976446e/db`;

async function mcpRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${MCP_BASE_URL}${endpoint}`;
  const headers = {
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  console.log(`🔍 MCP Request: ${options.method || "GET"} ${endpoint}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    console.error(`❌ MCP Error ${response.status}:`, data);
    throw new Error(`MCP request failed: ${response.status}`);
  }

  console.log(`✅ MCP Success:`, data);
  return data;
}

async function testMCPConnection() {
  console.log("\n🔗 Testing MCP Connection...");

  try {
    // Test basic health check
    await mcpRequest("/health");

    // Test table listing
    const tables = await mcpRequest("/tables");
    console.log(`📋 Found ${tables.tables?.length || 0} tables`);

    // Test if master_bots table exists
    if (tables.tables?.includes("master_bots")) {
      console.log("✅ master_bots table found");
    } else {
      console.log("⚠️ master_bots table not found");
    }

    return true;
  } catch (error) {
    console.error("❌ MCP Connection failed:", error);
    return false;
  }
}

async function testDatabaseSchema() {
  console.log("\n📊 Testing Database Schema...");

  try {
    // Check users table structure
    const usersSchema = await mcpRequest("/describe/users");
    console.log(
      `👥 Users table has ${usersSchema.columns?.length || 0} columns`
    );

    // Check if is_master_bot column exists
    const hasMasterBotColumn = usersSchema.columns?.some(
      (col: any) => col.column_name === "is_master_bot"
    );

    if (hasMasterBotColumn) {
      console.log("✅ is_master_bot column found in users table");
    } else {
      console.log("⚠️ is_master_bot column missing from users table");
    }

    // Check master_bots table if it exists
    try {
      const masterBotsSchema = await mcpRequest("/describe/master_bots");
      console.log(
        `🤖 master_bots table has ${
          masterBotsSchema.columns?.length || 0
        } columns`
      );
    } catch {
      console.log("⚠️ master_bots table not accessible or doesn't exist");
    }

    return true;
  } catch (error) {
    console.error("❌ Schema check failed:", error);
    return false;
  }
}

async function testSeeding() {
  console.log("\n🌱 Testing Master Bot Seeding...");

  try {
    // Check current master bots
    const currentBots = await mcpRequest("/master-bots");
    console.log(`🤖 Current master bots: ${currentBots.count || 0}`);

    // Attempt seeding
    console.log("🚀 Starting seeding process...");
    const seedResult = await mcpRequest("/seed/master-bots", {
      method: "POST",
    });

    console.log("✅ Seeding completed:", seedResult.message);

    // Verify seeding worked
    const updatedBots = await mcpRequest("/master-bots");
    console.log(`🎉 Master bots after seeding: ${updatedBots.count || 0}`);

    if (updatedBots.master_bots?.length > 0) {
      console.log("📋 Seeded bots:");
      updatedBots.master_bots.forEach((bot: any) => {
        console.log(`   - ${bot.display_name} (@${bot.username})`);
      });
    }

    return true;
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    return false;
  }
}

async function testDataRetrieval() {
  console.log("\n🔍 Testing Data Retrieval...");

  try {
    // Test sampling master bot users
    const botUsers = await mcpRequest("/sample/users?limit=10");
    const masterBotUsers = botUsers.rows?.filter(
      (user: any) => user.is_master_bot
    );

    console.log(
      `👥 Found ${masterBotUsers?.length || 0} master bot users in sample`
    );

    if (masterBotUsers?.length > 0) {
      console.log("🤖 Sample master bot users:");
      masterBotUsers.slice(0, 3).forEach((bot: any) => {
        console.log(
          `   - ${bot.display_name} (${bot.username}) - ${bot.total_points} points`
        );
      });
    }

    return true;
  } catch (error) {
    console.error("❌ Data retrieval failed:", error);
    return false;
  }
}

async function runTests() {
  console.log("🧪 Starting Supabase MCP Master Bot Testing Suite\n");
  console.log(`📍 Testing against: ${SUPABASE_URL}`);
  console.log(
    `🔑 Using service role: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`
  );

  const results = {
    connection: false,
    schema: false,
    seeding: false,
    retrieval: false,
  };

  try {
    results.connection = await testMCPConnection();
    if (results.connection) {
      results.schema = await testDatabaseSchema();
      if (results.schema) {
        results.seeding = await testSeeding();
        if (results.seeding) {
          results.retrieval = await testDataRetrieval();
        }
      }
    }
  } catch (error) {
    console.error("❌ Test suite failed:", error);
  }

  console.log("\n📊 Test Results Summary:");
  console.log(`   🔗 MCP Connection: ${results.connection ? "✅" : "❌"}`);
  console.log(`   📊 Database Schema: ${results.schema ? "✅" : "❌"}`);
  console.log(`   🌱 Bot Seeding: ${results.seeding ? "✅" : "❌"}`);
  console.log(`   🔍 Data Retrieval: ${results.retrieval ? "✅" : "❌"}`);

  const allPassed = Object.values(results).every(Boolean);

  if (allPassed) {
    console.log(
      "\n🎉 All tests passed! Master Bot seeding is working correctly."
    );
    process.exit(0);
  } else {
    console.log(
      "\n❌ Some tests failed. Please check the configuration and try again."
    );
    process.exit(1);
  }
}

// Run the test suite
runTests().catch((error) => {
  console.error("💥 Test suite crashed:", error);
  process.exit(1);
});









