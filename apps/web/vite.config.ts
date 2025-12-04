import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
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
      chunkSizeWarningLimit: 1000,
      rolldownOptions: {
        plugins: [visualizer({ open: false })],
        output: {
          advancedChunks: {
            groups: [
              {
                test: /node_modules[/\\](framer-motion|motion-dom)/,
                name: 'framer-motion'
              },
              {
                test: /node_modules[/\\]@tanstack/,
                name: 'tanstack'
              },
              {
                test: /node_modules[/\\]?@vidstack/,
                name: 'vidstack'
              },
              {
                test: /node_modules[/\\]@dnd-kit/,
                name: 'dnd-kit'
              },
              {
                test: /node_modules[/\\]lightgallery/,
                name: 'lightgallery'
              },
              {
                test: /node_modules[/\\]@zip.js/,
                name: 'zipjs'
              },
              {
                test: /node_modules[/\\]react/,
                name: 'react',
                priority: 5
              },
              {
                test: /.css$/,
                name: 'styles',
                priority: 10
              },
              {
                test: /node_modules/,
                name: 'vendor'
              }
            ]
          }
        }
      }
    }
  };
});
