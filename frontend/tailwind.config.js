/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        brand: {
          50: "#f5f0ff",
          100: "#ede4ff",
          200: "#d5bcff",
          300: "#c4a0ee",
          400: "#a87dd9",
          500: "#9F60CC",
          600: "#8D5FCC",
          700: "#7a4db5",
          800: "#5a3a95",
          900: "#2d1a5e",
        },
        kalinga: {
          purple: "#8D5FCC",
          blue: "#83CBDD",
          yellow: "#FFFDA6",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        "card-hover":
          "0 4px 12px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06)",
        sidebar: "4px 0 24px rgba(0,0,0,0.12)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
