import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ECFDF5",
          500: "#16A34A",
          600: "#15803D"
        },
        appbg: "#E2E8F0",
        text: {
          primary: "#1F2937",
          secondary: "#6B7280"
        },
        border: "#D1D5DB",
        danger: "#DC2626"
      },
      boxShadow: {
        soft: "0 12px 30px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        "2xl": "1rem"
      }
    }
  },
  plugins: []
};

export default config;
