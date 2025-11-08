/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './app.js'
  ],
  theme: {
    extend: {
      colors: {
        'scout-red': '#CE1126',
        'scout-blue': '#003F87',
        'scout-tan': '#E3B778',
        'scout-gold': '#FFC72C'
      }
    }
  },
  plugins: [],
}


