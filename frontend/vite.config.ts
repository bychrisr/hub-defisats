import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '0.0.0.0',
    port: 3001,
    hmr: {
      port: 3001,
      host: 'localhost'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:13000', // ✅ Usar backend local
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:13000', // ✅ WebSocket proxy
        ws: true,
        changeOrigin: true,
      },
      '/test': {
        target: 'http://localhost:13000', // ✅ Usar backend local
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/version': {
        target: 'http://localhost:13000', // ✅ Usar backend local
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
