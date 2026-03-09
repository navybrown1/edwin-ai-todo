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
        bg:          "#080810",
        surface:     "#10111a",
        surface2:    "#17192a",
        border:      "#1e2032",
        accent:      "#f0c040",
        accent2:     "#e87040",
        textPrimary: "#f0efe8",
        muted:       "#5a5a72",
        doneBg:      "#0d0f0d",
        doneText:    "#3a4a3a",
        // Category accent colors
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
        glow:    "0 0 20px rgba(240,192,64,0.3), 0 0 40px rgba(240,192,64,0.1)",
        glowSm:  "0 0 12px rgba(240,192,64,0.2)",
        glowGrn: "0 0 16px rgba(52,211,153,0.25)",
        card:    "0 4px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
