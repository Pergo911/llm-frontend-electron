/** @type {import('tailwindcss').Config} */
const animate = require('tailwindcss-animate');
const typography = require('@tailwindcss/typography');
const containerQueries = require('@tailwindcss/container-queries');

module.exports = {
  content: ['./src/renderer/**/*.{js,jsx,ts,tsx,ejs}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        background: {
          DEFAULT: 'var(--background)',
          dim: 'var(--background-dim)',
        },
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          hover: 'var(--primary-hover)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
          hover: 'var(--secondary-hover)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
          hover: 'var(--destructive-hover)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
          hover: 'var(--muted-hover)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
          hover: 'var(--card-hover)',
        },
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: `calc(var(--radius) - 4px)`,
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [animate, typography, containerQueries],
};
