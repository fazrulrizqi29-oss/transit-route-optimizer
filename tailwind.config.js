/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#f0f9ff', 100: '#e0f2fe', 500: '#0284c7', 600: '#0369a1', 700: '#075985', 900: '#0c4a6e' },
        ucs: { light: '#38bdf8', DEFAULT: '#0284c7', dark: '#0369a1', glow: '#00f2fe' },
        greedy: { light: '#fb923c', DEFAULT: '#ea580c', dark: '#c2410c', glow: '#f97316' }
      }
    }
  },
  plugins: []
};
