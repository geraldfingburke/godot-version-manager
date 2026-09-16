/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        godot: {
          blue: '#478cbf',
          dark: '#1e2229',
          card: '#262b34',
          sidebar: '#181b20',
          border: '#333b47',
          hover: '#3a7aab',
          mono: '#9b59b6',
        }
      }
    },
  },
  plugins: [],
}
