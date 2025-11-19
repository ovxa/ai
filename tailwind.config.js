/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        analyst: {
          light: '#3B82F6',
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
        },
        creator: {
          light: '#A855F7',
          DEFAULT: '#9333EA',
          dark: '#7E22CE',
        },
        evaluator: {
          light: '#10B981',
          DEFAULT: '#059669',
          dark: '#047857',
        },
      },
      animation: {
        'typing': 'typing 1.4s infinite',
      },
      keyframes: {
        typing: {
          '0%, 100%': { opacity: 0.2 },
          '50%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
