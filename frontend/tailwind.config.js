/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        lastfm: {
          red: '#d51007',
          dark: '#1a1a2e',
          card: '#16213e',
          border: '#0f3460',
          muted: '#8b8fa8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
