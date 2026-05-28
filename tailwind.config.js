/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      container: {
        center: true,
        padding: '2rem',
      },
    },
  },
  plugins: [],
  safelist: [
    // Dynamic progress-bar & onboarding widths
    { pattern: /^w-\[(\d|[1-9]\d|100)%\]$/ },
  ],
};