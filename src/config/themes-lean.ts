/**
 * LEAN Theme Configurations (January 31, 2026)
 * 5 optimized preset themes using the core lean palette
 * 
 * Philosophy: Minimize duplication. Use lean CSS variables as the source of truth.
 * Each theme only customizes primary/secondary/accent and derive rest from palette.
 */

import type { Theme } from '../types/theme';

/**
 * Helper: Generate theme colors from a single primary color
 * Maps to lean palette semantic tokens
 */
function createThemeFromPrimary(
  id: string,
  name: string,
  description: string,
  primaryColor: string,
  secondaryColor: string,
  accentColor: string
): Theme {
  return {
    id,
    name,
    description,
    category: 'colorful',
    isCustom: false,
    isPremium: false,
    colors: {
      // Primary Brand Colors (customized per theme)
      primary: primaryColor,
      primaryHover: secondaryColor,
      primaryLight: accentColor,
      primaryDark: primaryColor,

      // Secondary Colors (from lean palette)
      secondary: secondaryColor,
      secondaryHover: '#e5e7eb',
      secondaryLight: '#f3f4f6',
      secondaryDark: primaryColor,

      // Background Colors (consistent light palette)
      background: '#ffffff',
      backgroundAlt: '#f9fafb',
      surface: '#ffffff',
      surfaceHover: '#f3f4f6',

      // Border Colors (consistent neutrals)
      border: '#e5e7eb',
      borderLight: '#f3f4f6',
      borderDark: '#d1d5db',

      // Text Colors (consistent)
      textPrimary: '#1f2937',
      textSecondary: '#6b7280',
      textMuted: '#9ca3af',
      textInverse: '#ffffff',

      // Semantic Colors (from lean palette - universal)
      success: '#22c55e',
      successLight: '#86efac',
      successDark: '#16a34a',
      warning: '#f59e0b',
      warningLight: '#fcd34d',
      warningDark: '#d97706',
      error: '#ef4444',
      errorLight: '#fca5a5',
      errorDark: '#dc2626',
      info: '#3b82f6',
      infoLight: '#93c5fd',
      infoDark: '#1d4ed8',

      // Component Specific (light theme)
      navbarBg: '#ffffff',
      navbarText: '#1f2937',
      radialMenuPrimary: primaryColor,
      radialMenuSecondary: secondaryColor,
      cardBg: '#ffffff',
      cardBorder: '#e5e7eb',
      inputBg: '#f9fafb',
      inputBorder: '#d1d5db',
      buttonText: '#1f2937',
    },
    preview: {
      gradient: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
      primarySample: primaryColor,
      secondarySample: secondaryColor,
      backgroundSample: '#ffffff',
    }
  };
}

/**
 * 1. FUZO Original - Default yellow theme from lean palette
 */
export const FUZO_ORIGINAL = createThemeFromPrimary(
  'fuzo-original',
  'FUZO Original',
  'Warm and inviting yellow theme - perfect for food discovery',
  '#ffe838',  // --color-primary
  '#e89f3c',  // --color-secondary
  '#ffffff'   // --color-accent
);

/**
 * 2. Fresh Green - Natural green tones
 */
export const FRESH_GREEN = createThemeFromPrimary(
  'fresh-green',
  'Fresh Green',
  'Natural and healthy green tones inspired by fresh ingredients',
  '#22c55e',  // --color-success
  '#86efac',
  '#ffffff'
);

/**
 * 3. Elegant Purple - Sophisticated purple
 */
export const ELEGANT_PURPLE = createThemeFromPrimary(
  'elegant-purple',
  'Elegant Purple',
  'Sophisticated purple aesthetic for a premium feel',
  '#a78bfa',  // lighter purple from palette
  '#ddd6fe',
  '#ffffff'
);

/**
 * 4. Ocean Blue - Cool calming blues
 */
export const OCEAN_BLUE = createThemeFromPrimary(
  'ocean-blue',
  'Ocean Blue',
  'Cool and calming blue tones for a serene experience',
  '#3b82f6',  // --color-info
  '#93c5fd',
  '#ffffff'
);

/**
 * 5. Sunset Red - Warm energetic red
 */
export const SUNSET_RED = createThemeFromPrimary(
  'sunset-red',
  'Sunset Red',
  'Warm and energetic red tones for a bold experience',
  '#ef4444',  // --color-danger
  '#fca5a5',
  '#ffffff'
);

/**
 * Export all themes as a list
 */
export const ALL_THEMES: Theme[] = [
  FUZO_ORIGINAL,
  FRESH_GREEN,
  ELEGANT_PURPLE,
  OCEAN_BLUE,
  SUNSET_RED,
];

/**
 * Default theme (FUZO Original)
 */
export const DEFAULT_THEME = FUZO_ORIGINAL;

/**
 * Get theme by ID
 */
export function getThemeById(themeId: string): Theme | undefined {
  return ALL_THEMES.find(theme => theme.id === themeId);
}

/**
 * Get themes by category
 */
export function getThemesByCategory(category: Theme['category']): Theme[] {
  return ALL_THEMES.filter(theme => theme.category === category);
}
