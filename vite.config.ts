import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        react: path.resolve(__dirname, 'index-react.html')
      },
      output: {
        manualChunks: {
          phaser: ['phaser'],
          vendor: ['zustand'],
          react: ['react', 'react-dom']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    open: '/index-react.html'
  },
  optimizeDeps: {
    include: ['phaser', 'react', 'react-dom']
  }
});