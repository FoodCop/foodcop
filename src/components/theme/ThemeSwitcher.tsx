/**
 * Theme Switcher Component
 * Allows users to preview and switch between preset themes
 */

import { useTheme } from '../../hooks/useTheme';
import { Palette, Check } from 'lucide-react';

export function ThemeSwitcher() {
  const { currentTheme, themes, setTheme, isLoading } = useTheme();

  // Get only preset themes (exclude custom themes for this simple switcher)
  const presetThemes = themes.filter(theme => !theme.isCustom);

  const handleThemeChange = async (themeId: string) => {
    console.log('Theme change requested:', themeId);
    try {
      await setTheme(themeId);
      console.log('✅ Theme changed successfully to:', themeId);
    } catch (error) {
      console.error('❌ Theme change failed:', error);
    }
  };

  console.log('Current theme:', currentTheme.id, 'Available themes:', presetThemes.length);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Theme</h3>
      </div>

      <p className="text-sm text-foreground-secondary mb-4">
        Choose a color theme for your FUZO experience
      </p>

      {/* Theme Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {presetThemes.map((theme) => {
          const isActive = currentTheme.id === theme.id;
          
          return (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              disabled={isLoading}
              className={`
                relative p-3 rounded-lg border-2 transition-all
                ${isActive 
                  ? 'border-primary shadow-md' 
                  : 'border-border hover:border-border-dark'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              aria-label={`Switch to ${theme.name} theme`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-2 right-2 bg-primary text-foreground-inverse rounded-full p-1">
                  <Check className="w-3 h-3" />
                </div>
              )}

              {/* Theme Preview */}
              <div 
                className="w-full h-16 rounded-md mb-2"
                style={{ background: theme.preview.gradient }}
              />

              {/* Theme Name */}
              <div className="text-sm font-medium text-foreground text-left">
                {theme.name}
              </div>

              {/* Theme Category Badge */}
              <div className="text-xs text-foreground-muted text-left capitalize mt-1">
                {theme.category}
              </div>

              {/* Color Samples */}
              <div className="flex gap-1 mt-2">
                <div 
                  className="w-6 h-6 rounded border border-border"
                  style={{ backgroundColor: theme.colors.primary }}
                  title="Primary color"
                />
                <div 
                  className="w-6 h-6 rounded border border-border"
                  style={{ backgroundColor: theme.colors.secondary }}
                  title="Secondary color"
                />
                <div 
                  className="w-6 h-6 rounded border border-border"
                  style={{ backgroundColor: theme.colors.background }}
                  title="Background color"
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Current Theme Info */}
      <div className="mt-6 p-4 bg-surface rounded-lg">
        <div className="text-sm font-medium text-foreground mb-1">
          Current Theme: {currentTheme.name}
        </div>
        <div className="text-xs text-foreground-secondary">
          {currentTheme.description}
        </div>
      </div>
    </div>
  );
}

