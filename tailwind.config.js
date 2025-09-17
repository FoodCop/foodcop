/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./App.tsx"
  ],
  theme: {
    extend: {
      // FUZO Brand Colors
      colors: {
        // Primary brand colors
        'fuzo-coral': '#F14C35',
        'fuzo-orange-brown': '#A6471E', 
        'fuzo-navy': '#0B1F3A',
        'fuzo-yellow': '#FFD74A',
        'fuzo-white': '#FFFFFF',
        
        // Semantic colors that map to CSS custom properties
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: {
          DEFAULT: 'var(--input)',
          background: 'var(--input-background)',
        },
        ring: 'var(--ring)',
        chart: {
          '1': 'var(--chart-1)',
          '2': 'var(--chart-2)',
          '3': 'var(--chart-3)',
          '4': 'var(--chart-4)',
          '5': 'var(--chart-5)',
        },
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
      },
      
      // FUZO Typography
      fontFamily: {
        'red-hat': ['Red Hat Display', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
        'sans': ['Red Hat Display', 'Roboto', 'sans-serif'],
      },
      
      // FUZO Font Sizes
      fontSize: {
        'h1-desktop': 'var(--text-h1-desktop)',
        'h2-desktop': 'var(--text-h2-desktop)', 
        'body-desktop': 'var(--text-body-desktop)',
        'h1-mobile': 'var(--text-h1-mobile)',
        'body-mobile': 'var(--text-body-mobile)',
      },
      
      // FUZO Font Weights
      fontWeight: {
        'normal': 'var(--font-weight-normal)',
        'medium': 'var(--font-weight-medium)',
        'bold': 'var(--font-weight-bold)',
      },
      
      // Border radius
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
      },
      
      // FUZO specific spacing and design tokens
      spacing: {
        'fuzo-xs': '0.25rem',
        'fuzo-sm': '0.5rem', 
        'fuzo-md': '1rem',
        'fuzo-lg': '1.5rem',
        'fuzo-xl': '2rem',
        'fuzo-2xl': '3rem',
      },
      
      // Animation and transitions
      transitionDuration: {
        'fuzo': '200ms',
      },
      
      // Box shadows for FUZO cards and components
      boxShadow: {
        'fuzo-card': '0 2px 8px rgba(11, 31, 58, 0.1)',
        'fuzo-button': '0 2px 4px rgba(241, 76, 53, 0.2)',
        'fuzo-float': '0 8px 32px rgba(11, 31, 58, 0.15)',
      },
      
      // Screen breakpoints
      screens: {
        'xs': '375px',
        'fuzo-mobile': '480px',
        'fuzo-tablet': '768px',
        'fuzo-desktop': '1024px',
        'fuzo-wide': '1280px',
      },
    },
  },
  plugins: [],
  // Tailwind v4 compatibility
  future: {
    hoverOnlyWhenSupported: true,
  },
  // Ensure dark mode works properly
  darkMode: 'class',
}