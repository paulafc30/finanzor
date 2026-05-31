/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta dark inspirada en banca digital — refinable
        bg: {
          base: 'rgb(var(--bg-base) / <alpha-value>)',
          elevated: 'rgb(var(--bg-elevated) / <alpha-value>)',
          card: 'rgb(var(--bg-card) / <alpha-value>)',
        },
        accent: {
          DEFAULT: '#7c5cff',
          muted: '#5b46c2',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6', // azul para "Saldo actual"
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
