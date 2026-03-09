/**
 * Page-by-Page Color Comparison
 * Analyzes color usage in specific pages/components (Desktop vs Mobile)
 */

import fs from 'fs';
import path from 'path';

interface PageColorData {
  colors: Map<string, { files: Set<string>; count: number }>;
  variables: Map<string, string>;
}

// Extract colors from content
function extractColors(content: string): string[] {
  const colors: string[] = [];
  
  // Hex colors
  const hexMatches = content.match(/#[0-9a-fA-F]{3,8}\b/g);
  if (hexMatches) colors.push(...hexMatches);
  
  // RGB/RGBA colors
  const rgbMatches = content.match(/rgba?\([^)]*\)/g);
  if (rgbMatches) colors.push(...rgbMatches);
  
  // HSL colors
  const hslMatches = content.match(/hsl\([^)]*\)/g);
  if (hslMatches) colors.push(...hslMatches);
  
  return colors.map(c => c.toLowerCase());
}

// Extract variable definitions
function extractVariableDefinitions(content: string): { [key: string]: string } {
  const vars: { [key: string]: string } = {};
  const varDefMatches = content.match(/--[a-zA-Z0-9\-]+\s*:\s*([^;]+);/g);
  
  if (varDefMatches) {
    varDefMatches.forEach(match => {
      const [varName, varValue] = match.split(':').map(s => s.trim());
      vars[varName.replace(';', '')] = varValue.replace(';', '').trim();
    });
  }
  
  return vars;
}

// Get colors from a component/page directory
function getPageColors(pageDir: string): PageColorData {
  const data: PageColorData = {
    colors: new Map(),
    variables: new Map()
  };

  function walkDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        walkDir(fullPath);
      } else if (file.endsWith('.css')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const relPath = path.relative(process.cwd(), fullPath);
        
        // Extract colors
        const colors = extractColors(content);
        colors.forEach(color => {
          if (!data.colors.has(color)) {
            data.colors.set(color, { files: new Set(), count: 0 });
          }
          const info = data.colors.get(color)!;
          info.files.add(relPath);
          info.count++;
        });
        
        // Extract variables
        const vars = extractVariableDefinitions(content);
        Object.entries(vars).forEach(([varName, varValue]) => {
          data.variables.set(varName, varValue);
        });
      }
    }
  }

  walkDir(pageDir);
  return data;
}

// Main comparison
async function comparePageColors() {
  console.log('🎨 PAGE-BY-PAGE COLOR COMPARISON (DESKTOP vs MOBILE)\n');
  console.log('='.repeat(90) + '\n');

  const pages = [
    { name: 'FEED', desktop: 'src/components/feed', mobile: 'src/components/feed' },
    { name: 'SCOUT', desktop: 'src/components/scout', mobile: 'src/components/scout' },
    { name: 'PLATE', desktop: 'src/components/plate', mobile: 'src/components/plate' },
    { name: 'BITES', desktop: 'src/components/bites', mobile: 'src/components/bites' },
    { name: 'TRIMS', desktop: 'src/components/trims', mobile: 'src/components/trims' },
  ];

  // Analyze Feed in detail since it uses component-specific CSS
  const feedDir = path.join(process.cwd(), 'src/components/feed');
  if (fs.existsSync(feedDir)) {
    console.log('📱 FEED PAGE ANALYSIS\n');
    console.log('-'.repeat(90));
    
    const feedCssFiles: { [key: string]: string } = {};
    const files = fs.readdirSync(feedDir);
    
    for (const file of files) {
      const fullPath = path.join(feedDir, file);
      if (file.endsWith('.css')) {
        feedCssFiles[file] = fs.readFileSync(fullPath, 'utf8');
      }
    }

    // Analyze FeedDesktop.tsx to find its CSS imports and usage
    const feedDesktopPath = path.join(feedDir, 'FeedDesktop.tsx');
    const feedMobilePath = path.join(feedDir, 'FeedMobile.tsx');
    const feedCardCssPath = path.join(feedDir, 'FeedCard.css');
    
    let desktopColors = new Map<string, { files: Set<string>; count: number }>();
    let mobileColors = new Map<string, { files: Set<string>; count: number }>();

    // Get colors from FeedCard.css (shared)
    if (fs.existsSync(feedCardCssPath)) {
      const cardCssContent = fs.readFileSync(feedCardCssPath, 'utf8');
      console.log('\n📄 Shared CSS (FeedCard.css):');
      console.log('-'.repeat(90));
      
      const colors = extractColors(cardCssContent);
      const uniqueColors = new Set(colors);
      
      console.log(`\nColors found (${uniqueColors.size} unique):\n`);
      Array.from(uniqueColors)
        .sort()
        .forEach(color => {
          const count = colors.filter(c => c === color).length;
          console.log(`  ${color} (used ${count} times)`);
        });
      
      // These are shared
      uniqueColors.forEach(color => {
        desktopColors.set(color, { files: new Set(['FeedCard.css']), count: 1 });
        mobileColors.set(color, { files: new Set(['FeedCard.css']), count: 1 });
      });
    }

    console.log('\n\n📋 CSS FILES IN FEED DIRECTORY:');
    console.log('-'.repeat(90));
    for (const filename of Object.keys(feedCssFiles)) {
      console.log(`  ${filename}`);
    }
  }

  // Now analyze full components
  console.log('\n\n' + '='.repeat(90));
  console.log('\n🔍 COMPONENT-WIDE COLOR ANALYSIS\n');

  for (const page of pages) {
    console.log('\n' + '='.repeat(90));
    console.log(`\n📄 ${page.name} COMPONENT\n`);
    
    const desktopData = getPageColors(page.desktop);
    const mobileData = getPageColors(page.mobile);
    
    const desktopColorSet = new Set(desktopData.colors.keys());
    const mobileColorSet = new Set(mobileData.colors.keys());
    
    const sharedColors = Array.from(desktopColorSet).filter(c => mobileColorSet.has(c));
    const desktopOnly = Array.from(desktopColorSet).filter(c => !mobileColorSet.has(c));
    const mobileOnly = Array.from(mobileColorSet).filter(c => !desktopColorSet.has(c));
    
    console.log(`Desktop unique colors: ${desktopData.colors.size}`);
    console.log(`Mobile unique colors: ${mobileData.colors.size}`);
    console.log(`Shared colors: ${sharedColors.length}`);
    console.log(`Desktop-only: ${desktopOnly.length}`);
    console.log(`Mobile-only: ${mobileOnly.length}\n`);
    
    if (sharedColors.length > 0) {
      console.log(`✅ SHARED COLORS (${sharedColors.length}):`);
      sharedColors
        .sort((a, b) => (mobileData.colors.get(b)?.count || 0) - (mobileData.colors.get(a)?.count || 0))
        .slice(0, 15)
        .forEach(color => {
          const dCount = desktopData.colors.get(color)?.count || 0;
          const mCount = mobileData.colors.get(color)?.count || 0;
          console.log(`  ${color} - Desktop: ${dCount}x, Mobile: ${mCount}x`);
        });
      if (sharedColors.length > 15) {
        console.log(`  ... and ${sharedColors.length - 15} more`);
      }
    }
    
    if (desktopOnly.length > 0) {
      console.log(`\n🖥️  DESKTOP-ONLY (${desktopOnly.length}):`);
      desktopOnly.slice(0, 10).forEach(color => {
        const count = desktopData.colors.get(color)?.count || 0;
        console.log(`  ${color} (${count}x)`);
      });
      if (desktopOnly.length > 10) {
        console.log(`  ... and ${desktopOnly.length - 10} more`);
      }
    }
    
    if (mobileOnly.length > 0) {
      console.log(`\n📱 MOBILE-ONLY (${mobileOnly.length}):`);
      mobileOnly.slice(0, 10).forEach(color => {
        const count = mobileData.colors.get(color)?.count || 0;
        console.log(`  ${color} (${count}x)`);
      });
      if (mobileOnly.length > 10) {
        console.log(`  ... and ${mobileOnly.length - 10} more`);
      }
    }
  }

  console.log('\n\n' + '='.repeat(90));
  console.log('\n✨ Analysis Complete!\n');
}

comparePageColors().catch(console.error);
