/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        serif: ["Playfair Display", "ui-serif", "Georgia"],
      },

      colors: {
        navy: "#0B1A2A",     // Premium deep navy (Hilton/Michaelhouse)
        gold: "#C9A227",     // Gold accent
        cream: "#F8F7F3",    // Soft academic cream background
      },
    },
  },

  plugins: [],
};
