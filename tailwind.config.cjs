/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './index.tsx',
    './src/**/*.{ts,tsx}',
  ],
  safelist: [
    { pattern: /(bg|text|border)-(stone|yellow|red|blue|emerald|indigo)-(50|100|200|300|400|500|600|700|800|900)/ },
    { pattern: /from-(stone|black)\/(50|60|70|80|90)/ },
    { pattern: /to-(stone|black)\/(50|60|70|80|90)/ },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
