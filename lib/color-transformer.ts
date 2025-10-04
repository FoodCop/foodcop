// lib/color-transformer.ts
// utility to help transform existing components from hardcoded colors to TweakCN tokens

import { transformFigmaToTweakCN } from './enhanced-figma-extraction';

/**
 * Transform a component file content from hardcoded colors to TweakCN tokens
 */
export function transformComponentColors(componentCode: string): string {
  return transformFigmaToTweakCN(componentCode);
}

/**
 * Analyze a component to find hardcoded colors
 */
export function analyzeComponentColors(componentCode: string): {
  hardcodedColors: string[];
  transformations: Array<{ from: string; to: string; }>;
} {
  const hardcodedColorRegex = /#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g;
  const hardcodedColors = [...new Set(componentCode.match(hardcodedColorRegex) || [])];
  
  const transformations = hardcodedColors.map(color => {
    // Map to TweakCN token based on our mapping
    const tweakCNToken = getTokenForColor(color);
    return { from: color, to: tweakCNToken };
  });
  
  return { hardcodedColors, transformations };
}

function getTokenForColor(hexColor: string): string {
  const colorMap: Record<string, string> = {
    '#ff9500': 'hsl(var(--primary))',
    '#ffd74a': 'hsl(var(--primary))', 
    '#f14c35': 'hsl(var(--accent))',
    '#0b1f3a': 'hsl(var(--secondary))',
    '#0c1d2e': 'hsl(var(--secondary))',
    '#748ba0': 'hsl(var(--muted-foreground))',
    '#f6f9f9': 'hsl(var(--background))',
    '#fff8f0': 'hsl(var(--background))',
    '#040325': 'hsl(var(--card))',
    '#2c3e50': 'hsl(var(--card-foreground))',
    '#7fdbda': 'hsl(var(--accent))',
    '#ffffff': 'hsl(var(--background))',
    '#000000': 'hsl(var(--foreground))',
    '#dbe9f5': 'hsl(var(--border))',
  };
  
  return colorMap[hexColor.toLowerCase()] || 'hsl(var(--foreground))';
}

/**
 * Show preview of what transformations would be applied
 */
export function previewTransformations(componentCode: string): string {
  const analysis = analyzeComponentColors(componentCode);
  
  let preview = `// Color Transformation Preview\n`;
  preview += `// Found ${analysis.hardcodedColors.length} hardcoded colors\n\n`;
  
  analysis.transformations.forEach(({ from, to }) => {
    preview += `// ${from} → ${to}\n`;
  });
  
  preview += `\n// Transformed component would use TweakCN semantic tokens\n`;
  preview += `// Example: bg-[#ff9500] → bg-primary\n`;
  
  return preview;
}

export default transformComponentColors;