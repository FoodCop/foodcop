/**
 * Theme System Type Definitions
 * Defines all types for the FUZO theme customization system
 */

/**
 * Complete color palette for a theme
 */
export interface ThemeColors {
  // Primary Brand Colors
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryDark: string;
  
  // Secondary Colors
  secondary: string;
  secondaryHover: string;
  secondaryLight: string;
  secondaryDark: string;
  
  // Background Colors
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceHover: string;
  
  // Border Colors
  border: string;
  borderLight: string;
  borderDark: string;
  
  // Text Colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  
  // Semantic Colors
  success: string;
  successLight: string;
  successDark: string;
  warning: string;
  warningLight: string;
  warningDark: string;
  error: string;
  errorLight: string;
  errorDark: string;
  info: string;
  infoLight: string;
  infoDark: string;
  
  // Component Specific Colors
  navbarBg: string;
  navbarText: string;
  radialMenuPrimary: string;
  radialMenuSecondary: string;
  cardBg: string;
  cardBorder: string;
  inputBg: string;
  inputBorder: string;
  buttonText: string;
}

/**
 * Theme metadata and configuration
 */
export interface Theme {
  id: string;
  name: string;
  description: string;
  category: ThemeCategory;
  colors: ThemeColors;
  preview: ThemePreview;
  isCustom: boolean;
  isPremium: boolean;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

/**
 * Theme category for organization
 */
export type ThemeCategory = 'light' | 'dark' | 'colorful' | 'minimal' | 'custom';

/**
 * Preview configuration for theme cards
 */
export interface ThemePreview {
  gradient: string;
  thumbnail?: string;
  primarySample: string;
  secondarySample: string;
  backgroundSample: string;
}

/**
 * User theme preferences and settings
 */
export interface ThemePreferences {
  activeThemeId: string;
  autoDarkMode: boolean;
  darkModeSchedule?: {
    start: string; // "20:00"
    end: string;   // "06:00"
  };
  transitionSpeed: 'instant' | 'fast' | 'smooth';
  customThemes: string[]; // Theme IDs
  favoriteThemes: string[];
  lastUpdated: string;
}

/**
 * Theme context state
 */
export interface ThemeContextState {
  currentTheme: Theme;
  themes: Theme[];
  preferences: ThemePreferences;
  isLoading: boolean;
  setTheme: (themeId: string) => Promise<void>;
  createCustomTheme: (name: string, colors: ThemeColors) => Promise<Theme>;
  updateCustomTheme: (themeId: string, colors: Partial<ThemeColors>) => Promise<void>;
  deleteCustomTheme: (themeId: string) => Promise<void>;
  toggleFavorite: (themeId: string) => void;
  updatePreferences: (prefs: Partial<ThemePreferences>) => Promise<void>;
}

/**
 * CSS variable mapping
 */
export type CSSVariableMap = Record<string, string>;

/**
 * Theme validation result
 */
export interface ThemeValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  contrastIssues?: ContrastIssue[];
}

/**
 * Color contrast validation
 */
export interface ContrastIssue {
  pair: [string, string];
  ratio: number;
  minimumRequired: number;
  severity: 'error' | 'warning';
  suggestion?: string;
}

/**
 * Theme export/import format
 */
export interface ThemeExport {
  version: string;
  theme: Omit<Theme, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  metadata: {
    exportedAt: string;
    exportedBy?: string;
    appVersion: string;
  };
}
