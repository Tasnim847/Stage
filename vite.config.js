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
  }
});
