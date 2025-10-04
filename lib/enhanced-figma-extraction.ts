// lib/enhanced-figma-extraction.ts
// Clean Figma-to-TweakCN token transformation

import { FIGMA_TO_TWEAKCN_MAP } from './figma-token-map';

/**
 * Transform Figma extracted code to use TweakCN semantic tokens
 * This replaces hardcoded colors with TweakCN tokens without overriding TweakCN's color scheme
 */
export function transformFigmaToTweakCN(code: string): string {
  let transformedCode = code;
  
  // Replace hardcoded hex colors with TweakCN semantic tokens
  Object.entries(FIGMA_TO_TWEAKCN_MAP.colors).forEach(([hardcodedColor, tweakCNToken]) => {
    // Replace direct hex values
    const hexRegex = new RegExp(hardcodedColor.replace('#', '#'), 'gi');
    transformedCode = transformedCode.replace(hexRegex, tweakCNToken);
    
    // Replace Tailwind arbitrary values like bg-[#ff9500]
    const bgRegex = new RegExp(`bg-\\[${hardcodedColor}\\]`, 'gi');
    const textRegex = new RegExp(`text-\\[${hardcodedColor}\\]`, 'gi');
    const borderRegex = new RegExp(`border-\\[${hardcodedColor}\\]`, 'gi');
    
    // Convert to appropriate Tailwind classes
    const tokenClass = convertTokenToTailwindClass(tweakCNToken);
    transformedCode = transformedCode.replace(bgRegex, `bg-${tokenClass}`);
    transformedCode = transformedCode.replace(textRegex, `text-${tokenClass}`);
    transformedCode = transformedCode.replace(borderRegex, `border-${tokenClass}`);
  });
  
  // Replace font families
  Object.entries(FIGMA_TO_TWEAKCN_MAP.fonts).forEach(([oldFont, newFont]) => {
    if (oldFont.includes('px')) return; // Skip size mappings
    
    const fontRegex = new RegExp(`font-\\['${oldFont}'[^\\]]*\\]`, 'gi');
    transformedCode = transformedCode.replace(fontRegex, `font-sans`);
  });
  
  return transformedCode;
}

/**
 * Convert hsl(var(--token)) to Tailwind class name
 */
function convertTokenToTailwindClass(token: string): string {
  if (token.includes('--primary-foreground')) return 'primary-foreground';
  if (token.includes('--primary')) return 'primary';
  if (token.includes('--secondary-foreground')) return 'secondary-foreground';
  if (token.includes('--secondary')) return 'secondary';
  if (token.includes('--accent-foreground')) return 'accent-foreground';
  if (token.includes('--accent')) return 'accent';
  if (token.includes('--muted-foreground')) return 'muted-foreground';
  if (token.includes('--muted')) return 'muted';
  if (token.includes('--card-foreground')) return 'card-foreground';
  if (token.includes('--card')) return 'card';
  if (token.includes('--background')) return 'background';
  if (token.includes('--foreground')) return 'foreground';
  if (token.includes('--border')) return 'border';
  
  return 'primary'; // fallback
}

/**
 * Enhanced MCP extraction with automatic TweakCN token transformation
 */
export async function extractTweakCNComponent(nodeId: string) {
  // Note: This would integrate with your MCP system
  // For now, it's a utility for manual transformation
  
  // const rawComponent = await mcp_my_mcp_server_get_code({
  //   nodeId,
  //   clientFrameworks: "react",
  //   clientLanguages: "typescript"
  // });
  
  // return transformFigmaToTweakCN(rawComponent);
  
  return `// Use this function to transform MCP extracted components
// Example: const component = transformFigmaToTweakCN(figmaCode);`;
}

export default transformFigmaToTweakCN;