/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Microsoft YaHei UI", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 22px rgba(96, 214, 255, 0.28)",
        panel: "0 18px 50px rgba(20, 80, 130, 0.20)"
      }
    }
  },
  plugins: []
};
