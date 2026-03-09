/**
 * Extract All Colors in Use
 * Finds all colors defined and used in both mobile and desktop CSS
 */

import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');

interface ColorInfo {
  color: string;
  variable?: string;
  usedInFiles: Set<string>;
  count: number;
}

// Read all CSS files
function readCSSFiles(): { [key: string]: string } {
  const cssFiles: { [key: string]: string } = {};
  
  function walkDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (file.endsWith('.css')) {
        cssFiles[fullPath] = fs.readFileSync(fullPath, 'utf8');
      }
    }
  }
  
  walkDir(srcDir);
  return cssFiles;
}

// Extract hex colors, rgb colors, and CSS variables
function extractColors(content: string): string[] {
  const colors: string[] = [];
  
  // Hex colors (#ffffff, #000, etc)
  const hexMatches = content.match(/#[0-9a-fA-F]{3,8}\b/g);
  if (hexMatches) colors.push(...hexMatches);
  
  // RGB colors
  const rgbMatches = content.match(/rgb\([^)]*\)/g);
  if (rgbMatches) colors.push(...rgbMatches);
  
  // RGBA colors
  const rgbaMatches = content.match(/rgba\([^)]*\)/g);
  if (rgbaMatches) colors.push(...rgbaMatches);
  
  // HSL colors
  const hslMatches = content.match(/hsl\([^)]*\)/g);
  if (hslMatches) colors.push(...hslMatches);
  
  // Named colors
  const namedColorMatches = content.match(/\b(red|blue|green|yellow|orange|purple|pink|white|black|gray|grey|transparent|currentColor|inherit|initial)\b/gi);
  if (namedColorMatches) colors.push(...namedColorMatches);
  
  return colors;
}

// Extract CSS variable definitions
function extractVariableDefinitions(content: string): { [key: string]: string } {
  const vars: { [key: string]: string } = {};
  const varDefMatches = content.match(/--[a-zA-Z0-9\-]+\s*:\s*([^;]+);/g);
  
  if (varDefMatches) {
    varDefMatches.forEach(match => {
      const [varName, varValue] = match.split(':').map(s => s.trim());
      vars[varName.replace(';', '')] = varValue.replace(';', '');
    });
  }
  
  return vars;
}

// Main analysis
async function extractAllColors() {
  console.log('🎨 COLOR EXTRACTION REPORT\n');
  console.log('='.repeat(80) + '\n');
  
  const cssFiles = readCSSFiles();
  const colorMap = new Map<string, ColorInfo>();
  const allVariables: { [key: string]: string } = {};
  
  // First pass: extract all variable definitions
  for (const [filePath, content] of Object.entries(cssFiles)) {
    const vars = extractVariableDefinitions(content);
    Object.assign(allVariables, vars);
  }
  
  // Second pass: extract all colors
  for (const [filePath, content] of Object.entries(cssFiles)) {
    const relPath = path.relative(process.cwd(), filePath);
    const colors = extractColors(content);
    
    colors.forEach(color => {
      const normalized = color.toLowerCase().trim();
      if (!colorMap.has(normalized)) {
        colorMap.set(normalized, {
          color: normalized,
          usedInFiles: new Set(),
          count: 0
        });
      }
      
      const info = colorMap.get(normalized)!;
      info.count++;
      info.usedInFiles.add(relPath);
    });
  }
  
  // Extract colors used via variables
  const variableColors = new Map<string, ColorInfo>();
  for (const [varName, varValue] of Object.entries(allVariables)) {
    const color = varValue.trim().split(/\s/)[0]; // Get first value (color)
    if (color.match(/#|rgb|hsl|var\(/)) {
      variableColors.set(varName, {
        color,
        variable: varName,
        usedInFiles: new Set(),
        count: 0
      });
    }
  }
  
  // Display CSS Variables that contain colors
  console.log('📋 CSS COLOR VARIABLES DEFINED:\n');
  const sortedVars = Array.from(variableColors.entries())
    .sort((a, b) => a[0].localeCompare(b[0]));
  
  for (const [varName, info] of sortedVars) {
    console.log(`  ${varName}`);
    console.log(`    → ${info.color}\n`);
  }
  
  // Display direct color usage
  console.log('\n' + '='.repeat(80) + '\n');
  console.log('🎯 DIRECT COLOR VALUES IN USE:\n');
  
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1].count - a[1].count);
  
  for (const [color, info] of sortedColors) {
    if (color.match(/#|rgb\(|rgba\(|hsl\(/)) {
      console.log(`  ${color}`);
      console.log(`    Used in: ${Array.from(info.usedInFiles).join(', ')}`);
      console.log(`    Count: ${info.count}\n`);
    }
  }
  
  // Categorize by file type
  console.log('\n' + '='.repeat(80) + '\n');
  console.log('📱 MOBILE VS DESKTOP COLORS:\n');
  
  const mobileColors = new Set<string>();
  const desktopColors = new Set<string>();
  
  for (const [filePath, content] of Object.entries(cssFiles)) {
    const colors = extractColors(content);
    if (filePath.includes('mobile') || filePath.includes('Mobile')) {
      colors.forEach(c => mobileColors.add(c.toLowerCase()));
    } else if (filePath.includes('desktop') || filePath.includes('Desktop') || filePath.includes('design-system') || filePath.includes('design-tokens')) {
      colors.forEach(c => desktopColors.add(c.toLowerCase()));
    }
  }
  
  console.log(`Mobile-specific colors: ${mobileColors.size}`);
  console.log(`Desktop-specific colors: ${desktopColors.size}`);
  console.log(`Colors used in both: ${Array.from(mobileColors).filter(c => desktopColors.has(c)).length}\n`);
  
  console.log('✨ Color Extraction Complete!\n');
}

extractAllColors().catch(console.error);
