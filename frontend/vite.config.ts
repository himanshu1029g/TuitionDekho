import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Find your laptop IP using ipconfig (example: 192.168.29.45)
const LOCAL_IP = "192.168.1.3"; // <-- replace this

export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": `http://${LOCAL_IP}:5000`,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
