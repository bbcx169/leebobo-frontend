import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl' // 🚀 1. 新增：載入 HTTPS 外掛

export default defineConfig({
  // 💡 顧問提示：請保留您原本的 base 設定（對應您的 GitHub 專案名稱）
  base: '/leebobo-frontend/',
  
  plugins: [
    react(),
    basicSsl() // 🚀 2. 新增：啟用 HTTPS
  ],
})