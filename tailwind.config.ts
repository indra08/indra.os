import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: "#00f0ff",
          magenta: "#ff00ff",
          yellow: "#ffe600",
          green: "#00ff41",
          purple: "#b400ff",
          blue: "#0044ff",
        },
        void: {
          DEFAULT: "#0a0a0f",
          deep: "#050510",
          surface: "#12121a",
          border: "#1e1e2e",
        },
        matrix: "#00ff41",
        quant: "#00f0ff",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        scanline: "scanline 8s linear infinite",
        flicker: "flicker 0.15s infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 5px #00f0ff, 0 0 10px #00f0ff33" },
          "50%": { boxShadow: "0 0 20px #00f0ff, 0 0 40px #00f0ff66" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
