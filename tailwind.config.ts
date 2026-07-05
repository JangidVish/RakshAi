import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0F1729",
          soft: "#1C2A45",
          muted: "#64748B",
        },
        signal: {
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
          soft: "#EEF2FF",
        },
        tier: {
          low: "#059669",
          lowbg: "#ECFDF5",
          medium: "#D97706",
          mediumbg: "#FFFBEB",
          high: "#DC2626",
          highbg: "#FEF2F2",
          critical: "#7C2D12",
          criticalbg: "#FEF2F2",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
