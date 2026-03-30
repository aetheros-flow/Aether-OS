/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aether: {
          bg: '#FEFAF5', // Warm linen cream background
          surface: '#FFFFFF', // Clean white for cards
          text: '#4B433E', // Warm mocha dark text
          accent: '#FFA07A', // Soft Coral/Peach primary accent
          'glass-light': 'rgba(255, 255, 255, 0.7)', // Clear glass effect
        }
      }
    },
  },
  plugins: [],
}