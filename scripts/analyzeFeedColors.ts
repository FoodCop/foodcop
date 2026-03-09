/**
 * Detailed Color Usage Analysis - Feed Page Comparison
 * Compares actual color usage in desktop vs mobile implementations
 */

import fs from 'fs';
import path from 'path';

interface ColorUsage {
  color: string;
  count: number;
  contexts: Set<string>; // where it's used (bg, border, text, etc)
}

// Extract colors from content
function extractColorsWithContext(content: string): Map<string, ColorUsage> {
  const colorMap = new Map<string, ColorUsage>();
  
  // Match color properties: background, color, border, box-shadow, etc
  const colorPatterns = [
    // Hex colors with context
    { pattern: /(?:background|color|border|box-shadow|text-shadow):\s*([^;]*#[0-9a-fA-F]{3,8}[^;]*)/gi, context: 'color-property' },
    // RGB/RGBA with context
    { pattern: /(?:background|color|border|box-shadow):\s*([^;]*rgba?\([^)]*\)[^;]*)/gi, context: 'color-property' },
  ];
  
  colorPatterns.forEach(({ pattern }) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const fullValue = match[1];
      
      // Extract individual colors
      const hexMatches = fullValue.match(/#[0-9a-fA-F]{3,8}\b/g);
      const rgbMatches = fullValue.match(/rgba?\([^)]*\)/g);
      
      const colors = [...(hexMatches || []), ...(rgbMatches || [])];
      colors.forEach(color => {
        const normalized = color.toLowerCase();
        if (!colorMap.has(normalized)) {
          colorMap.set(normalized, { color: normalized, count: 0, contexts: new Set() });
        }
        const usage = colorMap.get(normalized)!;
        usage.count++;
        usage.contexts.add(fullValue.includes('background') ? 'background' : 
                          fullValue.includes('color:') ? 'color' :
                          fullValue.includes('border') ? 'border' : 'other');
      });
    }
  });

  return colorMap;
}

// Analyze a specific component file
function analyzeComponentFile(filePath: string): Map<string, ColorUsage> {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return extractColorsWithContext(content);
  } catch {
    return new Map();
  }
}

// Main analysis
async function analyzeFeedPageColors() {
  console.log('🎯 FEED PAGE DETAILED COLOR ANALYSIS\n');
  console.log('='.repeat(100) + '\n');

  const feedDir = path.join(process.cwd(), 'src/components/feed');
  const styleDir = path.join(process.cwd(), 'src/styles');

  // Components to analyze
  const components = [
    { name: 'FeedDesktop', path: path.join(feedDir, 'FeedDesktop.tsx') },
    { name: 'FeedMobile', path: path.join(feedDir, 'FeedMobile.tsx') },
    { name: 'Feed (Main)', path: path.join(feedDir, 'Feed.tsx') },
  ];

  // CSS files affecting Feed
  const cssFiles = [
    { name: 'Global Design Tokens', path: path.join(styleDir, 'design-tokens.css') },
    { name: 'Design System', path: path.join(styleDir, 'design-system.css') },
    { name: 'Mobile Styles', path: path.join(styleDir, 'mobile.css') },
    { name: 'FeedCard.css', path: path.join(feedDir, 'FeedCard.css') },
    { name: 'Index CSS', path: path.join(styleDir, '..', 'index.css') },
  ];

  // Analyze component files
  console.log('📱 COMPONENT FILE ANALYSIS (Colors referenced in JSX/TS):\n');
  console.log('-'.repeat(100));
  
  for (const component of components) {
    if (!fs.existsSync(component.path)) continue;
    
    const colors = analyzeComponentFile(component.path);
    if (colors.size === 0) {
      console.log(`\n${component.name}: No inline colors (good - uses CSS variables)`);
    } else {
      console.log(`\n${component.name}: ${colors.size} unique colors found`);
      Array.from(colors.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .forEach(usage => {
          console.log(`  ${usage.color} (${usage.count}x)`);
        });
    }
  }

  // Analyze CSS files
  console.log('\n\n' + '='.repeat(100));
  console.log('\n🎨 CSS FILE ANALYSIS (Direct color definitions):\n');
  console.log('-'.repeat(100));
  
  const allCssColors = new Map<string, { file: string; count: number }>();
  
  for (const cssFile of cssFiles) {
    if (!fs.existsSync(cssFile.path)) {
      console.log(`\n${cssFile.name}: Not found`);
      continue;
    }
    
    const content = fs.readFileSync(cssFile.path, 'utf8');
    const colors = extractColorsWithContext(content);
    
    console.log(`\n${cssFile.name}:`);
    console.log(`  Total unique colors: ${colors.size}`);
    
    if (colors.size > 0) {
      const topColors = Array.from(colors.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
      
      topColors.forEach(usage => {
        console.log(`    ${usage.color} (${usage.count}x)`);
        
        // Track for comparison
        if (!allCssColors.has(usage.color)) {
          allCssColors.set(usage.color, { file: cssFile.name, count: 0 });
        }
        const existing = allCssColors.get(usage.color)!;
        existing.count += usage.count;
      });
    }
  }

  // Find duplicates
  console.log('\n\n' + '='.repeat(100));
  console.log('\n📊 DUPLICATE COLOR USAGE (Candidates for CSS variable consolidation):\n');
  console.log('-'.repeat(100));

  const colorFrequency = new Map<string, number>();
  for (const cssFile of cssFiles) {
    if (!fs.existsSync(cssFile.path)) continue;
    
    const content = fs.readFileSync(cssFile.path, 'utf8');
    const colors = extractColorsWithContext(content);
    
    colors.forEach(usage => {
      if (!colorFrequency.has(usage.color)) {
        colorFrequency.set(usage.color, 0);
      }
      colorFrequency.set(usage.color, colorFrequency.get(usage.color)! + usage.count);
    });
  }

  const duplicates = Array.from(colorFrequency.entries())
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  console.log(`Found ${duplicates.length} colors used 3+ times:\n`);
  duplicates.forEach(([color, count]) => {
    console.log(`  ${color} - used ${count} times`);
  });

  // Mobile vs Desktop specific analysis
  console.log('\n\n' + '='.repeat(100));
  console.log('\n📱 MOBILE CSS vs DESIGN SYSTEM COMPARISON:\n');
  console.log('-'.repeat(100));

  const mobileCssPath = path.join(styleDir, 'mobile.css');
  const designSystemPath = path.join(styleDir, 'design-system.css');

  if (fs.existsSync(mobileCssPath) && fs.existsSync(designSystemPath)) {
    const mobileContent = fs.readFileSync(mobileCssPath, 'utf8');
    const designContent = fs.readFileSync(designSystemPath, 'utf8');
    
    const mobileColors = extractColorsWithContext(mobileContent);
    const designColors = extractColorsWithContext(designContent);
    
    const mobileColorSet = new Set(mobileColors.keys());
    const designColorSet = new Set(designColors.keys());
    
    const shared = Array.from(mobileColorSet).filter(c => designColorSet.has(c));
    const mobileOnly = Array.from(mobileColorSet).filter(c => !designColorSet.has(c));
    const designOnly = Array.from(designColorSet).filter(c => !mobileColorSet.has(c));
    
    console.log(`Mobile Colors: ${mobileColors.size}`);
    console.log(`Design System Colors: ${designColors.size}`);
    console.log(`Shared: ${shared.length}`);
    console.log(`Mobile-only: ${mobileOnly.length}`);
    console.log(`Design-System-only: ${designOnly.length}`);
    
    console.log(`\n🔗 Shared Colors (Top 10):`);
    shared
      .slice(0, 10)
      .forEach(color => {
        const mCount = mobileColors.get(color)?.count || 0;
        const dCount = designColors.get(color)?.count || 0;
        console.log(`  ${color}: Mobile ${mCount}x, Design ${dCount}x`);
      });
    
    if (mobileOnly.length > 0) {
      console.log(`\n📱 Mobile-Only Colors:`);
      mobileOnly.slice(0, 8).forEach(color => {
        const count = mobileColors.get(color)?.count || 0;
        console.log(`  ${color} (${count}x)`);
      });
    }
  }

  console.log('\n\n✨ Analysis Complete!\n');
}

analyzeFeedPageColors().catch(console.error);
