/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── TUS COLORES PREMIUM (Botanical Ledger) ───
        forest: {
          DEFAULT: '#0B2118', 
          light: '#163E2E',   
        },
        mint: {
          DEFAULT: '#A7F38F', 
          hover: '#8EE874',
        },
        sage: {
          DEFAULT: '#F4F9F2', 
          dark: '#E2EDE0',    
        },
        charcoal: '#2D3A35',  

        // ─── LEBRARY CINEMA COLOURS ───
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

        // ─── VARIABLES DE SHADCN UI ───
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        // ─── AURA ETHEREAL CAROUSEL ───
        "secondary-fixed": "#ffe088",
        "inverse-surface": "#e7e0ed",
        "on-surface-variant": "#cbc3d7",
        "on-error": "#690005",
        "on-tertiary-container": "#00302a",
        "on-primary-fixed": "#23005c",
        "on-primary": "#3c0091",
        "outline": "#958ea0",
        "surface-container-low": "#1d1a23",
        "tertiary-fixed-dim": "#3cddc7",
        "surface-variant": "#37333d",
        "surface-bright": "#3b3742",
        "inverse-primary": "#6d3bd7",
        "tertiary": "#3cddc7",
        "on-error-container": "#ffdad6",
        "error-container": "#93000a",
        "surface-container-lowest": "#0f0d15",
        "on-primary-container": "#340080",
        "primary-fixed-dim": "#d0bcff",
        "on-secondary-fixed-variant": "#574500",
        "surface-container-highest": "#37333d",
        "inverse-on-surface": "#322f39",
        "surface-tint": "#d0bcff",
        "primary-fixed": "#e9ddff",
        "on-secondary": "#3c2f00",
        "surface-container": "#211e27",
        "surface": "#15121b",
        "on-tertiary-fixed": "#00201c",
        "primary-container": "#a078ff",
        "on-background": "#e7e0ed",
        "secondary-fixed-dim": "#e9c349",
        "on-secondary-container": "#342800",
        "on-surface": "#e7e0ed",
        "outline-variant": "#494454",
        "surface-dim": "#15121b",
        "surface-container-high": "#2c2832",
        "on-tertiary": "#003731",
        "tertiary-container": "#00a392",
        "on-primary-fixed-variant": "#5516be",
        "tertiary-fixed": "#62fae3",
        "on-secondary-fixed": "#241a00",
        "secondary-container": "#af8d11",
        "on-tertiary-fixed-variant": "#005047",
        // Note: primary, secondary, background, error are kept via Shadcn variables or overridden here if needed.
        // We will add specific Aura overrides for the base ones used heavily in the template to ensure it works.
        "aura-primary": "#d0bcff",
        "aura-secondary": "#e9c349",
        "aura-background": "#15121b",
        "aura-error": "#ffb4ab",
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        "body-lg": ["Inter", "sans-serif"],
        "label-caps": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "h3": ["Noto Serif", "serif"],
        "h1": ["Noto Serif", "serif"],
        "h2": ["Noto Serif", "serif"]
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        '4xl': '2rem',   // 32px
        '5xl': '2.5rem', // 40px
      },
      spacing: {
        "stack-sm": "12px",
        "container-padding": "24px",
        "stack-lg": "48px",
        "stack-md": "24px",
        "gutter": "16px",
        "unit": "8px"
      },
      fontSize: {
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "1.0", letterSpacing: "0.1em", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "h3": ["24px", { lineHeight: "1.3", fontWeight: "500" }],
        "h1": ["40px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "h2": ["32px", { lineHeight: "1.2", fontWeight: "600" }]
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}