import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Allows "@/components/..." imports instead of messy relative paths.
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    // Proxy API calls to Flask so we don't hit CORS issues in dev.
    proxy: {
      "/auth": "http://localhost:5000",
      "/upload": "http://localhost:5000",
      "/uploads": "http://localhost:5000",
      "/health": "http://localhost:5000",
    },
  },
});
