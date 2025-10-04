// lib/figma-token-map.ts
// Token mapping configuration for Figma MCP to TweakCN hybrid system

// lib/figma-token-map.ts
// Token mapping configuration for Figma MCP to TweakCN hybrid system
// Maps old hardcoded FUZO colors to TweakCN semantic tokens

export const FIGMA_TO_TWEAKCN_MAP = {
  colors: {
    // Map old FUZO hardcoded colors to TweakCN semantic tokens
    // TweakCN defines: primary, secondary, accent, etc. with its own color scheme
    // We just map old hardcoded values to these semantic meanings
    
    '#ff9500': 'hsl(var(--primary))',           // Old FUZO Yellow → TweakCN Primary
    '#ffd74a': 'hsl(var(--primary))',           // Old FUZO Yellow variant → TweakCN Primary
    '#f14c35': 'hsl(var(--accent))',            // Old FUZO Coral → TweakCN Accent  
    '#0b1f3a': 'hsl(var(--secondary))',         // Old FUZO Navy → TweakCN Secondary
    '#0c1d2e': 'hsl(var(--secondary))',         // Old FUZO Dark Navy → TweakCN Secondary
    '#748ba0': 'hsl(var(--muted-foreground))',   // Old secondary text → TweakCN Muted
    '#f6f9f9': 'hsl(var(--background))',        // Old light background → TweakCN Background
    '#fff8f0': 'hsl(var(--background))',        // Old FUZO Cream → TweakCN Background
    '#040325': 'hsl(var(--card))',              // Old dark elements → TweakCN Card
    '#2c3e50': 'hsl(var(--card-foreground))',   // Old FUZO Charcoal → TweakCN Card Text
    '#7fdbda': 'hsl(var(--accent))',            // Old FUZO Mint → TweakCN Accent
    
    // Additional common hardcoded colors found in components
    '#ffffff': 'hsl(var(--background))',        // White → TweakCN Background
    '#000000': 'hsl(var(--foreground))',        // Black → TweakCN Foreground
    '#dbe9f5': 'hsl(var(--border))',            // Light borders → TweakCN Border
  },
  
  fonts: {
    // Font family mappings - TweakCN provides: Inter, Source Serif 4, JetBrains Mono
    'DM Sans': 'var(--font-sans)',              // Map old DM Sans to TweakCN sans
    'Chocolate Classical Sans': 'var(--font-sans)', // Map old font to TweakCN sans
    'Inter': 'var(--font-sans)',                // TweakCN default
    
    // Font size mappings to Tailwind classes
    '28px': 'text-2xl',
    '24px': 'text-xl', 
    '20px': 'text-lg',
    '18px': 'text-lg',
    '16px': 'text-base',
    '14px': 'text-sm',
    '12px': 'text-xs',
    '10px': 'text-xs'
  },
  
  spacing: {
    // TweakCN provides --spacing: 0.25rem base
    // Map old hardcoded spacing to Tailwind classes
    '32px': 'space-8',
    '28px': 'space-7', 
    '24px': 'space-6',
    '20px': 'space-5',
    '16px': 'space-4',
    '12px': 'space-3',
    '8px': 'space-2',
    '4px': 'space-1',
    '2px': 'space-0.5'
  }
};

// No hardcoded overrides - use TweakCN semantic tokens as-is
export const MANUAL_OVERRIDE_COMPONENTS: string[] = [
  // Only add components here if TweakCN semantic tokens absolutely cannot be used
  // Example: Legal requirements, third-party integrations, etc.
];

// Project theme configuration - TweakCN theme used as-is
export const PROJECT_THEME_CONFIG = {
  tweakCNThemeId: 'cmg4w44p4000a04kze8ltdnnv',
  tweakCNUrl: 'https://tweakcn.com/themes/cmg4w44p4000a04kze8ltdnnv/css',
  
  projectName: 'FUZO',
  
  // TweakCN actual colors (for reference):
  // --primary: oklch(0.8076 0.1653 73.4872)    - Greenish yellow
  // --accent: oklch(0.9869 0.0214 95.2774)     - Very light yellow  
  // --secondary: oklch(0.9670 0.0029 264.5419) - Light grayish purple
  
  // These will replace old FUZO colors:
  brandPrimary: 'hsl(var(--primary))',         // TweakCN primary (not FUZO yellow)
  brandAccent: 'hsl(var(--accent))',           // TweakCN accent (not FUZO coral)  
  brandSecondary: 'hsl(var(--secondary))',     // TweakCN secondary (not FUZO navy)
  
  manualOverrides: MANUAL_OVERRIDE_COMPONENTS
};

export default FIGMA_TO_TWEAKCN_MAP;