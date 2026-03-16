import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14181f",
        panel: "#f4f0e8",
        mist: "#d6d0c4",
        accent: "#ef5b2a",
        flare: "#f59e0b",
        success: "#3f9b64",
        danger: "#c0392b",
        steel: "#2b3440",
        chrome: "#c8c0b4",
        concrete: "#ece6db"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(20, 24, 31, 0.14)"
      },
      backgroundImage: {
        "app-glow":
          "radial-gradient(circle at top left, rgba(239, 91, 42, 0.16), transparent 34%), radial-gradient(circle at top right, rgba(245, 158, 11, 0.14), transparent 24%), linear-gradient(180deg, #262d36 0%, #1a1f27 18%, #e7e1d6 18%, #ece6db 100%)"
      }
    }
  },
  plugins: []
} satisfies Config;
