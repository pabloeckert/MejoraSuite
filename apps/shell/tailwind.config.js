/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mc-azul': '#1A3D84',
        'mc-azul-hover': '#142F68',
        'mc-azul-dark': '#0E1F42',
        'mc-azul-surface': '#152C5B',
        'mc-amarillo': '#F7CC13',
        'mc-amarillo-hover': '#E0B80B',
        'mc-rojo': '#E1061E',
        'mc-negro': '#2B2B2B',
        'mc-slate': '#0A1224',
      },
      fontFamily: {
        modelica: ['"Bw Modelica"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        spartan: ['"League Spartan"', 'sans-serif'],
      },
      boxShadow: {
        'card-glow': '0 0 25px -5px rgba(26, 61, 132, 0.3)',
        'gold-glow': '0 0 20px -3px rgba(247, 204, 19, 0.35)',
      }
    },
  },
  plugins: [],
}
