/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primaryBg: '#101114',
        secondaryBg: '#191B20',
        cardBg: '#22252B',
        accent: '#FF6B2C',
        secondaryAccent: '#A8ADB5',
        textPrimary: '#F5F5F5',
        textSecondary: '#A1A6AF',
        success: '#88C997',
      },
    },
  },
  plugins: [],
};
