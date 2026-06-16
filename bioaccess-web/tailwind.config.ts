import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          500: "#1a73e8",
          600: "#1557b0",
          900: "#1e293b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
