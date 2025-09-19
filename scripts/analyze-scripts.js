// Analyze all scripts and categorize them
// Run with: node scripts/analyze-scripts.js

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function analyzeScripts() {
  console.log("🔍 Analyzing all scripts in the scripts directory...\n");

  const scriptsDir = path.join(__dirname);
  const files = fs.readdirSync(scriptsDir);

  const categories = {
    "Database/Users": [],
    "Master Bots": [],
    Testing: [],
    Deployment: [],
    "API Testing": [],
    "Bot Posts/Content": [],
    "Environment/Setup": [],
    "Obsolete/Remove": [],
  };

  files.forEach((file) => {
    if (
      !file.endsWith(".js") &&
      !file.endsWith(".ts") &&
      !file.endsWith(".ps1") &&
      !file.endsWith(".bat")
    ) {
      return;
    }

    const filePath = path.join(scriptsDir, file);
    let content = "";
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch (err) {
      return;
    }

    // Categorize based on filename and content
    if (
      file.includes("check-") ||
      file.includes("verify-") ||
      file.includes("debug-")
    ) {
      if (file.includes("bot") || file.includes("master")) {
        categories["Master Bots"].push(file);
      } else if (
        file.includes("user") ||
        file.includes("auth") ||
        file.includes("duplicate")
      ) {
        categories["Database/Users"].push(file);
      } else {
        categories["Testing"].push(file);
      }
    } else if (file.includes("test-")) {
      categories["Testing"].push(file);
    } else if (
      file.includes("seed-") ||
      file.includes("populate-") ||
      file.includes("generate")
    ) {
      if (file.includes("bot") || file.includes("master")) {
        categories["Bot Posts/Content"].push(file);
      } else {
        categories["Database/Users"].push(file);
      }
    } else if (
      file.includes("setup-") ||
      file.includes("advanced-setup") ||
      file.includes("quick-setup")
    ) {
      categories["Environment/Setup"].push(file);
    } else if (file.includes("deploy") || file.includes("vercel")) {
      categories["Deployment"].push(file);
    } else if (
      file.includes("api") ||
      file.includes("google") ||
      file.includes("spoonacular") ||
      file.includes("openai")
    ) {
      categories["API Testing"].push(file);
    } else if (
      file.includes("cleanup") ||
      file.includes("fix-") ||
      file.includes("simplify") ||
      file.includes("drop-") ||
      file.includes("identify-")
    ) {
      categories["Obsolete/Remove"].push(file);
    } else {
      // Check content for better categorization
      if (
        content.includes("bot_posts") ||
        content.includes("master_bots") ||
        content.includes("bot_history")
      ) {
        categories["Bot Posts/Content"].push(file);
      } else if (content.includes("users") || content.includes("auth.users")) {
        categories["Database/Users"].push(file);
      } else {
        categories["Testing"].push(file);
      }
    }
  });

  // Display categories
  Object.entries(categories).forEach(([category, files]) => {
    if (files.length > 0) {
      console.log(`📁 ${category} (${files.length} files):`);
      files.forEach((file) => {
        const status = category === "Obsolete/Remove" ? "🗑️" : "📄";
        console.log(`   ${status} ${file}`);
      });
      console.log("");
    }
  });

  // Recommendations
  console.log("📝 RECOMMENDATIONS:\n");

  console.log("🗑️ REMOVE (Obsolete after simplification):");
  categories["Obsolete/Remove"].forEach((file) => {
    console.log(`   - ${file} (no longer needed)`);
  });

  console.log("\n📁 KEEP (Still useful):");
  [
    "Database/Users",
    "Testing",
    "Deployment",
    "API Testing",
    "Environment/Setup",
  ].forEach((category) => {
    if (categories[category].length > 0) {
      console.log(`   ${category}: ${categories[category].length} files`);
    }
  });

  console.log("\n🔄 CONSOLIDATE:");
  console.log("   - Multiple check-* scripts can be combined");
  console.log("   - Multiple test-* scripts can be consolidated");
  console.log("   - Bot-related scripts can be simplified");

  console.log("\n📋 NEW ORGANIZATION:");
  console.log("   scripts/");
  console.log("   ├── database/          # User/auth related scripts");
  console.log("   ├── testing/          # All test scripts");
  console.log("   ├── deployment/       # Deployment scripts");
  console.log("   ├── api/              # API testing scripts");
  console.log("   └── setup/            # Environment setup scripts");
}

analyzeScripts();
