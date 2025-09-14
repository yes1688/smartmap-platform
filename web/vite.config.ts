import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    solid(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/cesium/Build/Cesium/Assets/**/*',
          dest: 'cesium/Assets'
        },
        {
          src: 'node_modules/cesium/Build/Cesium/Workers/**/*',
          dest: 'cesium/Workers'
        },
        {
          src: 'node_modules/cesium/Build/Cesium/ThirdParty/**/*',
          dest: 'cesium/ThirdParty'
        },
        {
          src: 'node_modules/cesium/Build/Cesium/Widgets/**/*',
          dest: 'cesium/Widgets'
        }
      ]
    }),
    {
      name: 'commonjs-externals',
      config(config, { command }) {
        if (command === 'serve') {
          config.define = config.define || {};
          config.define.global = 'globalThis';
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    // Define Cesium base URL for proper asset loading
    CESIUM_BASE_URL: JSON.stringify('/cesium/'),
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true, // 強制使用指定端口，避免自動切換
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          cesium: ['cesium'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['cesium'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
});