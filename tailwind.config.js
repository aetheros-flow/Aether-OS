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
          DEFAULT: '#0B2118', // Deep Forest (Fondo oscuro principal)
          light: '#163E2E',   // Tarjetas oscuras secundarias
        },
        mint: {
          DEFAULT: '#A7F38F', // Vibrant Mint (Acentos y botones)
          hover: '#8EE874',
        },
        sage: {
          DEFAULT: '#F4F9F2', // Soft Sage (Fondo claro de la app)
          dark: '#E2EDE0',    // Bordes sutiles
        },
        charcoal: '#2D3A35',  // Textos principales sobre fondos claros
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
      borderRadius: {
        '4xl': '2rem',   // 32px
        '5xl': '2.5rem', // 40px
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}