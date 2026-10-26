import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#f3efe6",
        paper: "#faf7f2",
        ink: "#1c1612",
        brown: "#2a231c",
        copper: "#b86a32",
        sand: "#e7dccb",
        mute: "#6f645b",
        line: "#e3d8c8",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 20px 50px rgba(28, 22, 18, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
