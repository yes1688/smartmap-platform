import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [
    solid(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    strictPort: false, // 允許自動切換端口
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'smartmap.94work.net', // Cloudflare 代理域名
      '.94work.net', // 允許所有 94work.net 子域名
    ],
    proxy: {
      // API 代理到後端容器
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      // 健康檢查端點代理
      '/health': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      // WebSocket 代理
      '/ws': {
        target: 'ws://localhost:8081',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    // 🔧 自動配置：開發環境啟用 source map，生產環境關閉（防止原始碼洩漏）
    sourcemap: mode === 'development',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));