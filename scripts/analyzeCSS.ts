/**
 * CSS Analysis Script
 * Identifies unused CSS tokens and classes
 */

import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');

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

// Extract CSS variables and classes from content
function extractCSSDefinitions(content: string) {
  const variables = new Set<string>();
  const classes = new Set<string>();
  
  // Extract CSS variables (--var-name)
  const varMatches = content.match(/--[a-zA-Z0-9\-]+/g);
  if (varMatches) {
    varMatches.forEach(v => variables.add(v));
  }
  
  // Extract class definitions
  const classMatches = content.match(/\.([a-zA-Z0-9\-_]+)/g);
  if (classMatches) {
    classMatches.forEach(c => classes.add(c.substring(1))); // Remove leading dot
  }
  
  return { variables, classes };
}

// Read all source files
function readSourceFiles(): string {
  let allContent = '';
  
  function walkDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        walkDir(fullPath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
        try {
          allContent += fs.readFileSync(fullPath, 'utf8');
        } catch (e) {
          // Skip read errors
        }
      }
    }
  }
  
  walkDir(srcDir);
  return allContent;
}

// Main analysis
async function analyzeCSS() {
  console.log('📊 CSS Analysis Report\n');
  console.log('='.repeat(60) + '\n');
  
  const cssFiles = readCSSFiles();
  const sourceContent = readSourceFiles();
  
  let totalVars = 0;
  let totalClasses = 0;
  const unusedVars = new Map<string, string[]>();
  const unusedClasses = new Map<string, string[]>();
  
  for (const [filePath, content] of Object.entries(cssFiles)) {
    const { variables, classes } = extractCSSDefinitions(content);
    const relPath = path.relative(process.cwd(), filePath);
    
    console.log(`\n📄 ${relPath}`);
    console.log('-'.repeat(60));
    
    const fileUnusedVars: string[] = [];
    const fileUnusedClasses: string[] = [];
    
    // Check variable usage
    for (const variable of variables) {
      totalVars++;
      // Check if variable is used in source files or in other CSS (excluding definition line)
      const usagePattern = new RegExp(variable, 'g');
      const matches = (sourceContent + Object.values(cssFiles).join('\n')).match(usagePattern) || [];
      
      if (matches.length <= 1) {
        fileUnusedVars.push(variable);
      }
    }
    
    // Check class usage
    for (const cssClass of classes) {
      totalClasses++;
      // Check if class is used in source files
      if (!sourceContent.includes(cssClass)) {
        fileUnusedClasses.push(cssClass);
      }
    }
    
    if (fileUnusedVars.length > 0) {
      console.log(`\n  🔴 Unused Variables (${fileUnusedVars.length}):`);
      fileUnusedVars.slice(0, 10).forEach(v => console.log(`     ${v}`));
      if (fileUnusedVars.length > 10) {
        console.log(`     ... and ${fileUnusedVars.length - 10} more`);
      }
      unusedVars.set(relPath, fileUnusedVars);
    }
    
    if (fileUnusedClasses.length > 0) {
      console.log(`\n  🟡 Unused Classes (${fileUnusedClasses.length}):`);
      fileUnusedClasses.slice(0, 10).forEach(c => console.log(`     .${c}`));
      if (fileUnusedClasses.length > 10) {
        console.log(`     ... and ${fileUnusedClasses.length - 10} more`);
      }
      unusedClasses.set(relPath, fileUnusedClasses);
    }
    
    console.log(`\n  ✅ Total Variables: ${variables.size}`);
    console.log(`  ✅ Total Classes: ${classes.size}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📈 Summary:');
  
  const totalUnusedVars = Array.from(unusedVars.values()).reduce((acc, arr) => acc + arr.length, 0);
  const totalUnusedClasses = Array.from(unusedClasses.values()).reduce((acc, arr) => acc + arr.length, 0);
  
  console.log(`\n  Total CSS Variables: ${totalVars}`);
  console.log(`  Unused Variables: ${totalUnusedVars} (${((totalUnusedVars / totalVars) * 100).toFixed(1)}%)`);
  console.log(`\n  Total CSS Classes: ${totalClasses}`);
  console.log(`  Unused Classes: ${totalUnusedClasses} (${((totalUnusedClasses / totalClasses) * 100).toFixed(1)}%)`);
  
  console.log('\n✨ Analysis Complete!\n');
}

analyzeCSS().catch(console.error);
