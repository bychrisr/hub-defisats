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
        target: 'http://backend:3010', // ✅ CORRETO: usar nome do serviço Docker e porta interna
        changeOrigin: true,             // ✅ Necessário para evitar problemas de Host header
        secure: false,                  // ✅ Útil em dev (desabilita verificação SSL)
        // rewrite: (path) => path.replace(/^\/api/, ''), // ❌ REMOVIDO: backend espera prefixo /api
      },
      '/test': {
        target: 'http://backend:3010', // ✅ WebSocket proxy para endpoints de teste
        changeOrigin: true,
        secure: false,
        ws: true,                      // ✅ Habilitar WebSocket proxy
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
