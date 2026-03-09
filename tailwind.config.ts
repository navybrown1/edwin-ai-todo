import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:          "rgb(var(--bg-rgb) / <alpha-value>)",
        surface:     "rgb(var(--surface-rgb) / <alpha-value>)",
        surface2:    "rgb(var(--surface2-rgb) / <alpha-value>)",
        border:      "rgb(var(--border-rgb) / <alpha-value>)",
        accent:      "rgb(var(--accent-rgb) / <alpha-value>)",
        accent2:     "rgb(var(--accent2-rgb) / <alpha-value>)",
        textPrimary: "rgb(var(--text-rgb) / <alpha-value>)",
        muted:       "rgb(var(--muted-rgb) / <alpha-value>)",
        doneBg:      "rgb(var(--done-bg-rgb) / <alpha-value>)",
        doneText:    "rgb(var(--done-text-rgb) / <alpha-value>)",
        catFinancial: "#f59e0b",
        catLegal:     "#8b5cf6",
        catFamily:    "#ec4899",
        catSchool:    "#3b82f6",
        catCareer:    "#10b981",
        catHealth:    "#ef4444",
        catErrands:   "#f97316",
        catTech:      "#06b6d4",
      },
      fontFamily: {
        syne: ["Syne", "sans-serif"],
        dm:   ["DM Sans", "sans-serif"],
      },
      keyframes: {
        fadeDown: {
          from: { opacity: "0", transform: "translateY(-14px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        slideRight: {
          from: { opacity: "0", transform: "translateX(14px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.5" },
        },
      },
      animation: {
        fadeDown:   "fadeDown 0.55s cubic-bezier(0.22,1,0.36,1) both",
        fadeUp:     "fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both",
        slideIn:    "slideIn 0.3s ease both",
        slideRight: "slideRight 0.35s cubic-bezier(0.22,1,0.36,1) both",
        pulse:      "pulse 1.5s ease-in-out infinite",
      },
      boxShadow: {
        glow:    "0 0 20px rgba(var(--accent-rgb),0.32), 0 0 40px rgba(var(--accent-rgb),0.12)",
        glowSm:  "0 0 12px rgba(var(--accent-rgb),0.24)",
        glowGrn: "0 0 16px rgba(52,211,153,0.25)",
        card:    "0 4px 28px rgba(var(--shadow-rgb),0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
