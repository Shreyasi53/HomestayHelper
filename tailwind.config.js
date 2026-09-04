/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          900: '#0f281e',
          800: '#1b4332',
          700: '#2d6a4f',
          100: '#d8f3dc',
          50: '#f4f7f5',
        },
        amberGold: {
          DEFAULT: '#d97706',
          hover: '#b45309',
          light: '#fef3c7',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Noto Sans Devanagari', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        'pill': '9999px',
      }
    },
  },
  plugins: [],
}
