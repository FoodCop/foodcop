/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'arial': ['Arial', 'sans-serif'],
      },
      colors: {
        'orange-gradient-start': '#ff6900',
        'orange-gradient-end': '#f6339a',
        'purple-gradient-start': '#ad46ff',
        'purple-gradient-end': '#f6339a',
      }
    },
  },
  plugins: [],
}