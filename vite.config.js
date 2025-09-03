import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'https://stage-slk6.onrender.com'
    }
  },
  css: {
    postcss: './postcss.config.cjs'
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          ui: ['@mui/material', '@mui/icons-material', 'antd']
        }
      }
    }
  }
});