#!/usr/bin/env node
// tools/reverseToFigma.mjs
// Reverse-engineer React pages/components into Figma-compatible JSON structure.
//
// Dependencies: @babel/parser @babel/traverse fast-glob
// Usage: node tools/reverseToFigma.mjs "src/components/home/**/*.tsx"
//        node tools/reverseToFigma.mjs --all  (process all pages)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import glob from "fast-glob";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

// Handle ES module / CommonJS compatibility
const traverse = traverseModule.default || traverseModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Configuration ----------
const OUT_DIR = path.resolve(process.cwd(), "figma_exports");
const PAGE_FRAME_SIZE = { width: 1440, height: 900 };
const DEFAULT_FONT = { family: "Inter", size: 16, weight: 400, lineHeight: 1.6 };

// FUZO Design Tokens
const FUZO_COLORS = {
  "orange-500": { r: 1, g: 0.42, b: 0.21 },      // #FF6B35
  "orange-600": { r: 0.89, g: 0.37, b: 0.18 },   // Darker orange
  "yellow-400": { r: 1, g: 0.84, b: 0.29 },      // #FFD74A
  "yellow-500": { r: 0.97, g: 0.81, b: 0.25 },   // Slightly darker
  "navy-900": { r: 0.04, g: 0.12, b: 0.23 },     // #0B1F3A
  "navy-800": { r: 0.06, g: 0.15, b: 0.28 },     // Lighter navy
  "white": { r: 1, g: 1, b: 1 },
  "black": { r: 0, g: 0, b: 0 },
  "gray-50": { r: 0.98, g: 0.98, b: 0.98 },
  "gray-100": { r: 0.95, g: 0.96, b: 0.96 },
  "gray-200": { r: 0.90, g: 0.91, b: 0.92 },
  "gray-300": { r: 0.82, g: 0.84, b: 0.85 },
  "gray-400": { r: 0.61, g: 0.64, b: 0.67 },
  "gray-500": { r: 0.42, g: 0.45, b: 0.50 },
  "gray-600": { r: 0.29, g: 0.33, b: 0.39 },
  "gray-700": { r: 0.22, g: 0.25, b: 0.32 },
  "gray-800": { r: 0.12, g: 0.16, b: 0.22 },
  "gray-900": { r: 0.07, g: 0.09, b: 0.13 },
};

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------- Tailwind Class Interpreter ----------
const tailwindScale = {
  "0": 0, "0.5": 2, "1": 4, "1.5": 6, "2": 8, "2.5": 10, "3": 12, "3.5": 14,
  "4": 16, "5": 20, "6": 24, "7": 28, "8": 32, "9": 36, "10": 40, "11": 44, "12": 48,
  "14": 56, "16": 64, "20": 80, "24": 96, "28": 112, "32": 128, "36": 144, "40": 160,
  "44": 176, "48": 192, "52": 208, "56": 224, "60": 240, "64": 256, "72": 288, "80": 320, "96": 384
};

function interpretTailwindClasses(classString = "") {
  const classes = classString.split(/\s+/).filter(Boolean);
  const style = {
    layoutMode: null,
    flexDirection: null,
    primaryAxisAlignItems: null,
    counterAxisAlignItems: null,
    itemSpacing: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    cornerRadius: 0,
    fills: [],
    fontSize: null,
    fontWeight: null,
    width: null,
    height: null,
  };

  for (const cls of classes) {
    // Layout
    if (cls === "flex" || cls === "inline-flex") {
      style.layoutMode = "HORIZONTAL";
      style.flexDirection = "ROW";
    }
    if (cls === "block") style.layoutMode = "NONE";
    if (cls === "grid") style.layoutMode = "NONE"; // Figma doesn't have native grid, use nested frames

    // Flex direction
    if (cls === "flex-row") style.flexDirection = "ROW";
    if (cls === "flex-col") style.flexDirection = "COLUMN";
    if (cls === "flex-row-reverse") style.flexDirection = "ROW_REVERSE";
    if (cls === "flex-col-reverse") style.flexDirection = "COLUMN_REVERSE";

    // Justify content
    if (cls === "justify-start") style.primaryAxisAlignItems = "MIN";
    if (cls === "justify-center") style.primaryAxisAlignItems = "CENTER";
    if (cls === "justify-end") style.primaryAxisAlignItems = "MAX";
    if (cls === "justify-between") style.primaryAxisAlignItems = "SPACE_BETWEEN";

    // Align items
    if (cls === "items-start") style.counterAxisAlignItems = "MIN";
    if (cls === "items-center") style.counterAxisAlignItems = "CENTER";
    if (cls === "items-end") style.counterAxisAlignItems = "MAX";
    if (cls === "items-stretch") style.counterAxisAlignItems = "STRETCH";

    // Gap
    const gapMatch = cls.match(/^gap-(\d+(?:\.\d+)?)$/);
    if (gapMatch && tailwindScale[gapMatch[1]]) {
      style.itemSpacing = tailwindScale[gapMatch[1]];
    }

    // Padding
    const pMatch = cls.match(/^p-(\d+(?:\.\d+)?)$/);
    if (pMatch && tailwindScale[pMatch[1]]) {
      const val = tailwindScale[pMatch[1]];
      style.paddingTop = style.paddingRight = style.paddingBottom = style.paddingLeft = val;
    }
    const pxMatch = cls.match(/^px-(\d+(?:\.\d+)?)$/);
    if (pxMatch && tailwindScale[pxMatch[1]]) {
      style.paddingLeft = style.paddingRight = tailwindScale[pxMatch[1]];
    }
    const pyMatch = cls.match(/^py-(\d+(?:\.\d+)?)$/);
    if (pyMatch && tailwindScale[pyMatch[1]]) {
      style.paddingTop = style.paddingBottom = tailwindScale[pyMatch[1]];
    }
    const ptMatch = cls.match(/^pt-(\d+(?:\.\d+)?)$/);
    if (ptMatch && tailwindScale[ptMatch[1]]) style.paddingTop = tailwindScale[ptMatch[1]];
    const prMatch = cls.match(/^pr-(\d+(?:\.\d+)?)$/);
    if (prMatch && tailwindScale[prMatch[1]]) style.paddingRight = tailwindScale[prMatch[1]];
    const pbMatch = cls.match(/^pb-(\d+(?:\.\d+)?)$/);
    if (pbMatch && tailwindScale[pbMatch[1]]) style.paddingBottom = tailwindScale[pbMatch[1]];
    const plMatch = cls.match(/^pl-(\d+(?:\.\d+)?)$/);
    if (plMatch && tailwindScale[plMatch[1]]) style.paddingLeft = tailwindScale[plMatch[1]];

    // Border radius
    if (cls === "rounded-none") style.cornerRadius = 0;
    if (cls === "rounded-sm") style.cornerRadius = 4;
    if (cls === "rounded" || cls === "rounded-md") style.cornerRadius = 8;
    if (cls === "rounded-lg") style.cornerRadius = 12;
    if (cls === "rounded-xl") style.cornerRadius = 16;
    if (cls === "rounded-2xl") style.cornerRadius = 20;
    if (cls === "rounded-3xl") style.cornerRadius = 24;
    if (cls === "rounded-full") style.cornerRadius = 9999;

    // Background colors
    const bgMatch = cls.match(/^bg-(\w+(?:-\d+)?)$/);
    if (bgMatch) {
      const colorKey = bgMatch[1];
      if (FUZO_COLORS[colorKey]) {
        style.fills = [{ type: "SOLID", color: FUZO_COLORS[colorKey], opacity: 1 }];
      }
    }

    // Text size
    if (cls === "text-xs") style.fontSize = 12;
    if (cls === "text-sm") style.fontSize = 14;
    if (cls === "text-base") style.fontSize = 16;
    if (cls === "text-lg") style.fontSize = 18;
    if (cls === "text-xl") style.fontSize = 20;
    if (cls === "text-2xl") style.fontSize = 24;
    if (cls === "text-3xl") style.fontSize = 30;
    if (cls === "text-4xl") style.fontSize = 36;
    if (cls === "text-5xl") style.fontSize = 48;

    // Font weight
    if (cls === "font-light") style.fontWeight = 300;
    if (cls === "font-normal") style.fontWeight = 400;
    if (cls === "font-medium") style.fontWeight = 500;
    if (cls === "font-semibold") style.fontWeight = 600;
    if (cls === "font-bold") style.fontWeight = 700;

    // Width/Height
    const wMatch = cls.match(/^w-(\d+(?:\.\d+)?)$/);
    if (wMatch && tailwindScale[wMatch[1]]) style.width = tailwindScale[wMatch[1]];
    if (cls === "w-full") style.width = "FILL";
    if (cls === "w-auto") style.width = "HUG";

    const hMatch = cls.match(/^h-(\d+(?:\.\d+)?)$/);
    if (hMatch && tailwindScale[hMatch[1]]) style.height = tailwindScale[hMatch[1]];
    if (cls === "h-full") style.height = "FILL";
    if (cls === "h-auto") style.height = "HUG";
  }

  // Clean up nulls
  Object.keys(style).forEach(key => {
    if (style[key] === null) delete style[key];
  });

  return style;
}

// ---------- Figma Node Builders ----------
let _nodeIdCounter = 1;
const generateFigmaId = () => `${_nodeIdCounter++}:0`;

function createFrameNode(name, style = {}, children = []) {
  const node = {
    id: generateFigmaId(),
    type: "FRAME",
    name,
    locked: false,
    visible: true,
    layoutMode: style.layoutMode || "NONE",
    children: children.filter(Boolean),
  };

  // Auto-layout properties
  if (style.layoutMode === "HORIZONTAL" || style.layoutMode === "VERTICAL") {
    node.primaryAxisSizingMode = "AUTO";
    node.counterAxisSizingMode = "AUTO";
    node.primaryAxisAlignItems = style.primaryAxisAlignItems || "MIN";
    node.counterAxisAlignItems = style.counterAxisAlignItems || "MIN";
    node.itemSpacing = style.itemSpacing || 0;
    node.paddingTop = style.paddingTop || 0;
    node.paddingRight = style.paddingRight || 0;
    node.paddingBottom = style.paddingBottom || 0;
    node.paddingLeft = style.paddingLeft || 0;
  }

  // Styling
  if (style.cornerRadius !== undefined) node.cornerRadius = style.cornerRadius;
  if (style.fills && style.fills.length) node.fills = style.fills;
  else node.fills = [];

  // Size constraints
  if (style.width) node.layoutGrow = style.width === "FILL" ? 1 : 0;
  if (style.height) node.layoutAlign = style.height === "FILL" ? "STRETCH" : "INHERIT";

  return node;
}

function createTextNode(name, characters, style = {}) {
  const fontSize = style.fontSize || DEFAULT_FONT.size;
  const fontWeight = style.fontWeight || DEFAULT_FONT.weight;
  const fontFamily = style.fontFamily || DEFAULT_FONT.family;

  return {
    id: generateFigmaId(),
    type: "TEXT",
    name,
    characters: characters || "Text",
    locked: false,
    visible: true,
    fontSize,
    fontName: {
      family: fontFamily,
      style: fontWeight >= 600 ? "Semi Bold" : fontWeight >= 500 ? "Medium" : "Regular"
    },
    fontWeight,
    lineHeight: { value: fontSize * (DEFAULT_FONT.lineHeight || 1.6), unit: "PIXELS" },
    fills: style.fills && style.fills.length ? style.fills : [
      { type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 }, opacity: 1 }
    ],
  };
}

function createRectangleNode(name, style = {}) {
  return {
    id: generateFigmaId(),
    type: "RECTANGLE",
    name,
    locked: false,
    visible: true,
    width: style.width || 200,
    height: style.height || 120,
    cornerRadius: style.cornerRadius || 0,
    fills: style.fills && style.fills.length ? style.fills : [
      { type: "SOLID", color: { r: 0.95, g: 0.95, b: 0.97 }, opacity: 1 }
    ],
  };
}

// ---------- JSX to Figma Conversion ----------
function convertJSXElementToFigma(jsxElement, componentName) {
  if (!jsxElement || jsxElement.type !== "JSXElement") return null;

  const elementType = getJSXElementType(jsxElement);
  const attributes = extractJSXAttributes(jsxElement);
  const className = attributes.className || "";
  const style = interpretTailwindClasses(className);

  // Get text content
  const textContent = extractTextContent(jsxElement);
  
  // Process children
  const children = [];
  if (jsxElement.children) {
    for (const child of jsxElement.children) {
      if (child.type === "JSXElement") {
        const childNode = convertJSXElementToFigma(child, componentName);
        if (childNode) children.push(childNode);
      } else if (child.type === "JSXText") {
        const text = child.value.trim();
        if (text && !textContent) { // Only add if parent doesn't already have text
          children.push(createTextNode("Text", text, style));
        }
      }
    }
  }

  // Map element type to Figma node
  const nodeName = attributes.id || attributes.className?.split(" ")[0] || elementType.toUpperCase();

  // Text elements
  if (/^(h1|h2|h3|h4|h5|h6|p|span|label)$/i.test(elementType)) {
    if (textContent) {
      // Apply heading-specific styles
      const headingStyle = { ...style };
      if (elementType === "h1") headingStyle.fontSize = 48;
      else if (elementType === "h2") headingStyle.fontSize = 36;
      else if (elementType === "h3") headingStyle.fontSize = 28;
      else if (elementType === "h4") headingStyle.fontSize = 24;
      else if (elementType === "h5") headingStyle.fontSize = 20;
      else if (elementType === "h6") headingStyle.fontSize = 18;
      
      return createTextNode(nodeName, textContent, headingStyle);
    }
    return createFrameNode(nodeName, style, children);
  }

  // Image elements
  if (/^(img|image)$/i.test(elementType)) {
    return createRectangleNode("Image", {
      ...style,
      fills: [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9 }, opacity: 1 }]
    });
  }

  // Button elements
  if (/^button$/i.test(elementType)) {
    const buttonStyle = {
      ...style,
      layoutMode: style.layoutMode || "HORIZONTAL",
      primaryAxisAlignItems: "CENTER",
      counterAxisAlignItems: "CENTER",
      paddingTop: style.paddingTop || 12,
      paddingRight: style.paddingRight || 24,
      paddingBottom: style.paddingBottom || 12,
      paddingLeft: style.paddingLeft || 24,
    };
    return createFrameNode(nodeName, buttonStyle, children.length ? children : [
      createTextNode("Label", textContent || "Button", style)
    ]);
  }

  // Input elements
  if (/^input$/i.test(elementType)) {
    return createFrameNode(nodeName, {
      ...style,
      width: style.width || 240,
      height: 40,
      cornerRadius: style.cornerRadius || 8,
      fills: [{ type: "SOLID", color: FUZO_COLORS["gray-100"], opacity: 1 }]
    }, [
      createTextNode("Placeholder", attributes.placeholder || "", style)
    ]);
  }

  // Default: container frame
  return createFrameNode(nodeName, style, children);
}

function getJSXElementType(jsxElement) {
  const name = jsxElement.openingElement?.name;
  if (!name) return "div";
  if (name.type === "JSXIdentifier") return name.name;
  if (name.type === "JSXMemberExpression") {
    return `${name.object.name}.${name.property.name}`;
  }
  return "div";
}

function extractJSXAttributes(jsxElement) {
  const attrs = {};
  const attributes = jsxElement.openingElement?.attributes || [];
  
  for (const attr of attributes) {
    if (attr.type !== "JSXAttribute") continue;
    
    const key = attr.name?.name;
    if (!key) continue;

    let value = "";
    if (!attr.value) {
      value = true;
    } else if (attr.value.type === "StringLiteral") {
      value = attr.value.value;
    } else if (attr.value.type === "JSXExpressionContainer") {
      const expr = attr.value.expression;
      if (expr.type === "StringLiteral") {
        value = expr.value;
      } else if (expr.type === "TemplateLiteral") {
        value = expr.quasis.map(q => q.value.cooked || "").join("");
      } else if (expr.type === "BooleanLiteral") {
        value = expr.value;
      }
    }
    
    attrs[key] = value;
  }
  
  return attrs;
}

function extractTextContent(jsxElement) {
  if (!jsxElement.children) return "";
  
  for (const child of jsxElement.children) {
    if (child.type === "JSXText") {
      const text = child.value.replace(/\s+/g, " ").trim();
      if (text) return text;
    }
  }
  
  return "";
}

// ---------- File Processing ----------
function processReactFile(filePath) {
  const code = fs.readFileSync(filePath, "utf8");
  
  let ast;
  try {
    ast = parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript", "decorators-legacy"],
    });
  } catch (err) {
    console.error(`❌ Parse error in ${filePath}:`, err.message);
    return null;
  }

  const fileName = path.basename(filePath, path.extname(filePath));
  let rootJSXElement = null;
  let componentName = fileName;

  // Find the main export
  traverse(ast, {
    // export default function Component() { return <div>...</div> }
    ExportDefaultDeclaration(path) {
      const declaration = path.node.declaration;
      
      if (declaration.type === "FunctionDeclaration") {
        componentName = declaration.id?.name || componentName;
        rootJSXElement = findReturnJSXInFunction(declaration);
      }
      // export default () => <div>...</div>
      else if (declaration.type === "ArrowFunctionExpression") {
        if (declaration.body.type === "JSXElement") {
          rootJSXElement = declaration.body;
        } else if (declaration.body.type === "BlockStatement") {
          rootJSXElement = findReturnJSXInFunction(declaration);
        }
      }
      // export default Component;
      else if (declaration.type === "Identifier") {
        componentName = declaration.name;
      }
    },
    
    // export function Component() { return <div>...</div> }
    ExportNamedDeclaration(path) {
      if (!rootJSXElement) {
        const declaration = path.node.declaration;
        if (declaration?.type === "FunctionDeclaration") {
          componentName = declaration.id?.name || componentName;
          const jsx = findReturnJSXInFunction(declaration);
          if (jsx) rootJSXElement = jsx;
        } else if (declaration?.type === "VariableDeclaration") {
          for (const declarator of declaration.declarations) {
            if (declarator.id?.name) {
              const init = declarator.init;
              if (init?.type === "ArrowFunctionExpression") {
                componentName = declarator.id.name;
                if (init.body.type === "JSXElement") {
                  rootJSXElement = init.body;
                } else if (init.body.type === "BlockStatement") {
                  const jsx = findReturnJSXInFunction(init);
                  if (jsx) rootJSXElement = jsx;
                }
                break;
              } else if (init?.type === "FunctionExpression") {
                componentName = declarator.id.name;
                const jsx = findReturnJSXInFunction(init);
                if (jsx) {
                  rootJSXElement = jsx;
                  break;
                }
              }
            }
          }
        }
      }
    },
    
    // const Component = () => <div>...</div>
    VariableDeclarator(path) {
      if (!rootJSXElement && path.node.id?.name) {
        const init = path.node.init;
        if (init?.type === "ArrowFunctionExpression") {
          if (init.body.type === "JSXElement") {
            componentName = path.node.id.name;
            rootJSXElement = init.body;
          } else if (init.body.type === "BlockStatement") {
            const jsx = findReturnJSXInFunction(init);
            if (jsx) {
              componentName = path.node.id.name;
              rootJSXElement = jsx;
            }
          }
        }
      }
    },
    
    // function Component() { return <div>...</div> }
    FunctionDeclaration(path) {
      if (!rootJSXElement && path.node.id?.name) {
        componentName = path.node.id.name;
        const jsx = findReturnJSXInFunction(path.node);
        if (jsx) rootJSXElement = jsx;
      }
    },
  });

  if (!rootJSXElement) {
    console.warn(`⚠️  No root JSX found in ${filePath}`);
    return null;
  }

  return { componentName, rootJSXElement };
}

function findReturnJSXInFunction(funcNode) {
  const body = funcNode.body;
  if (body?.type === "BlockStatement") {
    for (const statement of body.body) {
      if (statement.type === "ReturnStatement" && statement.argument?.type === "JSXElement") {
        return statement.argument;
      }
    }
  }
  return null;
}

function generateFigmaDocument(componentName, rootJSXElement) {
  _nodeIdCounter = 1; // Reset counter
  
  const rootNode = convertJSXElementToFigma(rootJSXElement, componentName);
  
  const pageFrame = createFrameNode(
    `${componentName} - Page`,
    {
      layoutMode: "VERTICAL",
      primaryAxisAlignItems: "MIN",
      counterAxisAlignItems: "MIN",
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 1 }],
    },
    rootNode ? [rootNode] : []
  );

  return {
    name: componentName,
    role: "CANVAS",
    lastModified: new Date().toISOString(),
    thumbnailUrl: "",
    version: "1.0",
    document: {
      id: "0:0",
      name: componentName,
      type: "DOCUMENT",
      children: [
        {
          id: "0:1",
          name: "Page 1",
          type: "CANVAS",
          children: [pageFrame],
          backgroundColor: { r: 0.95, g: 0.95, b: 0.95, a: 1 },
          prototypeStartNodeID: null,
        }
      ],
    },
    components: {},
    componentSets: {},
    schemaVersion: 0,
    styles: {},
  };
}

// ---------- Main Entry Point ----------
async function main() {
  console.log("🚀 FUZO Reverse Engineering Tool - React to Figma\n");

  const args = process.argv.slice(2);
  let patterns;

  if (args.includes("--all")) {
    patterns = [
      "src/components/home/components/LandingPage.tsx",
      "src/components/dash/components/Dashboard.tsx",
      "src/components/feed/App.tsx",
      "src/components/scout/App.tsx",
      "src/components/bites/App.tsx",
      "src/components/chat/ChatWithAuth.tsx",
      "src/components/plate/App.tsx",
      "src/components/trims/App.tsx",
      "src/components/snap/App.tsx",
    ];
  } else if (args.length) {
    patterns = args;
  } else {
    patterns = ["src/components/home/components/LandingPage.tsx"];
  }

  const files = await glob(patterns, { 
    absolute: true, 
    cwd: process.cwd(),
    onlyFiles: true,
  });

  if (!files.length) {
    console.log("❌ No files found matching patterns:", patterns);
    console.log("\nUsage:");
    console.log("  node tools/reverseToFigma.mjs --all");
    console.log("  node tools/reverseToFigma.mjs src/components/home/**/*.tsx");
    process.exit(1);
  }

  console.log(`📁 Found ${files.length} file(s) to process\n`);

  const allDocuments = [];

  for (const filePath of files) {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`🔍 Processing: ${relativePath}`);

    try {
      const result = processReactFile(filePath);
      if (!result) continue;

      const { componentName, rootJSXElement } = result;
      const figmaDoc = generateFigmaDocument(componentName, rootJSXElement);
      
      allDocuments.push({ componentName, figmaDoc });

      // Write individual file
      const outputPath = path.join(OUT_DIR, `${componentName}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(figmaDoc, null, 2));
      console.log(`   ✅ Exported: ${path.relative(process.cwd(), outputPath)}\n`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }

  // Create combined export
  if (allDocuments.length > 1) {
    const combinedDoc = {
      name: "FUZO - All Pages",
      role: "CANVAS",
      lastModified: new Date().toISOString(),
      version: "1.0",
      document: {
        id: "0:0",
        name: "FUZO Application",
        type: "DOCUMENT",
        children: [
          {
            id: "0:1",
            name: "All Pages",
            type: "CANVAS",
            children: allDocuments.map((doc, idx) => {
              const frame = doc.figmaDoc.document.children[0].children[0];
              // Offset each page horizontally
              frame.absoluteBoundingBox = {
                x: idx * (PAGE_FRAME_SIZE.width + 200),
                y: 0,
                ...PAGE_FRAME_SIZE
              };
              return frame;
            }),
            backgroundColor: { r: 0.95, g: 0.95, b: 0.95, a: 1 },
          }
        ],
      },
      components: {},
      styles: {},
    };

    const combinedPath = path.join(OUT_DIR, "full_project.json");
    fs.writeFileSync(combinedPath, JSON.stringify(combinedDoc, null, 2));
    console.log(`📦 Combined export: ${path.relative(process.cwd(), combinedPath)}\n`);
  }

  // Create index
  const indexContent = allDocuments
    .map(doc => `- ${doc.componentName}.json`)
    .join("\n");
  fs.writeFileSync(path.join(OUT_DIR, "_index.txt"), indexContent);

  console.log(`\n✨ Done! Processed ${allDocuments.length} component(s)`);
  console.log(`📂 Output directory: ${path.relative(process.cwd(), OUT_DIR)}\n`);
}

main().catch(err => {
  console.error("💥 Fatal error:", err);
  process.exit(1);
});
