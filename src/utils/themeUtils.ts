/**
 * Theme Utility Functions
 * Helper functions for theme manipulation, validation, and CSS variable generation
 */

import type { Theme, ThemeColors, CSSVariableMap, ThemeValidation, ContrastIssue } from '../types/theme';

/**
 * Convert theme colors to CSS variable map
 * @param colors Theme color object
 * @returns Object mapping CSS variable names to color values
 */
export function themeToCSSVariables(colors: ThemeColors): CSSVariableMap {
  const cssVars: CSSVariableMap = {};
  
  // Convert camelCase to kebab-case and prefix with --color-
  Object.entries(colors).forEach(([key, value]) => {
    const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    cssVars[cssVarName] = value;
  });
  
  return cssVars;
}

/**
 * Apply theme to document root
 * @param theme Theme to apply
 */
export function applyThemeToDOM(theme: Theme): void {
  console.log('🎨 applyThemeToDOM called with theme:', theme.name);
  const root = document.documentElement;
  const cssVars = themeToCSSVariables(theme.colors);
  
  console.log('📝 Generated CSS variables:', Object.keys(cssVars).length, 'variables');
  
  // Apply each CSS variable
  Object.entries(cssVars).forEach(([varName, value]) => {
    root.style.setProperty(varName, value);
  });
  
  // Also map our theme colors to shadcn/ui variables for compatibility
  // This allows existing UI components to respond to theme changes
  root.style.setProperty('--background', theme.colors.background);
  root.style.setProperty('--foreground', theme.colors.textPrimary);
  root.style.setProperty('--card', theme.colors.surface);
  root.style.setProperty('--card-foreground', theme.colors.textPrimary);
  root.style.setProperty('--popover', theme.colors.surface);
  root.style.setProperty('--popover-foreground', theme.colors.textPrimary);
  root.style.setProperty('--primary', theme.colors.primary);
  root.style.setProperty('--primary-foreground', theme.colors.textInverse);
  root.style.setProperty('--secondary', theme.colors.secondary);
  root.style.setProperty('--secondary-foreground', theme.colors.textInverse);
  root.style.setProperty('--muted', theme.colors.surface);
  root.style.setProperty('--muted-foreground', theme.colors.textMuted);
  root.style.setProperty('--accent', theme.colors.surfaceHover);
  root.style.setProperty('--accent-foreground', theme.colors.textPrimary);
  root.style.setProperty('--border', theme.colors.border);
  root.style.setProperty('--input', theme.colors.surface);
  root.style.setProperty('--input-background', theme.colors.surface);
  root.style.setProperty('--ring', theme.colors.primaryHover);
  
  console.log('✅ CSS variables applied to :root (including shadcn compatibility)');
  
  // Store theme ID in data attribute for debugging
  root.setAttribute('data-theme', theme.id);
  
  // Add smooth transition class
  root.classList.add('theme-transitioning');
  setTimeout(() => {
    root.classList.remove('theme-transitioning');
  }, 300);
  
  console.log('🎨 Theme application complete');
}

/**
 * Remove all theme CSS variables from DOM
 */
export function clearThemeFromDOM(): void {
  const root = document.documentElement;
  const cssVars = themeToCSSVariables({} as ThemeColors);
  
  Object.keys(cssVars).forEach(varName => {
    root.style.removeProperty(varName);
  });
  
  root.removeAttribute('data-theme');
}

/**
 * Calculate color contrast ratio (WCAG)
 * @param color1 First color (hex)
 * @param color2 Second color (hex)
 * @returns Contrast ratio
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const getLuminance = (hex: string): number => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // Apply gamma correction
    const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    
    return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validate theme accessibility
 * @param theme Theme to validate
 * @returns Validation result with issues
 */
export function validateThemeAccessibility(theme: Theme): ThemeValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const contrastIssues: ContrastIssue[] = [];
  
  // Check text on background contrast
  const textBgRatio = calculateContrastRatio(theme.colors.textPrimary, theme.colors.background);
  if (textBgRatio < 4.5) {
    contrastIssues.push({
      pair: [theme.colors.textPrimary, theme.colors.background],
      ratio: textBgRatio,
      minimumRequired: 4.5,
      severity: 'error',
      suggestion: 'Increase contrast between text and background for better readability'
    });
    errors.push('Text-background contrast ratio is below 4.5:1');
  }
  
  // Check primary button text contrast
  const buttonTextRatio = calculateContrastRatio(theme.colors.buttonText, theme.colors.primary);
  if (buttonTextRatio < 4.5) {
    contrastIssues.push({
      pair: [theme.colors.buttonText, theme.colors.primary],
      ratio: buttonTextRatio,
      minimumRequired: 4.5,
      severity: 'warning',
      suggestion: 'Consider adjusting button text or primary color'
    });
    warnings.push('Button text contrast ratio could be improved');
  }
  
  // Check secondary text contrast
  const secondaryTextRatio = calculateContrastRatio(theme.colors.textSecondary, theme.colors.background);
  if (secondaryTextRatio < 4.5) {
    warnings.push('Secondary text contrast is below recommended 4.5:1');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    contrastIssues: contrastIssues.length > 0 ? contrastIssues : undefined
  };
}

/**
 * Check if color is valid hex
 * @param color Color string to validate
 * @returns True if valid hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Validate all colors in theme
 * @param colors Theme colors object
 * @returns True if all colors are valid
 */
export function validateThemeColors(colors: Partial<ThemeColors>): { isValid: boolean; invalidKeys: string[] } {
  const invalidKeys: string[] = [];
  
  Object.entries(colors).forEach(([key, value]) => {
    if (!isValidHexColor(value)) {
      invalidKeys.push(key);
    }
  });
  
  return {
    isValid: invalidKeys.length === 0,
    invalidKeys
  };
}

/**
 * Generate a lighter shade of a color
 * @param hex Base color
 * @param percent Percentage lighter (0-100)
 * @returns Lighter color hex
 */
export function lightenColor(hex: string, percent: number): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const amount = Math.floor((percent / 100) * 255);
  
  const newR = Math.min(255, r + amount);
  const newG = Math.min(255, g + amount);
  const newB = Math.min(255, b + amount);
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Generate a darker shade of a color
 * @param hex Base color
 * @param percent Percentage darker (0-100)
 * @returns Darker color hex
 */
export function darkenColor(hex: string, percent: number): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const amount = Math.floor((percent / 100) * 255);
  
  const newR = Math.max(0, r - amount);
  const newG = Math.max(0, g - amount);
  const newB = Math.max(0, b - amount);
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Auto-generate theme variants from primary color
 * @param primaryColor Primary color hex
 * @returns Partial theme colors with generated variants
 */
export function generateThemeVariants(primaryColor: string): Partial<ThemeColors> {
  return {
    primary: primaryColor,
    primaryHover: darkenColor(primaryColor, 10),
    primaryLight: lightenColor(primaryColor, 15),
    primaryDark: darkenColor(primaryColor, 20),
  };
}

/**
 * Export theme as JSON
 * @param theme Theme to export
 * @returns JSON string
 */
export function exportTheme(theme: Theme): string {
  const exportData = {
    version: '1.0.0',
    theme: {
      name: theme.name,
      description: theme.description,
      category: theme.category,
      colors: theme.colors,
      preview: theme.preview,
    },
    metadata: {
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0', // TODO: Get from package.json
    }
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Import theme from JSON
 * @param jsonString JSON theme data
 * @returns Parsed theme object
 */
export function importTheme(jsonString: string): Omit<Theme, 'id' | 'isCustom' | 'isPremium'> {
  try {
    const data = JSON.parse(jsonString);
    
    if (!data.theme || !data.theme.colors) {
      throw new Error('Invalid theme format');
    }
    
    return {
      name: data.theme.name,
      description: data.theme.description || '',
      category: data.theme.category || 'custom',
      colors: data.theme.colors,
      preview: data.theme.preview || {
        gradient: 'linear-gradient(135deg, #000000 0%, #FFFFFF 100%)',
        primarySample: data.theme.colors.primary,
        secondarySample: data.theme.colors.secondary,
        backgroundSample: data.theme.colors.background,
      }
    };
  } catch (error) {
    throw new Error(`Failed to import theme: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get CSS for theme transitions
 * @param speed Transition speed
 * @returns CSS string
 */
export function getThemeTransitionCSS(speed: 'instant' | 'fast' | 'smooth' = 'smooth'): string {
  const durations = {
    instant: '0s',
    fast: '0.15s',
    smooth: '0.3s'
  };
  
  return `
    .theme-transitioning * {
      transition: background-color ${durations[speed]} ease,
                  color ${durations[speed]} ease,
                  border-color ${durations[speed]} ease !important;
    }
  `;
}

/**
 * Detect if color is light or dark
 * @param hex Color hex
 * @returns 'light' or 'dark'
 */
export function getColorBrightness(hex: string): 'light' | 'dark' {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? 'light' : 'dark';
}
