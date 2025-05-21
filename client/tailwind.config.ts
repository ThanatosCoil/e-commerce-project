import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
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
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "spin-slow": "spin 5s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "sun-rise": "sunRise 0.8s ease forwards",
        "sun-set": "sunSet 0.8s ease forwards",
        "moon-rise": "moonRise 0.8s ease forwards",
        "moon-set": "moonSet 0.8s ease forwards",
        "fade-in-up": "fadeInUp 0.3s ease-out forwards",
      },
      keyframes: {
        sunRise: {
          "0%": { transform: "scale(0.5) translateY(20px)", opacity: "0" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        sunSet: {
          "0%": { transform: "scale(1) translateY(0)", opacity: "1" },
          "100%": { transform: "scale(0.5) translateY(-20px)", opacity: "0" },
        },
        moonRise: {
          "0%": { transform: "scale(0.5) translateY(20px)", opacity: "0" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        moonSet: {
          "0%": { transform: "scale(1) translateY(0)", opacity: "1" },
          "100%": { transform: "scale(0.5) translateY(-20px)", opacity: "0" },
        },
        fadeInUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/line-clamp")],
} satisfies Config;
