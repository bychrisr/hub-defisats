import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '0.0.0.0',
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://hub-defisats-backend:3010', // ✅ Usar nome do container do backend
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path.replace(/^\/api/, ''), // ❌ REMOVIDO: backend espera prefixo /api
      },
      '/test': {
        target: 'http://hub-defisats-backend:3010', // ✅ Usar nome do container do backend
        changeOrigin: true,
        secure: false,
        ws: true,                      // ✅ Habilitar WebSocket proxy
      },
      '/version': {
        target: 'http://hub-defisats-backend:3010', // ✅ Usar nome do container do backend
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
