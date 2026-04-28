/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FBF9F3',
          100: '#F5F1E8',
          200: '#EBE5D4',
          300: '#DDD4BD',
          400: '#C9BC9C',
        },
        ink: {
          50: '#E8E3D5',
          100: '#C5BFAF',
          200: '#9A9384',
          300: '#6E6858',
          700: '#3A342A',
          800: '#1C1A15',
          900: '#0F0E0C',
          950: '#08070A',
        },
        lumen: {
          300: '#E8C17A',
          400: '#D4A75D',
          500: '#B8860B',
          600: '#8B6F47',
          700: '#6B5437',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'Cambria', 'serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 4px 24px -8px rgba(20, 18, 14, 0.12)',
        'soft-lg': '0 12px 48px -16px rgba(20, 18, 14, 0.18)',
        glow: '0 0 32px -8px rgba(212, 167, 93, 0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
