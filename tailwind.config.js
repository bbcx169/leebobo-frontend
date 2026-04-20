/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amberRed: '#A52A2A',
        warmWood: '#D2B48C',
        creamBg: '#FAF7F2',
        pureWhite: '#FFFFFF',
        darkWood: '#3E2723'
      },
      fontFamily: {
        serif: ['"Noto Serif TC"', 'serif'],
        sans: ['"Noto Sans TC"', 'sans-serif']
      },
      keyframes: {
        sway: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-6deg)' },
          '50%': { transform: 'rotate(0deg)' },
          '75%': { transform: 'rotate(6deg)' }
        }
      },
      animation: {
        sway: 'sway 4s ease-in-out infinite'
      }
    },
  },
  plugins: [],
}