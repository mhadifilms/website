import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig(({ command }) => ({
  base: command === "serve" ? "/" : "/",
  plugins: [react(), tailwindcss()],
  server: { port: 5174, strictPort: true, proxy: { "/api": process.env.CMS_TEST_PROXY ? "http://127.0.0.1:8790" : "http://127.0.0.1:8788" } },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}))
