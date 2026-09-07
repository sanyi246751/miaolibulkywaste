import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig(({ command, isPreview }) => ({
  // 開發伺服器使用根路徑；GitHub Pages 專案網站必須使用儲存庫名稱作為子路徑。
  base: command === 'serve' && !isPreview ? '/' : '/miaolibulkywaste/',
  plugins: [react()],
  build: {
    // Windows 中文路徑下的 esbuild minifier 會在完成轉譯後異常結束；
    // 保留 Rollup 打包，避免正式建置無輸出。
    minify: false,
    // dist 可能正由預覽服務或檔案總管占用，避免 Windows 清空目錄時中止建置。
    emptyOutDir: false,
    rollupOptions: {
      input: {
        public: resolve(process.cwd(), 'index.html'),
        admin: resolve(process.cwd(), 'admin.html'),
        work: resolve(process.cwd(), 'work.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
}))
