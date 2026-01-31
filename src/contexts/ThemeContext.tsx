/**
 * Theme Context
 * Provides theme state and management functions throughout the app
 */

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Theme, ThemeContextState, ThemePreferences, ThemeColors } from '../types/theme';
import { ALL_THEMES, DEFAULT_THEME } from '../config/themes-lean';
import { applyThemeToDOM, validateThemeAccessibility } from '../utils/themeUtils';

// Storage keys
const STORAGE_KEYS = {
  ACTIVE_THEME: 'fuzo_active_theme_id',
  PREFERENCES: 'fuzo_theme_preferences',
  CUSTOM_THEMES: 'fuzo_custom_themes',
} as const;

// Default preferences
const DEFAULT_PREFERENCES: ThemePreferences = {
  activeThemeId: DEFAULT_THEME.id,
  autoDarkMode: false,
  transitionSpeed: 'smooth',
  customThemes: [],
  favoriteThemes: [],
  lastUpdated: new Date().toISOString(),
};

// Create context
export const ThemeContext = createContext<ThemeContextState | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  console.log('ThemeProvider mounting');
  
  // Load preferences from localStorage
  const loadPreferences = useCallback((): ThemePreferences => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load theme preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  }, []);

  // Load custom themes from localStorage
  const loadCustomThemes = useCallback((): Theme[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_THEMES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load custom themes:', error);
    }
    return [];
  }, []);

  // Initialize state
  const [preferences, setPreferences] = useState<ThemePreferences>(loadPreferences);
  const [customThemes, setCustomThemes] = useState<Theme[]>(loadCustomThemes);
  const [isLoading, setIsLoading] = useState(false);

  // Get all available themes (preset + custom)
  const allThemes = useMemo(() => {
    return [...ALL_THEMES, ...customThemes];
  }, [customThemes]);

  // Get current active theme
  const currentTheme = useMemo(() => {
    const theme = allThemes.find(t => t.id === preferences.activeThemeId);
    console.log('Current theme computed:', theme?.name || 'DEFAULT', 'ID:', preferences.activeThemeId);
    return theme || DEFAULT_THEME;
  }, [preferences.activeThemeId, allThemes]);

  // Save preferences to localStorage
  const savePreferences = useCallback((prefs: ThemePreferences) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
    } catch (error) {
      console.error('Failed to save theme preferences:', error);
    }
  }, []);

  // Save custom themes to localStorage
  const saveCustomThemes = useCallback((themes: Theme[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_THEMES, JSON.stringify(themes));
    } catch (error) {
      console.error('Failed to save custom themes:', error);
    }
  }, []);

  // Apply theme to DOM on mount and when theme changes
  useEffect(() => {
    console.log('Applying theme to DOM:', currentTheme.name, currentTheme.id);
    applyThemeToDOM(currentTheme);
  }, [currentTheme]);

  // Set active theme
  const setTheme = useCallback(async (themeId: string) => {
    console.log('setTheme called with:', themeId);
    setIsLoading(true);
    try {
      const theme = allThemes.find(t => t.id === themeId);
      if (!theme) {
        console.error(`Theme with id "${themeId}" not found`);
        console.log('Available themes:', allThemes.map(t => t.id));
        return;
      }

      console.log('✅ Theme found:', theme.name);

      // Validate theme accessibility
      const validation = validateThemeAccessibility(theme);
      if (!validation.isValid) {
        console.warn('Theme accessibility issues:', validation.errors);
        // Still allow the theme, but warn the user
      }

      const newPreferences = {
        ...preferences,
        activeThemeId: themeId,
        lastUpdated: new Date().toISOString(),
      };

      console.log('💾 Saving preferences:', newPreferences);
      setPreferences(newPreferences);
      savePreferences(newPreferences);
      console.log('✅ Theme set successfully');
    } finally {
      setIsLoading(false);
    }
  }, [allThemes, preferences, savePreferences]);

  // Create custom theme
  const createCustomTheme = useCallback(async (name: string, colors: ThemeColors): Promise<Theme> => {
    setIsLoading(true);
    try {
      // Generate unique ID
      const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const newTheme: Theme = {
        id,
        name,
        description: `Custom theme: ${name}`,
        category: 'custom',
        colors,
        preview: {
          gradient: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          primarySample: colors.primary,
          secondarySample: colors.secondary,
          backgroundSample: colors.background,
        },
        isCustom: true,
        isPremium: false,
        createdAt: now,
        updatedAt: now,
      };

      // Validate theme
      const validation = validateThemeAccessibility(newTheme);
      if (!validation.isValid) {
        console.warn('Custom theme has accessibility issues:', validation.errors);
      }

      const updatedCustomThemes = [...customThemes, newTheme];
      setCustomThemes(updatedCustomThemes);
      saveCustomThemes(updatedCustomThemes);

      // Update preferences to track custom theme
      const newPreferences = {
        ...preferences,
        customThemes: [...preferences.customThemes, id],
        lastUpdated: now,
      };
      setPreferences(newPreferences);
      savePreferences(newPreferences);

      return newTheme;
    } finally {
      setIsLoading(false);
    }
  }, [customThemes, preferences, saveCustomThemes, savePreferences]);

  // Update custom theme
  const updateCustomTheme = useCallback(async (themeId: string, colors: Partial<ThemeColors>) => {
    setIsLoading(true);
    try {
      const themeIndex = customThemes.findIndex(t => t.id === themeId);
      if (themeIndex === -1) {
        console.error(`Custom theme with id "${themeId}" not found`);
        return;
      }

      const existingTheme = customThemes[themeIndex];
      const now = new Date().toISOString();

      const updatedCustomThemes = [...customThemes];
      updatedCustomThemes[themeIndex] = {
        ...existingTheme,
        colors: {
          ...existingTheme.colors,
          ...colors,
        },
        updatedAt: now,
      };

      setCustomThemes(updatedCustomThemes);
      saveCustomThemes(updatedCustomThemes);

      // If this is the active theme, trigger re-render
      if (preferences.activeThemeId === themeId) {
        const newPreferences = {
          ...preferences,
          lastUpdated: now,
        };
        setPreferences(newPreferences);
        savePreferences(newPreferences);
      }
    } finally {
      setIsLoading(false);
    }
  }, [customThemes, preferences, saveCustomThemes, savePreferences]);

  // Delete custom theme
  const deleteCustomTheme = useCallback(async (themeId: string) => {
    setIsLoading(true);
    try {
      const theme = customThemes.find(t => t.id === themeId);
      if (!theme) {
        console.error(`Custom theme with id "${themeId}" not found`);
        return;
      }

      const updatedCustomThemes = customThemes.filter(t => t.id !== themeId);
      setCustomThemes(updatedCustomThemes);
      saveCustomThemes(updatedCustomThemes);

      // If this was the active theme, switch to default
      if (preferences.activeThemeId === themeId) {
        await setTheme(DEFAULT_THEME.id);
      }

      // Remove from favorites and custom themes list
      const newPreferences = {
        ...preferences,
        customThemes: preferences.customThemes.filter(id => id !== themeId),
        favoriteThemes: preferences.favoriteThemes.filter(id => id !== themeId),
        lastUpdated: new Date().toISOString(),
      };
      setPreferences(newPreferences);
      savePreferences(newPreferences);
    } finally {
      setIsLoading(false);
    }
  }, [customThemes, preferences, saveCustomThemes, savePreferences, setTheme]);

  // Toggle favorite theme
  const toggleFavorite = useCallback((themeId: string) => {
    const isFavorite = preferences.favoriteThemes.includes(themeId);
    const newFavorites = isFavorite
      ? preferences.favoriteThemes.filter(id => id !== themeId)
      : [...preferences.favoriteThemes, themeId];

    const newPreferences = {
      ...preferences,
      favoriteThemes: newFavorites,
    };

    setPreferences(newPreferences);
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<ThemePreferences>) => {
    setIsLoading(true);
    try {
      const newPreferences = {
        ...preferences,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };

      setPreferences(newPreferences);
      savePreferences(newPreferences);
    } finally {
      setIsLoading(false);
    }
  }, [preferences, savePreferences]);

  // Auto dark mode based on system preference
  useEffect(() => {
    if (!preferences.autoDarkMode) return;

    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const isDark = e.matches;
      const darkTheme = allThemes.find(t => t.category === 'dark');
      const lightTheme = allThemes.find(t => t.category === 'light');
      
      if (isDark && darkTheme) {
        setTheme(darkTheme.id);
      } else if (!isDark && lightTheme) {
        setTheme(lightTheme.id);
      }
    };

    // Initial check
    handleChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [preferences.autoDarkMode, allThemes, setTheme]);

  // Context value
  const contextValue: ThemeContextState = useMemo(() => ({
    currentTheme,
    themes: allThemes,
    preferences,
    isLoading,
    setTheme,
    createCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    toggleFavorite,
    updatePreferences,
  }), [
    currentTheme,
    allThemes,
    preferences,
    isLoading,
    setTheme,
    createCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    toggleFavorite,
    updatePreferences,
  ]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

