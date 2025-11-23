export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro', 'SF Pro Text', 'SF Pro Display', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        heading: ['Georgia', 'serif'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        // Card heading colors for unified design
        'card-heading': '#1A1A1A',
        'card-heading-accent': '#3D2817', // Dark chocolate brown
        'card-heading-overlay': '#FFFFFF',
        // Typography hierarchy colors
        'page-heading': '#8B0000', // Deep red for H1
        'section-heading': '#1A1A1A', // Dark grey for H2 section headings
      },
      fontSize: {
        // Card heading font sizes
        'card-heading-sm': ['1rem', { lineHeight: '1.5', fontWeight: '700' }],
        'card-heading-md': ['1.125rem', { lineHeight: '1.5', fontWeight: '700' }],
        'card-heading-lg': ['1.25rem', { lineHeight: '1.5', fontWeight: '700' }],
      },
    },
  },
  plugins: [],
};