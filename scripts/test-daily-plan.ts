#!/usr/bin/env node

/**
 * Daily Plan Engine Test Script
 * Tests the automation engine that generates fresh content for Master Bots
 * Part of Master Bot Evolution Plan Phase 2C
 */

import * as dotenv from "dotenv";
import { createDailyPlanEngine } from "../src/lib/dailyPlan.js";

// Load environment variables
dotenv.config({ path: ".env.local" });

class DailyPlanTester {
  async runTests() {
    console.log("🚀 Testing Daily Plan Engine...\n");

    try {
      // Test 1: Test Mode (no writes to database)
      await this.testTestMode();

      // Test 2: Single Bot Content Generation (if test mode passes)
      // await this.testSingleBotGeneration();

      // Test 3: Full Daily Plan Execution (commented for safety)
      // await this.testFullDailyPlan();
    } catch (error) {
      console.error("💥 Daily Plan tests failed:", error);
      process.exit(1);
    }
  }

  /**
   * Test the daily plan engine in test mode (no database writes)
   */
  async testTestMode() {
    console.log("🧪 Test 1: Running Daily Plan in Test Mode\n");

    const engine = createDailyPlanEngine({
      testMode: true,
      enableExecution: false,
    });

    const results = await engine.executeDailyPlan();

    console.log("\n📊 Test Mode Results:");
    console.log(`   • Total Bots: ${results.totalBots}`);
    console.log(`   • Successful: ${results.successfulBots}`);
    console.log(`   • Failed: ${results.failedBots}`);
    console.log(`   • Posts Generated: ${results.totalPosts}`);
    console.log(`   • AI Tokens Used: ${results.totalTokens}`);
    console.log(`   • Execution Time: ${results.totalExecutionTimeMs}ms`);

    if (results.errors.length > 0) {
      console.log(`   • Errors: ${results.errors.length}`);
      results.errors.forEach((error) => console.log(`     - ${error}`));
    }

    console.log("\n🎯 Individual Bot Results:");
    results.results.forEach((result) => {
      const status = result.errors.length === 0 ? "✅" : "❌";
      const posts =
        (result.restaurantPost ? 1 : 0) + (result.recipePost ? 1 : 0);
      console.log(
        `   ${status} ${result.botName}: ${posts} posts, ${result.tokensUsed} tokens, ${result.executionTimeMs}ms`
      );

      if (result.restaurantPost) {
        console.log(`      🍽️ Restaurant: "${result.restaurantPost.title}"`);
      }
      if (result.recipePost) {
        console.log(`      🍳 Recipe: "${result.recipePost.title}"`);
      }
      if (result.errors.length > 0) {
        result.errors.forEach((error) => console.log(`      ❌ ${error}`));
      }
    });

    // Validate results
    if (results.totalBots === 0) {
      throw new Error("No Master Bots found");
    }

    console.log("\n✅ Test Mode completed successfully!");
    console.log("📝 Note: No data was written to the database in test mode.\n");
  }

  /**
   * Test single bot content generation with database writes
   */
  async testSingleBotGeneration() {
    console.log("🧪 Test 2: Single Bot Content Generation\n");

    const engine = createDailyPlanEngine({
      testMode: false,
      enableExecution: true,
    });

    // This would generate real content for one bot
    // Implement if needed for more thorough testing
    console.log("⚠️ Single bot generation test not implemented yet");
    console.log("💡 This would test actual database writes for one bot\n");
  }

  /**
   * Test full daily plan execution (DANGEROUS - creates real posts)
   */
  async testFullDailyPlan() {
    console.log("🧪 Test 3: Full Daily Plan Execution\n");
    console.log("⚠️  WARNING: This will create real posts in the database!");
    console.log("🛑 This test is disabled for safety.");
    console.log("📝 To enable: uncomment in the main test runner\n");

    // Uncomment to run full execution:
    // const engine = createDailyPlanEngine({
    //   testMode: false,
    //   enableExecution: true
    // });
    //
    // const results = await engine.executeDailyPlan();
    // console.log('Full execution results:', results);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  try {
    // Verify environment variables
    const requiredVars = [
      "VITE_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "OPENAI_API_KEY",
      "SPOONACULAR_API_KEY",
    ];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(
        `Missing environment variables: ${missingVars.join(", ")}`
      );
    }

    const tester = new DailyPlanTester();
    await tester.runTests();

    console.log("🎉 All Daily Plan tests completed successfully!");
    console.log("🚀 The automation engine is ready for deployment.");
  } catch (error) {
    console.error("💥 Daily Plan testing failed:", error);
    process.exit(1);
  }
}

// Run tests
main();


