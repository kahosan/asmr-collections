import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

import info from 'unplugin-info/vite';

import { visualizer } from 'rollup-plugin-visualizer';

import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), info()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/download': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/stream': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/proxy': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  esbuild: {
    drop: ['console', 'debugger']
  },
  build: {
    minify: true,
    cssMinify: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      plugins: [visualizer({ open: false })],
      output: {
        manualChunks(id) {
          if (id.includes('vidstack'))
            return;
          if (id.includes('node_modules/'))
            return 'vendor';
        }
      }
    }
  }
});
