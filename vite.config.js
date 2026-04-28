import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  base: '/',
  envDir: '.',
  root: 'src',
  publicDir: false,
  appType: 'spa',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: [],
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      onwarn(warning, warn) {
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
          warning.id?.includes('react-router') &&
          String(warning.message || '').includes('"use client"')
        ) {
          return;
        }

        if (
          warning.id?.includes('react-router') &&
          String(warning.message || '').includes("Can't resolve original location of error")
        ) {
          return;
        }

        warn(warning);
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    outDir: '../dist',
    emptyOutDir: true,
  },
});
