/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'lg-small': '1030px',
        'custom-break': '1000px',
      },
    },
  },
  plugins: [],
}