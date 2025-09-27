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
      host: 'localhost',
      clientPort: 13000 // Porta externa para HMR
    },
    proxy: {
      '/api': {
        target: 'http://backend:3010', // ✅ Usar nome do serviço Docker
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://backend:3010', // ✅ WebSocket proxy usando nome do serviço
        ws: true,
        changeOrigin: true,
      },
      '/test': {
        target: 'http://backend:3010', // ✅ Usar nome do serviço Docker
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/version': {
        target: 'http://backend:3010', // ✅ Usar nome do serviço Docker
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
