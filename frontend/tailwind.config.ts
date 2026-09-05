import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        finops: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },
      // Tailwind v4 class-name compatibility (shadow-xs, shadow-2xs, border-3, backdrop-blur-xs)
      boxShadow: {
        '2xs': '0 0 0 1px rgb(0 0 0 / 0.05)',
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      borderWidth: {
        3: '3px',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;