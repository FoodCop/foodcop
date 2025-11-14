import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  
  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setResolvedTheme: (theme: 'light' | 'dark') => void;
}

/**
 * Global Theme Store
 * Manages application theme (light/dark mode)
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',

      setTheme: (theme) => {
        set({ theme });
        
        // Determine resolved theme
        if (theme === 'system') {
          const systemTheme = globalThis.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
          set({ resolvedTheme: systemTheme });
        } else {
          set({ resolvedTheme: theme });
        }
      },

      toggleTheme: () => {
        const current = get().resolvedTheme;
        const newTheme = current === 'light' ? 'dark' : 'light';
        set({ theme: newTheme, resolvedTheme: newTheme });
      },

      setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
    }),
    {
      name: 'fuzo-theme-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Listen for system theme changes
if (globalThis.window !== undefined) {
  globalThis.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const store = useThemeStore.getState();
    if (store.theme === 'system') {
      store.setResolvedTheme(e.matches ? 'dark' : 'light');
    }
  });
}
