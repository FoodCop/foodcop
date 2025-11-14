/**
 * useTheme Hook
 * Custom hook for accessing theme context
 */

import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

/**
 * Hook to access theme context
 * @throws Error if used outside ThemeProvider
 * @returns Theme context state and methods
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}
