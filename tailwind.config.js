/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta dark inspirada en banca digital — refinable
        bg: {
          base: '#0b0d12',
          elevated: '#151821',
          card: '#1c2030',
        },
        accent: {
          DEFAULT: '#7c5cff',
          muted: '#5b46c2',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
