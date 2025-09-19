// Identify files that reference old bot tables and need cleanup
// Run with: node scripts/identify-outdated-files.js

import fs from "fs";
import path from "path";

function findFilesWithOldTableReferences(
  dir,
  extensions = [".js", ".ts", ".tsx", ".sql"]
) {
  const files = [];

  function searchDirectory(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules and other common directories to ignore
          if (!["node_modules", ".git", "dist", "build"].includes(item)) {
            searchDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (extensions.includes(ext)) {
            try {
              const content = fs.readFileSync(fullPath, "utf8");
              const oldTableRefs = [];

              if (content.includes("bot_history"))
                oldTableRefs.push("bot_history");
              if (content.includes("master_bots"))
                oldTableRefs.push("master_bots");
              if (content.includes("bot_posts")) oldTableRefs.push("bot_posts");

              if (oldTableRefs.length > 0) {
                files.push({
                  path: fullPath,
                  references: oldTableRefs,
                  size: content.length,
                });
              }
            } catch (err) {
              // Skip files that can't be read
            }
          }
        }
      }
    } catch (err) {
      // Skip directories that can't be read
    }
  }

  searchDirectory(dir);
  return files;
}

function categorizeFile(filePath) {
  const pathParts = filePath.split(path.sep);

  // New files we created (should be kept)
  if (
    filePath.includes("simplified-master-bots") ||
    filePath.includes("cleanup") ||
    filePath.includes("test-simplified") ||
    filePath.includes("masterBotService")
  ) {
    return "NEW_CLEANUP_FILES";
  }

  // Migration files (should be kept)
  if (pathParts.includes("migrations")) {
    return "MIGRATION_FILES";
  }

  // Old scripts that might need cleanup
  if (
    pathParts.includes("scripts") &&
    (filePath.includes("seed-masterbot") ||
      filePath.includes("seedBotPosts") ||
      filePath.includes("test-bot-posts") ||
      filePath.includes("check-bot") ||
      filePath.includes("debug-bot") ||
      filePath.includes("verify-posts") ||
      filePath.includes("redistribute-bot-posts") ||
      filePath.includes("clean-and-reseed"))
  ) {
    return "OLD_SCRIPTS_TO_REVIEW";
  }

  // Component files that might need updating
  if (
    pathParts.includes("components") &&
    (filePath.includes("useBotPosts") || filePath.includes("useMasterBots"))
  ) {
    return "COMPONENTS_TO_UPDATE";
  }

  // Database schema files
  if (
    pathParts.includes("database") &&
    (filePath.includes("schema.sql") || filePath.includes("seed_data.sql"))
  ) {
    return "DATABASE_SCHEMA_FILES";
  }

  return "OTHER_FILES";
}

async function identifyOutdatedFiles() {
  try {
    console.log("🔍 Identifying files that reference old bot tables...");

    const files = findFilesWithOldTableReferences(".");

    console.log(`\n📊 Found ${files.length} files with old table references:`);

    const categories = {
      NEW_CLEANUP_FILES: [],
      MIGRATION_FILES: [],
      OLD_SCRIPTS_TO_REVIEW: [],
      COMPONENTS_TO_UPDATE: [],
      DATABASE_SCHEMA_FILES: [],
      OTHER_FILES: [],
    };

    files.forEach((file) => {
      const category = categorizeFile(file.path);
      categories[category].push(file);
    });

    // Display results by category
    Object.entries(categories).forEach(([category, files]) => {
      if (files.length > 0) {
        console.log(
          `\n📁 ${category.replace(/_/g, " ")} (${files.length} files):`
        );
        files.forEach((file) => {
          console.log(`   ${file.path}`);
          console.log(`      References: ${file.references.join(", ")}`);
          console.log(`      Size: ${file.size} bytes`);
        });
      }
    });

    console.log("\n📝 Recommendations:");
    console.log("\n✅ KEEP (New cleanup files):");
    console.log("   - All files in NEW_CLEANUP_FILES category");
    console.log("   - These are the new simplified system files");

    console.log("\n✅ KEEP (Migration files):");
    console.log("   - All files in MIGRATION_FILES category");
    console.log("   - These handle the database cleanup");

    console.log("\n⚠️ REVIEW (Old scripts):");
    console.log("   - Files in OLD_SCRIPTS_TO_REVIEW category");
    console.log("   - These might be outdated and can be deleted");
    console.log("   - Or updated to use the new simplified system");

    console.log("\n🔧 UPDATE (Components):");
    console.log("   - Files in COMPONENTS_TO_UPDATE category");
    console.log("   - Update to use the new masterBotService");
    console.log("   - Remove references to old tables");

    console.log("\n📊 UPDATE (Database schema):");
    console.log("   - Files in DATABASE_SCHEMA_FILES category");
    console.log("   - Remove old table definitions");
    console.log("   - Keep only the simplified users table structure");

    console.log("\n🎯 Next Steps:");
    console.log("   1. Run the cleanup migration to drop old tables");
    console.log("   2. Update component files to use masterBotService");
    console.log("   3. Delete or update old scripts");
    console.log("   4. Update database schema files");
    console.log("   5. Test everything works with the simplified system");
  } catch (error) {
    console.error("❌ Error identifying outdated files:", error.message);
  }
}

identifyOutdatedFiles();

