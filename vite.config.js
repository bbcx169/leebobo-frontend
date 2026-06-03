import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl' // 🚀 1. 新增：載入 HTTPS 外掛

export default defineConfig({
  // Custom domain deploys from the site root.
  base: '/',
  
  plugins: [
    react(),
    basicSsl() // 🚀 2. 新增：啟用 HTTPS
  ],
})
