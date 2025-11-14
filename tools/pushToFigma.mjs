#!/usr/bin/env node

/**
 * FUZO → Figma Direct Push Tool
 * 
 * Uses Figma MCP (cursor-talk-to-figma-mcp) to programmatically
 * create frames, text, and elements directly in your Figma file.
 * 
 * This reads the JSON exports from reverseToFigma.mjs and
 * recreates them in Figma using the MCP API.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const EXPORTS_DIR = path.join(__dirname, "..", "figma_exports");
const DESKTOP_WIDTH = 1440;
const MOBILE_WIDTH = 375;
const FRAME_HEIGHT = 900;
const SPACING = 200; // Space between desktop and mobile frames

/**
 * Main execution function
 */
async function main() {
  console.log("🎨 FUZO → Figma Direct Push Tool");
  console.log("==================================\n");

  // Read available exports
  const files = fs.readdirSync(EXPORTS_DIR).filter((f) => f.endsWith(".json") && f !== "full_project.json" && f !== "_index.txt");

  console.log(`📁 Found ${files.length} page(s) to push:\n`);
  files.forEach((file, i) => {
    console.log(`   ${i + 1}. ${file.replace(".json", "")}`);
  });
  console.log();

  // Start with Landing Page
  const landingPageFile = path.join(EXPORTS_DIR, "LandingPage.json");
  if (!fs.existsSync(landingPageFile)) {
    console.error("❌ LandingPage.json not found. Run 'npm run reverse:landing' first.");
    process.exit(1);
  }

  console.log("🚀 Starting with Landing Page...\n");
  const landingData = JSON.parse(fs.readFileSync(landingPageFile, "utf-8"));

  // Generate Figma MCP commands
  const commands = generateFigmaCommands(landingData, "Landing Page");

  // Output command script
  const outputPath = path.join(__dirname, "figma-commands.json");
  fs.writeFileSync(outputPath, JSON.stringify(commands, null, 2));

  console.log(`✅ Generated ${commands.length} Figma commands`);
  console.log(`📄 Saved to: ${outputPath}\n`);

  // Generate execution instructions
  printExecutionInstructions(commands);
}

/**
 * Generate Figma MCP commands from JSON structure
 */
function generateFigmaCommands(pageData, pageName) {
  const commands = [];
  let commandId = 0;

  // Step 1: Create Page Frame (Container for Desktop + Mobile)
  const pageFrameCommand = {
    id: commandId++,
    action: "create_frame",
    params: {
      name: `${pageName} - Full Page`,
      x: 0,
      y: 0,
      width: DESKTOP_WIDTH + MOBILE_WIDTH + SPACING * 2,
      height: FRAME_HEIGHT,
      layoutMode: "HORIZONTAL",
      itemSpacing: SPACING,
      paddingLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      fillColor: { r: 0.96, g: 0.97, b: 0.98, a: 1 }, // Light gray background
    },
  };
  commands.push(pageFrameCommand);

  // Step 2: Create Desktop Frame
  const desktopFrameCommand = {
    id: commandId++,
    action: "create_frame",
    params: {
      name: `${pageName} - Desktop (1440px)`,
      x: 0,
      y: 0,
      width: DESKTOP_WIDTH,
      height: FRAME_HEIGHT,
      layoutMode: "VERTICAL",
      fillColor: { r: 1, g: 1, b: 1, a: 1 }, // White background
      parentId: "PLEASE_REPLACE_WITH_PAGE_FRAME_ID", // Will be replaced manually
    },
  };
  commands.push(desktopFrameCommand);

  // Step 3: Create Mobile Frame
  const mobileFrameCommand = {
    id: commandId++,
    action: "create_frame",
    params: {
      name: `${pageName} - Mobile (375px)`,
      x: DESKTOP_WIDTH + SPACING,
      y: 0,
      width: MOBILE_WIDTH,
      height: FRAME_HEIGHT,
      layoutMode: "VERTICAL",
      fillColor: { r: 1, g: 1, b: 1, a: 1 }, // White background
      parentId: "PLEASE_REPLACE_WITH_PAGE_FRAME_ID", // Will be replaced manually
    },
  };
  commands.push(mobileFrameCommand);

  // Step 4: Parse the JSON structure and create nested elements
  if (pageData.document && pageData.document.children) {
    const canvas = pageData.document.children[0];
    if (canvas.children) {
      const rootFrame = canvas.children[0];
      if (rootFrame && rootFrame.children) {
        // Process top-level sections (Nav, Main, Footer)
        rootFrame.children.forEach((section) => {
          const sectionCommands = generateSectionCommands(section, commandId, "DESKTOP_FRAME_ID");
          commands.push(...sectionCommands);
          commandId += sectionCommands.length;
        });
      }
    }
  }

  return commands;
}

/**
 * Generate commands for a section (Nav, Main, Footer)
 */
function generateSectionCommands(section, startId, parentId) {
  const commands = [];

  if (section.type === "FRAME") {
    // Create the section frame
    const frameCommand = {
      id: startId,
      action: "create_frame",
      params: {
        name: section.name || "Section",
        x: section.x || 0,
        y: section.y || 0,
        width: section.width || DESKTOP_WIDTH,
        height: section.height || 100,
        layoutMode: section.layoutMode || "NONE",
        primaryAxisAlignItems: section.primaryAxisAlignItems || "MIN",
        counterAxisAlignItems: section.counterAxisAlignItems || "MIN",
        itemSpacing: section.itemSpacing || 0,
        paddingTop: section.paddingTop || 0,
        paddingRight: section.paddingRight || 0,
        paddingBottom: section.paddingBottom || 0,
        paddingLeft: section.paddingLeft || 0,
        fillColor: extractFillColor(section.fills),
        cornerRadius: section.cornerRadius || 0,
        parentId: parentId,
      },
    };
    commands.push(frameCommand);

    // Process children
    if (section.children && section.children.length > 0) {
      let childId = startId + 1;
      section.children.forEach((child) => {
        if (child.type === "TEXT") {
          const textCommand = generateTextCommand(child, childId, `SECTION_${startId}`);
          commands.push(textCommand);
          childId++;
        } else if (child.type === "FRAME") {
          const childCommands = generateSectionCommands(child, childId, `SECTION_${startId}`);
          commands.push(...childCommands);
          childId += childCommands.length;
        } else if (child.type === "RECTANGLE") {
          const rectCommand = generateRectangleCommand(child, childId, `SECTION_${startId}`);
          commands.push(rectCommand);
          childId++;
        }
      });
    }
  }

  return commands;
}

/**
 * Generate text element command
 */
function generateTextCommand(textNode, id, parentId) {
  return {
    id: id,
    action: "create_text",
    params: {
      name: textNode.name || "Text",
      text: textNode.characters || "",
      x: textNode.x || 0,
      y: textNode.y || 0,
      fontSize: textNode.fontSize || 14,
      fontWeight: textNode.fontWeight || 400,
      fontColor: extractFontColor(textNode.fills),
      parentId: parentId,
    },
  };
}

/**
 * Generate rectangle command
 */
function generateRectangleCommand(rectNode, id, parentId) {
  return {
    id: id,
    action: "create_rectangle",
    params: {
      name: rectNode.name || "Rectangle",
      x: rectNode.x || 0,
      y: rectNode.y || 0,
      width: rectNode.width || 100,
      height: rectNode.height || 100,
      parentId: parentId,
    },
  };
}

/**
 * Extract fill color from fills array
 */
function extractFillColor(fills) {
  if (!fills || fills.length === 0) {
    return { r: 1, g: 1, b: 1, a: 1 }; // Default white
  }
  const fill = fills[0];
  return {
    r: fill.color?.r || 1,
    g: fill.color?.g || 1,
    b: fill.color?.b || 1,
    a: fill.opacity !== undefined ? fill.opacity : 1,
  };
}

/**
 * Extract font color from fills array
 */
function extractFontColor(fills) {
  if (!fills || fills.length === 0) {
    return { r: 0, g: 0, b: 0, a: 1 }; // Default black
  }
  const fill = fills[0];
  return {
    r: fill.color?.r || 0,
    g: fill.color?.g || 0,
    b: fill.color?.b || 0,
    a: fill.opacity !== undefined ? fill.opacity : 1,
  };
}

/**
 * Print execution instructions
 */
function printExecutionInstructions(commands) {
  console.log("📋 EXECUTION INSTRUCTIONS:");
  console.log("===========================\n");
  console.log("1. Open your Figma file in the browser");
  console.log("2. Make sure the 'Talk to Figma' plugin is installed and running");
  console.log("3. Ensure VS Code is connected to Figma MCP\n");

  console.log("4. We will execute commands in phases:\n");

  console.log("   Phase 1: CREATE PAGE STRUCTURE");
  console.log("   - Create main page container");
  console.log("   - Create Desktop frame (1440px)");
  console.log("   - Create Mobile frame (375px)\n");

  console.log("   Phase 2: ADD NAVIGATION");
  console.log("   - Create nav background");
  console.log("   - Add logo");
  console.log("   - Add nav links\n");

  console.log("   Phase 3: BUILD SECTIONS");
  console.log("   - Hero section");
  console.log("   - Feature sections");
  console.log("   - Footer\n");

  console.log("   Phase 4: ADD GRANULAR ELEMENTS");
  console.log("   - Text elements");
  console.log("   - Buttons");
  console.log("   - Cards\n");

  console.log(`Total commands to execute: ${commands.length}`);
  console.log("\n✨ Ready to push to Figma!");
  console.log("\nTo execute, we'll use the Figma MCP tools in VS Code.");
  console.log("Let's start with Phase 1...\n");
}

// Run the tool
main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
