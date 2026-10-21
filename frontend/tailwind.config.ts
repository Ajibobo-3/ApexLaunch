import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050507",
        "card-surface": "#0a0a0e",
        "card-elevated": "#111116",
        foreground: "#f4f4f6",
        muted: "#8e8e9f",
        "border-hairline": "rgba(255, 255, 255, 0.08)",
        "border-glow": "rgba(16, 185, 129, 0.35)",
        "emerald-pump": "#10b981",
        "crimson-dump": "#ef4444",
        "electric-gold": "#f59e0b",
        "cyber-violet": "#8b5cf6",
      },
    },
  },
  plugins: [],
};

export default config;
