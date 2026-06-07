/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f8f9ff",
        surface: "#f8f9ff",
        "surface-dim": "#cbdbf5",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        primary: "#00685f",
        "on-primary": "#ffffff",
        "primary-container": "#008378",
        secondary: "#0051d5",
        "outline-variant": "#bcc9c6",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#3d4947",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Inter", "sans-serif"],
      },
      fontSize: {
        "headline-sm": ["1.125rem", { lineHeight: "1.4", fontWeight: "600" }],
      },
      boxShadow: {
        ambient: "0 15px 30px -5px rgba(0, 106, 97, 0.08)",
      },
      borderRadius: {
        lg: "0.5rem",
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
