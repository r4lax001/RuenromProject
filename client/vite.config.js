import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Preserve the browser host for the API's same-origin validation.
      "/uploads": { target: "http://localhost:3000" },
      "/api": { target: "http://localhost:3000", changeOrigin: false },
    },
  },
});
