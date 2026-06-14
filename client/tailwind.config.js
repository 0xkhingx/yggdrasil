/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          bg: "#0D1117",
          green: "#2D6A4F",
          light: "#52B788",
          amber: "#D4A017",
          ivory: "#F0EDE4",
        },
      },
      fontFamily: {
        serif: ["Courier New", "Courier", "monospace"],
        sans: ["Raleway", "sans-serif"],
      },
      keyframes: {
        glow: {
          "0%, 100%": { filter: "drop-shadow(0 0 4px #52B788)" },
          "50%": { filter: "drop-shadow(0 0 12px #52B788)" },
        },
        droop: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        grow: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "60%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        glow: "glow 3s ease-in-out infinite",
        droop: "droop 4s ease-in-out infinite",
        grow: "grow 0.6s ease-out forwards",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        fadeIn: "fadeIn 1s ease-out forwards",
      },
    },
  },
  plugins: [],
};
