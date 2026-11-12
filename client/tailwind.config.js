/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0a0d14',
          card: '#121722',
          border: '#1f293d',
          accent: '#eab308'
        }
      }
    },
  },
  plugins: [],
}
