import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", ".dark"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Design System Colors
      colors: {
        // Primary Color - Primary actions and key UI elements
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9", // Main primary color
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c3d66",
          950: "#082f49",
        },
        // Secondary Color - Secondary actions and supporting elements
        secondary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6", // Main secondary color
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        // Accent Color - Highlights and important elements
        accent: {
          50: "#fef3c7",
          100: "#fde68a",
          200: "#fcd34d",
          300: "#fbbf24",
          400: "#f59e0b",
          500: "#f97316", // Main accent color
          600: "#ea580c",
          700: "#c2410c",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        // Neutral Colors - Text, borders, backgrounds
        neutral: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          950: "#030712",
        },
        // Success Color - Positive feedback and successful states
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e", // Main success color
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#145231",
          950: "#051e16",
        },
        // Warning Color - Alerts and warnings
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b", // Main warning color
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        // Error/Destructive Color - Errors and dangerous actions
        error: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444", // Main error color
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#4c0519",
        },
        // Info Color - Informational messages
        info: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9", // Main info color
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c3d66",
          950: "#082f49",
        },
      },
      // Typography Scale
      fontSize: {
        // Heading Sizes
        "display-lg": ["3.5rem", { lineHeight: "1.1", fontWeight: "700" }],
        "display-md": ["3rem", { lineHeight: "1.15", fontWeight: "700" }],
        "display-sm": ["2.5rem", { lineHeight: "1.2", fontWeight: "700" }],
        "heading-lg": ["2rem", { lineHeight: "1.3", fontWeight: "700" }],
        "heading-md": ["1.5rem", { lineHeight: "1.4", fontWeight: "600" }],
        "heading-sm": ["1.25rem", { lineHeight: "1.5", fontWeight: "600" }],
        "heading-xs": ["1.125rem", { lineHeight: "1.6", fontWeight: "600" }],
        // Body Text Sizes
        "body-lg": ["1.125rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
        "body-xs": ["0.8125rem", { lineHeight: "1.5", fontWeight: "400" }],
        // Label/Caption Sizes
        "label-lg": ["1rem", { lineHeight: "1.5", fontWeight: "600" }],
        "label-md": ["0.875rem", { lineHeight: "1.5", fontWeight: "600" }],
        "label-sm": ["0.8125rem", { lineHeight: "1.5", fontWeight: "600" }],
        "caption-md": ["0.875rem", { lineHeight: "1.4", fontWeight: "400" }],
        "caption-sm": ["0.8125rem", { lineHeight: "1.4", fontWeight: "400" }],
      },
      // Standardized Spacing
      spacing: {
        xs: "0.5rem", // 8px
        sm: "1rem", // 16px
        md: "1.5rem", // 24px
        lg: "2rem", // 32px
        xl: "2.5rem", // 40px
        "2xl": "3rem", // 48px
        "3xl": "4rem", // 64px
      },
      // Standardized Border Radius
      borderRadius: {
        none: "0px",
        xs: "0.25rem", // 4px
        sm: "0.5rem", // 8px
        md: "0.75rem", // 12px
        lg: "1rem", // 16px
        xl: "1.5rem", // 24px
        "2xl": "2rem", // 32px
        full: "9999px",
      },
      // Additional Design System Tokens
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        // Subtle shadows for depth
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
