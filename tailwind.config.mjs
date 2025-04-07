import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        subTitle: "#9C9E9F",
        subText: "#9EA1A1",
        bg: "#9EA1A1",
        bgl: "#06080A",
        bgll: "#303030",
        nothingRed: "#D71921",
      },
      fontFamily: {
        sans: ["Roboto", ...defaultTheme.fontFamily.sans],
        serif: ["Roboto", ...defaultTheme.fontFamily.serif],
        ntype82: ["NType82", "sans-serif"],
        Roboto: ["Roboto", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
