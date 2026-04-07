/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#0f1117",
        "bg-surface": "#1a1d27",
        "accent-cyan": "#22d3ee",
        "accent-red": "#ef4444",
        "accent-green": "#22c55e",
        "accent-yellow": "#f59e0b",
        "text-primary": "#f1f5f9",
        "text-muted": "#64748b",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
