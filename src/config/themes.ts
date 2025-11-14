/**
 * Preset Theme Configurations
 * 7 beautiful preset themes for the FUZO food app
 */

import type { Theme } from '../types/theme';

/**
 * 1. FUZO Original - Warm and inviting orange theme (Default)
 */
export const FUZO_ORIGINAL: Theme = {
  id: 'fuzo-original',
  name: 'FUZO Original',
  description: 'Warm and inviting orange theme - perfect for food discovery',
  category: 'colorful',
  isCustom: false,
  isPremium: false,
  colors: {
    // Primary Brand Colors
    primary: '#FF6B35',
    primaryHover: '#E55A2B',
    primaryLight: '#FF8C42',
    primaryDark: '#CC5529',
    
    // Secondary Colors
    secondary: '#FFA556',
    secondaryHover: '#FF9138',
    secondaryLight: '#FFB87A',
    secondaryDark: '#E68A3D',
    
    // Background Colors
    background: '#FFFFFF',
    backgroundAlt: '#FFF7F0',
    surface: '#FFFFFF',
    surfaceHover: '#FFF5ED',
    
    // Border Colors
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderDark: '#D1D5DB',
    
    // Text Colors
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textInverse: '#FFFFFF',
    
    // Semantic Colors
    success: '#10B981',
    successLight: '#6EE7B7',
    successDark: '#059669',
    warning: '#F59E0B',
    warningLight: '#FCD34D',
    warningDark: '#D97706',
    error: '#EF4444',
    errorLight: '#FCA5A5',
    errorDark: '#DC2626',
    info: '#3B82F6',
    infoLight: '#93C5FD',
    infoDark: '#2563EB',
    
    // Component Specific
    navbarBg: '#FFFFFF',
    navbarText: '#111827',
    radialMenuPrimary: '#FF6B35',
    radialMenuSecondary: '#FFA556',
    cardBg: '#FFFFFF',
    cardBorder: '#E5E7EB',
    inputBg: '#F9FAFB',
    inputBorder: '#D1D5DB',
    buttonText: '#FFFFFF',
  },
  preview: {
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #FFA556 100%)',
    primarySample: '#FF6B35',
    secondarySample: '#FFA556',
    backgroundSample: '#FFFFFF',
  }
};

/**
 * 2. Fresh Green - Natural and healthy green tones
 */
export const FRESH_GREEN: Theme = {
  id: 'fresh-green',
  name: 'Fresh Green',
  description: 'Natural and healthy green tones inspired by fresh ingredients',
  category: 'colorful',
  isCustom: false,
  isPremium: false,
  colors: {
    // Primary Brand Colors
    primary: '#10B981',
    primaryHover: '#059669',
    primaryLight: '#34D399',
    primaryDark: '#047857',
    
    // Secondary Colors
    secondary: '#6EE7B7',
    secondaryHover: '#5CD9A8',
    secondaryLight: '#A7F3D0',
    secondaryDark: '#34D399',
    
    // Background Colors
    background: '#FFFFFF',
    backgroundAlt: '#F0FDF4',
    surface: '#FFFFFF',
    surfaceHover: '#ECFDF5',
    
    // Border Colors
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderDark: '#D1D5DB',
    
    // Text Colors
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textInverse: '#FFFFFF',
    
    // Semantic Colors
    success: '#10B981',
    successLight: '#6EE7B7',
    successDark: '#059669',
    warning: '#F59E0B',
    warningLight: '#FCD34D',
    warningDark: '#D97706',
    error: '#EF4444',
    errorLight: '#FCA5A5',
    errorDark: '#DC2626',
    info: '#3B82F6',
    infoLight: '#93C5FD',
    infoDark: '#2563EB',
    
    // Component Specific
    navbarBg: '#FFFFFF',
    navbarText: '#111827',
    radialMenuPrimary: '#10B981',
    radialMenuSecondary: '#6EE7B7',
    cardBg: '#FFFFFF',
    cardBorder: '#E5E7EB',
    inputBg: '#F9FAFB',
    inputBorder: '#D1D5DB',
    buttonText: '#FFFFFF',
  },
  preview: {
    gradient: 'linear-gradient(135deg, #10B981 0%, #6EE7B7 100%)',
    primarySample: '#10B981',
    secondarySample: '#6EE7B7',
    backgroundSample: '#FFFFFF',
  }
};

/**
 * 3. Elegant Purple - Sophisticated purple aesthetic
 */
export const ELEGANT_PURPLE: Theme = {
  id: 'elegant-purple',
  name: 'Elegant Purple',
  description: 'Sophisticated purple aesthetic for a premium feel',
  category: 'colorful',
  isCustom: false,
  isPremium: false,
  colors: {
    // Primary Brand Colors
    primary: '#8B5CF6',
    primaryHover: '#7C3AED',
    primaryLight: '#A78BFA',
    primaryDark: '#6D28D9',
    
    // Secondary Colors
    secondary: '#C4B5FD',
    secondaryHover: '#B8A5FA',
    secondaryLight: '#DDD6FE',
    secondaryDark: '#A78BFA',
    
    // Background Colors
    background: '#FFFFFF',
    backgroundAlt: '#FAF5FF',
    surface: '#FFFFFF',
    surfaceHover: '#F5F3FF',
    
    // Border Colors
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderDark: '#D1D5DB',
    
    // Text Colors
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textInverse: '#FFFFFF',
    
    // Semantic Colors
    success: '#10B981',
    successLight: '#6EE7B7',
    successDark: '#059669',
    warning: '#F59E0B',
    warningLight: '#FCD34D',
    warningDark: '#D97706',
    error: '#EF4444',
    errorLight: '#FCA5A5',
    errorDark: '#DC2626',
    info: '#3B82F6',
    infoLight: '#93C5FD',
    infoDark: '#2563EB',
    
    // Component Specific
    navbarBg: '#FFFFFF',
    navbarText: '#111827',
    radialMenuPrimary: '#8B5CF6',
    radialMenuSecondary: '#C4B5FD',
    cardBg: '#FFFFFF',
    cardBorder: '#E5E7EB',
    inputBg: '#F9FAFB',
    inputBorder: '#D1D5DB',
    buttonText: '#FFFFFF',
  },
  preview: {
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #C4B5FD 100%)',
    primarySample: '#8B5CF6',
    secondarySample: '#C4B5FD',
    backgroundSample: '#FFFFFF',
  }
};

/**
 * 4. Ocean Blue - Cool and calming blue tones
 */
export const OCEAN_BLUE: Theme = {
  id: 'ocean-blue',
  name: 'Ocean Blue',
  description: 'Cool and calming blue tones for a serene experience',
  category: 'colorful',
  isCustom: false,
  isPremium: false,
  colors: {
    // Primary Brand Colors
    primary: '#3B82F6',
    primaryHover: '#2563EB',
    primaryLight: '#60A5FA',
    primaryDark: '#1D4ED8',
    
    // Secondary Colors
    secondary: '#93C5FD',
    secondaryHover: '#7BB5FA',
    secondaryLight: '#BFDBFE',
    secondaryDark: '#60A5FA',
    
    // Background Colors
    background: '#FFFFFF',
    backgroundAlt: '#EFF6FF',
    surface: '#FFFFFF',
    surfaceHover: '#DBEAFE',
    
    // Border Colors
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderDark: '#D1D5DB',
    
    // Text Colors
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textInverse: '#FFFFFF',
    
    // Semantic Colors
    success: '#10B981',
    successLight: '#6EE7B7',
    successDark: '#059669',
    warning: '#F59E0B',
    warningLight: '#FCD34D',
    warningDark: '#D97706',
    error: '#EF4444',
    errorLight: '#FCA5A5',
    errorDark: '#DC2626',
    info: '#3B82F6',
    infoLight: '#93C5FD',
    infoDark: '#2563EB',
    
    // Component Specific
    navbarBg: '#FFFFFF',
    navbarText: '#111827',
    radialMenuPrimary: '#3B82F6',
    radialMenuSecondary: '#93C5FD',
    cardBg: '#FFFFFF',
    cardBorder: '#E5E7EB',
    inputBg: '#F9FAFB',
    inputBorder: '#D1D5DB',
    buttonText: '#FFFFFF',
  },
  preview: {
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #93C5FD 100%)',
    primarySample: '#3B82F6',
    secondarySample: '#93C5FD',
    backgroundSample: '#FFFFFF',
  }
};

/**
 * 5. Sunset Red - Bold and energetic red palette
 */
export const SUNSET_RED: Theme = {
  id: 'sunset-red',
  name: 'Sunset Red',
  description: 'Bold and energetic red palette that catches the eye',
  category: 'colorful',
  isCustom: false,
  isPremium: false,
  colors: {
    // Primary Brand Colors
    primary: '#EF4444',
    primaryHover: '#DC2626',
    primaryLight: '#F87171',
    primaryDark: '#B91C1C',
    
    // Secondary Colors
    secondary: '#FCA5A5',
    secondaryHover: '#F98A8A',
    secondaryLight: '#FECACA',
    secondaryDark: '#F87171',
    
    // Background Colors
    background: '#FFFFFF',
    backgroundAlt: '#FEF2F2',
    surface: '#FFFFFF',
    surfaceHover: '#FEE2E2',
    
    // Border Colors
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderDark: '#D1D5DB',
    
    // Text Colors
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textInverse: '#FFFFFF',
    
    // Semantic Colors
    success: '#10B981',
    successLight: '#6EE7B7',
    successDark: '#059669',
    warning: '#F59E0B',
    warningLight: '#FCD34D',
    warningDark: '#D97706',
    error: '#EF4444',
    errorLight: '#FCA5A5',
    errorDark: '#DC2626',
    info: '#3B82F6',
    infoLight: '#93C5FD',
    infoDark: '#2563EB',
    
    // Component Specific
    navbarBg: '#FFFFFF',
    navbarText: '#111827',
    radialMenuPrimary: '#EF4444',
    radialMenuSecondary: '#FCA5A5',
    cardBg: '#FFFFFF',
    cardBorder: '#E5E7EB',
    inputBg: '#F9FAFB',
    inputBorder: '#D1D5DB',
    buttonText: '#FFFFFF',
  },
  preview: {
    gradient: 'linear-gradient(135deg, #EF4444 0%, #FCA5A5 100%)',
    primarySample: '#EF4444',
    secondarySample: '#FCA5A5',
    backgroundSample: '#FFFFFF',
  }
};

/**
 * 6. Dark Mode - OLED-friendly dark theme
 */
export const DARK_MODE: Theme = {
  id: 'dark-mode',
  name: 'Dark Mode',
  description: 'OLED-friendly dark theme for comfortable night viewing',
  category: 'dark',
  isCustom: false,
  isPremium: false,
  colors: {
    // Primary Brand Colors
    primary: '#FF6B35',
    primaryHover: '#FF8C42',
    primaryLight: '#FFA556',
    primaryDark: '#E55A2B',
    
    // Secondary Colors
    secondary: '#FFA556',
    secondaryHover: '#FFB87A',
    secondaryLight: '#FFC899',
    secondaryDark: '#FF9138',
    
    // Background Colors
    background: '#0F172A',
    backgroundAlt: '#1E293B',
    surface: '#1E293B',
    surfaceHover: '#334155',
    
    // Border Colors
    border: '#334155',
    borderLight: '#475569',
    borderDark: '#1E293B',
    
    // Text Colors
    textPrimary: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    textInverse: '#0F172A',
    
    // Semantic Colors
    success: '#10B981',
    successLight: '#34D399',
    successDark: '#059669',
    warning: '#F59E0B',
    warningLight: '#FBBF24',
    warningDark: '#D97706',
    error: '#EF4444',
    errorLight: '#F87171',
    errorDark: '#DC2626',
    info: '#3B82F6',
    infoLight: '#60A5FA',
    infoDark: '#2563EB',
    
    // Component Specific
    navbarBg: '#1E293B',
    navbarText: '#F1F5F9',
    radialMenuPrimary: '#FF6B35',
    radialMenuSecondary: '#FFA556',
    cardBg: '#1E293B',
    cardBorder: '#334155',
    inputBg: '#0F172A',
    inputBorder: '#334155',
    buttonText: '#FFFFFF',
  },
  preview: {
    gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #FF6B35 100%)',
    primarySample: '#FF6B35',
    secondarySample: '#FFA556',
    backgroundSample: '#0F172A',
  }
};

/**
 * 7. Minimal Monochrome - Clean black and white
 */
export const MINIMAL_MONOCHROME: Theme = {
  id: 'minimal-mono',
  name: 'Minimal Monochrome',
  description: 'Clean black and white for a minimal, focused experience',
  category: 'minimal',
  isCustom: false,
  isPremium: false,
  colors: {
    // Primary Brand Colors
    primary: '#000000',
    primaryHover: '#1F1F1F',
    primaryLight: '#404040',
    primaryDark: '#000000',
    
    // Secondary Colors
    secondary: '#525252',
    secondaryHover: '#737373',
    secondaryLight: '#A3A3A3',
    secondaryDark: '#262626',
    
    // Background Colors
    background: '#FFFFFF',
    backgroundAlt: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceHover: '#FAFAFA',
    
    // Border Colors
    border: '#E5E5E5',
    borderLight: '#F5F5F5',
    borderDark: '#D4D4D4',
    
    // Text Colors
    textPrimary: '#0A0A0A',
    textSecondary: '#525252',
    textMuted: '#A3A3A3',
    textInverse: '#FFFFFF',
    
    // Semantic Colors
    success: '#22C55E',
    successLight: '#86EFAC',
    successDark: '#16A34A',
    warning: '#EAB308',
    warningLight: '#FDE047',
    warningDark: '#CA8A04',
    error: '#DC2626',
    errorLight: '#FCA5A5',
    errorDark: '#B91C1C',
    info: '#3B82F6',
    infoLight: '#93C5FD',
    infoDark: '#2563EB',
    
    // Component Specific
    navbarBg: '#FFFFFF',
    navbarText: '#0A0A0A',
    radialMenuPrimary: '#000000',
    radialMenuSecondary: '#525252',
    cardBg: '#FFFFFF',
    cardBorder: '#E5E5E5',
    inputBg: '#FAFAFA',
    inputBorder: '#D4D4D4',
    buttonText: '#FFFFFF',
  },
  preview: {
    gradient: 'linear-gradient(135deg, #000000 0%, #525252 50%, #FFFFFF 100%)',
    primarySample: '#000000',
    secondarySample: '#525252',
    backgroundSample: '#FFFFFF',
  }
};

/**
 * Array of all preset themes
 */
export const PRESET_THEMES: Theme[] = [
  FUZO_ORIGINAL,
  FRESH_GREEN,
  ELEGANT_PURPLE,
  OCEAN_BLUE,
  SUNSET_RED,
  DARK_MODE,
  MINIMAL_MONOCHROME,
];

/**
 * Default theme (FUZO Original)
 */
export const DEFAULT_THEME = FUZO_ORIGINAL;

/**
 * Get theme by ID
 */
export function getThemeById(themeId: string): Theme | undefined {
  return PRESET_THEMES.find(theme => theme.id === themeId);
}

/**
 * Get themes by category
 */
export function getThemesByCategory(category: Theme['category']): Theme[] {
  return PRESET_THEMES.filter(theme => theme.category === category);
}
