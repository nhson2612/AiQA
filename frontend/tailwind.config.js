/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#5b13ec",
        "primary-hover": "#4a0fc0",
        "background-light": "#f6f6f8",
        "background-dark": "#161022",
      },
      fontFamily: {
        "display": ["Manrope", "sans-serif"]
      },
    },
  },
  plugins: [],
}