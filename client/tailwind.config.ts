import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201c",
        mint: "#0f9f6e",
        coral: "#de6b48",
        cloud: "#f6f8f7"
      }
    }
  },
  plugins: []
} satisfies Config;
