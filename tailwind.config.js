/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['var(--font-display)'],
        'body': ['var(--font-body)'],
        'ui': ['var(--font-ui)'],
        'button': ['var(--font-button)'],
        'arial': ['Arial', 'sans-serif'],
      },
      colors: {
        // Brand colors from design tokens
        'fuzo-orange': {
          50: 'var(--fuzo-orange-50)',
          100: 'var(--fuzo-orange-100)',
          200: 'var(--fuzo-orange-200)',
          300: 'var(--fuzo-orange-300)',
          400: 'var(--fuzo-orange-400)',
          500: 'var(--fuzo-orange-500)',
          600: 'var(--fuzo-orange-600)',
          700: 'var(--fuzo-orange-700)',
          800: 'var(--fuzo-orange-800)',
          900: 'var(--fuzo-orange-900)',
        },
        'fuzo-pink': {
          50: 'var(--fuzo-pink-50)',
          100: 'var(--fuzo-pink-100)',
          200: 'var(--fuzo-pink-200)',
          300: 'var(--fuzo-pink-300)',
          400: 'var(--fuzo-pink-400)',
          500: 'var(--fuzo-pink-500)',
          600: 'var(--fuzo-pink-600)',
          700: 'var(--fuzo-pink-700)',
          800: 'var(--fuzo-pink-800)',
          900: 'var(--fuzo-pink-900)',
        },
        'fuzo-purple': {
          50: 'var(--fuzo-purple-50)',
          100: 'var(--fuzo-purple-100)',
          200: 'var(--fuzo-purple-200)',
          300: 'var(--fuzo-purple-300)',
          400: 'var(--fuzo-purple-400)',
          500: 'var(--fuzo-purple-500)',
          600: 'var(--fuzo-purple-600)',
          700: 'var(--fuzo-purple-700)',
          800: 'var(--fuzo-purple-800)',
          900: 'var(--fuzo-purple-900)',
        },
        // Platform colors
        'platform-google': 'var(--platform-google)',
        'platform-youtube': 'var(--platform-youtube)',
        'platform-spoonacular': 'var(--platform-spoonacular)',
        'platform-fuzo': 'var(--platform-fuzo)',
        // Semantic colors
        'success': 'var(--color-success)',
        'warning': 'var(--color-warning)',
        'error': 'var(--color-error)',
        'info': 'var(--color-info)',
        // Neutral palette
        'neutral': {
          50: 'var(--neutral-50)',
          100: 'var(--neutral-100)',
          200: 'var(--neutral-200)',
          300: 'var(--neutral-300)',
          400: 'var(--neutral-400)',
          500: 'var(--neutral-500)',
          600: 'var(--neutral-600)',
          700: 'var(--neutral-700)',
          800: 'var(--neutral-800)',
          900: 'var(--neutral-900)',
          950: 'var(--neutral-950)',
        },
        // Accent yellow/gold (ratings, highlights)
        'accent-yellow': {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#FFD500',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        // Surface colors
        'surface': {
          primary: 'var(--surface-primary)',
          secondary: 'var(--surface-secondary)',
          tertiary: 'var(--surface-tertiary)',
          elevated: 'var(--surface-elevated)',
        },
        // Text colors
        'content': {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          inverse: 'var(--text-inverse)',
          disabled: 'var(--text-disabled)',
        },
        // Legacy color mappings (for backwards compatibility)
        'orange-gradient-start': 'var(--fuzo-orange-500)',
        'orange-gradient-end': 'var(--fuzo-pink-500)',
        'purple-gradient-start': 'var(--fuzo-purple-500)',
        'purple-gradient-end': 'var(--fuzo-pink-500)',
        'fuzo': {
          primary: 'var(--fuzo-orange-500)',
          'primary-dark': 'var(--fuzo-orange-700)',
          secondary: 'var(--fuzo-pink-500)',
          accent: 'var(--fuzo-purple-500)',
        },
        // Page background colors
        'page-bg': {
          feed: 'var(--page-bg-feed)',
          scout: 'var(--page-bg-scout)',
          explore: 'var(--page-bg-explore)',
          profile: 'var(--page-bg-profile)',
          utility: 'var(--page-bg-utility)',
        },
      },
      spacing: {
        'safe-top': 'var(--safe-area-top)',
        'safe-bottom': 'var(--safe-area-bottom)',
        'safe-left': 'var(--safe-area-left)',
        'safe-right': 'var(--safe-area-right)',
      },
      borderRadius: {
        'card': 'var(--radius-card)',
        'button': 'var(--radius-button)',
        'phone': 'var(--radius-phone-mockup)',
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'button': 'var(--shadow-button)',
        'button-hover': 'var(--shadow-button-hover)',
        'phone': 'var(--shadow-phone-mockup)',
      },
      transitionDuration: {
        'instant': 'var(--duration-instant)',
        'fast': 'var(--duration-fast)',
        'normal': 'var(--duration-normal)',
        'moderate': 'var(--duration-moderate)',
        'slow': 'var(--duration-slow)',
        'slower': 'var(--duration-slower)',
      },
      transitionTimingFunction: {
        'bounce': 'var(--ease-bounce)',
        'spring': 'var(--ease-spring)',
      },
    },
  },
  plugins: [],
}