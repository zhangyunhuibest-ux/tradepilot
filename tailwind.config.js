/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07111f",
        surface: "#0b1220",
        panel: "#111a2c",
        panelSoft: "#162238",
        line: "#23304a",
        muted: "#8492ad",
        profit: "#1fd187",
        loss: "#ff5f6d",
        warning: "#f5b84b"
      },
      boxShadow: {
        trading: "0 18px 55px rgba(0, 0, 0, 0.35)"
      }
    }
  },
  plugins: []
};
