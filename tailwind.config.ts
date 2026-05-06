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
          50: "#E8F3EB",
          500: "#1F6A3A",
          600: "#174F2B"
        },
        appbg: "#EEF4F0",
        text: {
          primary: "#14281D",
          secondary: "#4D6356"
        },
        border: "#D5E1D8",
        danger: "#C2412D"
      },
      boxShadow: {
        soft: "0 18px 42px rgba(15, 23, 42, 0.1)"
      },
      borderRadius: {
        "2xl": "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
