import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

import info from 'unplugin-info/vite';

import { visualizer } from 'rollup-plugin-visualizer';

import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const devEnv = loadEnv(mode, path.resolve(__dirname, '../..'), '');

  const enableHttps = !!(devEnv.SSL_KEY && devEnv.SSL_CERT);

  return {
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
        },
        '/covers': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      },
      https: enableHttps
        ? {
          key: devEnv.SSL_KEY,
          cert: devEnv.SSL_CERT
        }
        : undefined
    },
    build: {
      minify: true,
      cssMinify: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        plugins: [visualizer({ open: false })],
        output: {
          manualChunks(id) {
            const chunks = ['vidstack', '@dnd-kit', 'lightgallery'];
            if (chunks.some(chunk => id.includes(chunk)))
              return chunks.find(chunk => id.includes(chunk));

            if (id.includes('node_modules'))
              return 'vendor';
          }
        }
      }
    }
  };
});
