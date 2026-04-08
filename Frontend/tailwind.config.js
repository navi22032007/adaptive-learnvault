/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          primary: '#ff6b00',
          secondary: '#ff8533',
        },
        deep: '#050505',
        card: '#0a0a0a',
        text: {
          secondary: 'rgba(255, 255, 255, 0.6)',
        }
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['DM Sans', 'sans-serif'],
      },
      boxShadow: {
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.6)',
      }
    },
  },
  plugins: [],
}
