import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        body: ["var(--font-roboto)", "Roboto", "Helvetica", "Arial", "sans-serif"],
        accent: ["Merriweather", "Georgia", "serif"],
      },
      fontSize: {
        // Academic Typography Scale
        'h1': ['32px', { lineHeight: '1.2', fontWeight: '700' }],  // Page titles
        'h2': ['24px', { lineHeight: '1.3', fontWeight: '600' }],  // Section titles
        'h3': ['20px', { lineHeight: '1.4', fontWeight: '500' }],  // Subheaders
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],  // Body text
        'caption': ['14px', { lineHeight: '1.5', fontWeight: '500' }],  // Labels, table headers
        'button': ['15px', { lineHeight: '1.4', fontWeight: '600' }],  // Buttons
      },
      colors: {
        // Full Greenwich/FPT Academic Color System
        brand: {
          // Primary Brand - Deep Navy
          navy: {
            DEFAULT: "#00205B",  // Main header, sidebar, buttons
            hover: "#10357B",     // Hover/active states
          },
          // Secondary Accent - Bright Blue
          blue: {
            DEFAULT: "#007AC3",   // Links, highlight icons, section headers
            50: "#E6F4FB",
            100: "#CCE9F7",
            200: "#99D3EF",
            300: "#66BDE7",
            400: "#33A7DF",
            500: "#007AC3",
            600: "#00629C",
            700: "#004975",
            800: "#00314E",
            900: "#001827",
          },
          // Highlight / CTA - Orange
          orange: {
            DEFAULT: "#F36C21",   // Submit, Pay, Apply, Start buttons
            50: "#FEF3ED",
            100: "#FDE7DB",
            500: "#F36C21",
            600: "#D85A15",
            700: "#B34A12",
          },
          // Success - Green
          green: {
            DEFAULT: "#6CC24A",   // Status badges, completion indicators
            50: "#F0F9EC",
            100: "#E1F3D9",
            500: "#6CC24A",
            600: "#56A038",
            700: "#417D2A",
          },
          // Warning - Amber
          amber: {
            DEFAULT: "#FFC300",   // Warnings, low balance alerts
            50: "#FFF9E6",
            100: "#FFF3CC",
            500: "#FFC300",
            600: "#D9A500",
            700: "#B38800",
          },
          // Error - Red
          red: {
            DEFAULT: "#E53935",   // Validation, form errors
            50: "#FFEBEE",
            100: "#FFCDD2",
            500: "#E53935",
            600: "#D32F2F",
            700: "#C62828",
          },
          // Text Colors
          text: {
            dark: "#212121",      // Primary text (titles, body)
            light: "#4A4A4A",     // Secondary text, descriptions
          },
          // UI Colors
          border: "#D0D3D9",      // Table/grid borders
          card: "#FFFFFF",        // Cards, modals, input fields
          background: "#F5F7FA",  // Web/app background
        },
        
        // System colors (compatible with existing components)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "#007AC3",     // Brand blue
          foreground: "#FFFFFF",
          hover: "#10357B",       // Navy hover
          50: "#E6F4FB",
          100: "#CCE9F7",
          200: "#99D3EF",
          300: "#66BDE7",
          400: "#33A7DF",
          500: "#007AC3",
          600: "#00629C",
          700: "#004975",
          800: "#00314E",
          900: "#001827",
        },
        secondary: {
          DEFAULT: "#00205B",     // Brand navy
          foreground: "#FFFFFF",
          hover: "#10357B",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "#007AC3",     // Brand blue
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#E53935",     // Brand red
          foreground: "#FFFFFF",
        },
        border: "#D0D3D9",        // Brand border gray
        input: "hsl(var(--input))",
        ring: "#007AC3",          // Brand blue
        chart: {
          "1": "#007AC3",         // Brand blue
          "2": "#6CC24A",         // Brand green
          "3": "#F36C21",         // Brand orange
          "4": "#00205B",         // Brand navy
          "5": "#FFC300",         // Brand amber
        },
        success: {
          DEFAULT: "#6CC24A",     // Brand green
          50: "#F0F9EC",
          100: "#E1F3D9",
          500: "#6CC24A",
          600: "#56A038",
          700: "#417D2A",
        },
        warning: {
          DEFAULT: "#FFC300",     // Brand amber
          50: "#FFF9E6",
          100: "#FFF3CC",
          500: "#FFC300",
          600: "#D9A500",
          700: "#B38800",
        },
        error: {
          DEFAULT: "#E53935",     // Brand red
          50: "#FFEBEE",
          100: "#FFCDD2",
          500: "#E53935",
          600: "#D32F2F",
          700: "#C62828",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "toast-slide-in": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "toast-slide-out": {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
        "command-enter": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "toast-slide-in": "toast-slide-in 0.3s ease-out",
        "toast-slide-out": "toast-slide-out 0.2s ease-in",
        "command-enter": "command-enter 0.15s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;