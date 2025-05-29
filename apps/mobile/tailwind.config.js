/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fffe',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#4ECDC4', // Main primary color for dark mode
          500: '#14b8a6', // Main primary color for light mode
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        // Light mode colors
        light: {
          background: '#FFFFFF',
          surface: '#F2F2F7',
          'surface-secondary': '#FFFFFF',
          border: '#D1D1D6',
          text: '#000000',
          'text-secondary': '#6D6D80',
          'text-placeholder': '#8E8E93',
        },
        // Dark mode colors (keeping existing structure)
        dark: {
          50: '#8E8E93',
          100: '#6d6d7a',
          200: '#48484a',
          300: '#3a3a3c',
          400: '#2c2c2e',
          500: '#1c1c1e',
          600: '#000000',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#FF6B6B', // Main danger color
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      },
    },
  },
  plugins: [],
};
