/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B2B2A",
        dusk: "#123A38",
        sand: "#F3E7D3",
        papaya: "#FF6B3D",
        gold: "#E8B84B",
        seafoam: "#7FBFAE",
      },
      fontFamily: {
        display: ["'Bricolage Grotesque'", "'Archivo Black'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        card: "0 20px 60px -20px rgba(11, 43, 42, 0.45)",
      },
    },
  },
  plugins: [],
}

