import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ? `${process.env.VITE_BASE_PATH.replace(/\/$/, "")}/` : "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-dom")) return "react-dom";
            if (id.includes("react-router")) return "vendor";
            if (id.includes("@mui/icons-material")) return "mui-icons";
            if (id.includes("@mui")) return "mui";
            if (id.includes("firebase")) return "firebase";
            if (id.includes("@tanstack") || id.includes("axios")) return "query";
            if (id.includes("i18next")) return "i18n";
            if (id.includes("@emotion")) return "emotion";
            if (id.includes("recharts") || id.includes("d3-")) return "charts";
            if (id.includes("country-state-city")) return "geo-data";
            if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) return "forms";
            if (id.includes("date-fns")) return "date-fns";
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
