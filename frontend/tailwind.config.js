/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'oklch(var(--background) / <alpha-value>)',
        foreground: 'oklch(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'oklch(var(--card) / <alpha-value>)',
          foreground: 'oklch(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
          foreground: 'oklch(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        // Studyroom design tokens
        surface: {
          DEFAULT: 'oklch(0.16 0.018 260)',
          raised: 'oklch(0.19 0.022 260)',
          overlay: 'oklch(0.22 0.025 260)',
        },
        teal: {
          50: 'oklch(0.95 0.05 195)',
          100: 'oklch(0.90 0.08 195)',
          200: 'oklch(0.82 0.12 195)',
          300: 'oklch(0.75 0.16 195)',
          400: 'oklch(0.72 0.18 195)',
          500: 'oklch(0.65 0.20 195)',
          600: 'oklch(0.58 0.20 200)',
          700: 'oklch(0.50 0.18 205)',
          800: 'oklch(0.40 0.14 210)',
          900: 'oklch(0.28 0.10 215)',
        },
        amber: {
          50: 'oklch(0.97 0.04 75)',
          100: 'oklch(0.93 0.08 75)',
          200: 'oklch(0.88 0.12 70)',
          300: 'oklch(0.82 0.16 65)',
          400: 'oklch(0.78 0.18 60)',
          500: 'oklch(0.72 0.18 55)',
          600: 'oklch(0.65 0.18 50)',
          700: 'oklch(0.55 0.16 45)',
          800: 'oklch(0.42 0.12 45)',
          900: 'oklch(0.30 0.08 45)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      boxShadow: {
        'glow-primary': 'var(--glow-primary)',
        'glow-accent': 'var(--glow-accent)',
        'glow-subtle': 'var(--glow-subtle)',
        'card': 'var(--glow-card)',
        'inner-top': 'inset 0 1px 0 oklch(1 0 0 / 0.06)',
      },
      backgroundImage: {
        'gradient-app': 'var(--gradient-bg)',
        'gradient-card': 'var(--gradient-card)',
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-accent': 'var(--gradient-accent)',
        'gradient-header': 'var(--gradient-header)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
  ],
};
