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
        background: {
          DEFAULT: "#050507",
          light: "#0a0a0f",
          lighter: "#0f0f14",
        },
        surface: {
          DEFAULT: "#0a0a0e",
          elevated: "#111116",
          hover: "#16161c",
        },
        foreground: {
          DEFAULT: "#f4f4f6",
          muted: "#9ca3af",
          subtle: "#6b7280",
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          light: "rgba(255, 255, 255, 0.12)",
          glow: "rgba(16, 185, 129, 0.35)",
        },
        accent: {
          emerald: {
            DEFAULT: "#10b981",
            light: "#34d399",
            dark: "#059669",
          },
          violet: {
            DEFAULT: "#8b5cf6",
            light: "#a78bfa",
            dark: "#7c3aed",
          },
          gold: {
            DEFAULT: "#f59e0b",
            light: "#fbbf24",
            dark: "#d97706",
          },
          rose: {
            DEFAULT: "#f43f5e",
            light: "#fb7185",
            dark: "#e11d48",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        "premium": "0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        "premium-lg": "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        "glow-emerald": "0 0 30px -8px rgba(16, 185, 129, 0.5), 0 0 60px -16px rgba(16, 185, 129, 0.3)",
        "glow-violet": "0 0 30px -8px rgba(139, 92, 246, 0.5), 0 0 60px -16px rgba(139, 92, 246, 0.3)",
        "glow-gold": "0 0 30px -8px rgba(245, 158, 11, 0.5), 0 0 60px -16px rgba(245, 158, 11, 0.3)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "premium-dark": "linear-gradient(135deg, #0a0a0f 0%, #050507 50%, #080810 100%)",
      },
      animation: {
        "shimmer": "shimmer 3s infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.7", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
