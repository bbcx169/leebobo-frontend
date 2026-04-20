import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 加上這行，確保資源路徑正確。請務必與你的 GitHub 儲存庫名稱一致
  base: '/leebobo-frontend/', 
})