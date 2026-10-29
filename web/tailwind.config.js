/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gov: {
          navy: {
            DEFAULT: '#1F3A68',
            dark: '#142544',
            light: '#2D5292',
            50: '#F0F4F9',
            100: '#E1E9F3',
            200: '#C2D3E7',
            800: '#192E52',
            900: '#0F1D34',
          },
          saffron: {
            DEFAULT: '#FF9933',
            light: '#FFB366',
            dark: '#E67300',
            50: '#FFF7ED',
          },
          green: {
            DEFAULT: '#138808',
            light: '#1EB30B',
            dark: '#0E6306',
            50: '#F0FDF4',
          },
          ash: '#F4F6F9',
        },
      },
      fontFamily: {
        sans: ['Noto Sans', 'Inter', 'Segoe UI', 'Roboto', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
