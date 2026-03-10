import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Keep HMR toggle via env var for stable local development.
      // File watching can be disabled externally when needed.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
