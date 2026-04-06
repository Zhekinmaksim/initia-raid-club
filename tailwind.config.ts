import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ember: "#f08a24",
        abyss: "#050816",
        tide: "#5dc9ff",
        moss: "#77cf5d",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(93, 201, 255, 0.24), 0 18px 40px rgba(5, 8, 22, 0.45)",
      },
      fontFamily: {
        display: ['"Times New Roman"', "Iowan Old Style", "Georgia", "serif"],
        body: ['"IBM Plex Sans"', "Avenir Next", "Segoe UI", "sans-serif"],
      },
      backgroundImage: {
        halo:
          "radial-gradient(circle at top, rgba(240,138,36,0.18), transparent 36%), radial-gradient(circle at 20% 20%, rgba(93,201,255,0.14), transparent 26%), linear-gradient(180deg, #07111f 0%, #050816 100%)",
      },
    },
  },
  plugins: [],
}

export default config
