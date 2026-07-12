/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0B0A',
        paper: '#F7F5F1',
        stone: '#A9A29A',
        charcoal: '#1F1E1C',
        brass: '#B08D57',
        brand: {
          DEFAULT: '#0B0B0A',
          dark: '#000000',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
    },
  },
  plugins: [],
};
