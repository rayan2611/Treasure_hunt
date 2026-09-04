import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Space Grotesk", "sans-serif"],
        sans: ["var(--font-body)", "Inter", "sans-serif"]
      },
      colors: {
        ink: "#07090D",
        panel: "#11151B",
        gold: "#FFC43D",
        peacock: "#536DFE",
        teal: "#1FB7A6",
        warm: "#F7F5EF",
        muted: "#A8ADB7"
      },
      boxShadow: {
        glow: "0 0 32px rgba(255,196,61,.28)"
      }
    }
  },
  plugins: []
} satisfies Config;
