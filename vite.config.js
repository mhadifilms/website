import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import vitePluginPosts from './vite-plugin-posts.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), vitePluginPosts()],
  // Use base path for GitHub Pages, empty for Netlify
  base: process.env.NETLIFY ? '/' : '/mhadi.tv/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

