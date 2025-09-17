#!/usr/bin/env node

/**
 * Recipe Population Script
 * Imports recipes from Spoonacular API for each bot specialty
 * Part of Master Bot Evolution Plan Phase 2B
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { spoonacularAPI } from "../src/lib/spoonacular.js";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface RecipeImportStats {
  specialty: string;
  requested: number;
  found: number;
  imported: number;
  skipped: number;
  errors: number;
}

class RecipePopulator {
  private stats: RecipeImportStats[] = [];

  async populateAllSpecialties() {
    console.log(
      "🍴 Starting Recipe Population for Master Bot Specialties...\n"
    );

    // Get bot specialties from tags_map
    const { data: specialties, error } = await supabase
      .from("tags_map")
      .select("tag, recipe_filters")
      .order("priority_score", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch specialties: ${error.message}`);
    }

    console.log(`Found ${specialties.length} bot specialties to populate\n`);

    // Import recipes for each specialty
    for (const specialty of specialties) {
      await this.populateSpecialty(specialty.tag, 20); // 20 recipes per specialty
      await this.delay(2000); // Rate limiting delay
    }

    this.printSummary();
  }

  async populateSpecialty(specialty: string, count: number = 20) {
    console.log(`\n🤖 Importing recipes for specialty: ${specialty}`);
    console.log(`📊 Target count: ${count} recipes`);

    const stats: RecipeImportStats = {
      specialty,
      requested: count,
      found: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
    };

    try {
      // Get recipes from Spoonacular
      const recipes = await spoonacularAPI.getRecipesForBotSpecialty(
        specialty,
        count
      );
      stats.found = recipes.length;

      console.log(`✅ Found ${recipes.length} recipes from Spoonacular`);

      // Check which recipes already exist
      const spoonIds = recipes.map((r) => r.id);
      const { data: existingRecipes } = await supabase
        .from("recipes")
        .select("spoon_id")
        .in("spoon_id", spoonIds);

      const existingIds = new Set(
        existingRecipes?.map((r) => r.spoon_id) || []
      );
      const newRecipes = recipes.filter((r) => !existingIds.has(r.id));

      console.log(
        `📦 ${existingIds.size} recipes already exist, ${newRecipes.length} are new`
      );

      // Import new recipes
      for (const recipe of newRecipes) {
        try {
          const dbRecipe = spoonacularAPI.transformRecipeForDatabase(recipe);

          const { error: insertError } = await supabase
            .from("recipes")
            .insert(dbRecipe);

          if (insertError) {
            console.error(
              `❌ Failed to insert recipe ${recipe.id}:`,
              insertError.message
            );
            stats.errors++;
          } else {
            console.log(`✅ Imported: ${recipe.title}`);
            stats.imported++;
          }
        } catch (error) {
          console.error(`❌ Error processing recipe ${recipe.id}:`, error);
          stats.errors++;
        }
      }

      stats.skipped = existingIds.size;
    } catch (error) {
      console.error(`❌ Failed to get recipes for ${specialty}:`, error);
      stats.errors = count;
    }

    this.stats.push(stats);

    console.log(`📊 Specialty ${specialty} complete:`);
    console.log(`   • Found: ${stats.found}`);
    console.log(`   • Imported: ${stats.imported}`);
    console.log(`   • Skipped: ${stats.skipped}`);
    console.log(`   • Errors: ${stats.errors}`);
  }

  private printSummary() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 RECIPE POPULATION SUMMARY");
    console.log("=".repeat(60));

    const totals = this.stats.reduce(
      (acc, stat) => ({
        requested: acc.requested + stat.requested,
        found: acc.found + stat.found,
        imported: acc.imported + stat.imported,
        skipped: acc.skipped + stat.skipped,
        errors: acc.errors + stat.errors,
      }),
      { requested: 0, found: 0, imported: 0, skipped: 0, errors: 0 }
    );

    console.log("\n📈 By Specialty:");
    this.stats.forEach((stat) => {
      const successRate =
        stat.found > 0
          ? ((stat.imported / stat.found) * 100).toFixed(1)
          : "0.0";
      console.log(
        `   ${stat.specialty.padEnd(15)} | ${stat.imported
          .toString()
          .padStart(3)} imported | ${successRate}% success`
      );
    });

    console.log("\n🎯 Overall Totals:");
    console.log(`   • Requested: ${totals.requested} recipes`);
    console.log(`   • Found: ${totals.found} recipes`);
    console.log(`   • Imported: ${totals.imported} recipes`);
    console.log(`   • Skipped: ${totals.skipped} (already existed)`);
    console.log(`   • Errors: ${totals.errors} recipes`);

    const overallSuccess =
      totals.found > 0
        ? ((totals.imported / totals.found) * 100).toFixed(1)
        : "0.0";
    console.log(`   • Success Rate: ${overallSuccess}%`);

    console.log("\n✅ Recipe population complete!");
    console.log(
      `🎉 Database now has fresh recipes for all ${this.stats.length} bot specialties`
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  try {
    // Verify environment variables
    if (!process.env.SPOONACULAR_API_KEY) {
      throw new Error("SPOONACULAR_API_KEY environment variable is required");
    }

    if (
      !process.env.VITE_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      throw new Error("Supabase environment variables are required");
    }

    const populator = new RecipePopulator();
    await populator.populateAllSpecialties();
  } catch (error) {
    console.error("💥 Recipe population failed:", error);
    process.exit(1);
  }
}

// Run main function if this file is executed directly
main();
