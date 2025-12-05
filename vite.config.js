import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const proxyTarget = process.env.LLM_PROXY_TARGET || "http://localhost:8789";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/.netlify/functions/llm-proxy": {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
});
