import { defineConfig } from 'vite';
import path from 'node:path';
import injectHTML from 'vite-plugin-html-inject';
import FullReload from 'vite-plugin-full-reload';
import SortCss from 'postcss-sort-media-queries';

// Minimal Vite config focused only on the PDF page
export default defineConfig(({ command }) => {
  const homeHtml = path.resolve(__dirname, 'src/pages/pdf/index.html');
  const accountHtml = path.resolve(__dirname, 'src/pages/account/index.html');
  const statsHtml = path.resolve(__dirname, 'src/pages/stats/index.html');
  const ordersHtml = path.resolve(__dirname, 'src/pages/orders/index.html');
  const managerHtml = path.resolve(__dirname, 'src/pages/manager/index.html');
  const adminHtml = path.resolve(__dirname, 'src/pages/admin/index.html');
  const adminAccountsHtml = path.resolve(__dirname, 'src/pages/admin/accounts/index.html');
  const adminSubscriptionsHtml = path.resolve(
    __dirname,
    'src/pages/admin/subscriptions/index.html'
  );
  const adminOrdersHtml = path.resolve(__dirname, 'src/pages/admin/orders/index.html');
  const adminSettingsHtml = path.resolve(__dirname, 'src/pages/admin/settings/index.html');
  const redirectHtml = path.resolve(__dirname, 'src/index.html');

  return {
    base: '/',
    envDir: '.',
    define: {
      [command === 'serve' ? 'global' : '_global']: {},
    },
    root: 'src',
    publicDir: false,
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
        input: {
          index: redirectHtml,
          'cz/pdf/index': homeHtml,
          'cz/pdf/account/index': accountHtml,
          'cz/pdf/stats/index': statsHtml,
          'cz/pdf/orders/index': ordersHtml,
          'cz/pdf/manager/index': managerHtml,
          'cz/pdf/admin/index': adminHtml,
          'cz/pdf/admin/accounts/index': adminAccountsHtml,
          'cz/pdf/admin/subscriptions/index': adminSubscriptionsHtml,
          'cz/pdf/admin/orders/index': adminOrdersHtml,
          'cz/pdf/admin/settings/index': adminSettingsHtml,
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
          assetFileNames: assetInfo => {
            if (assetInfo.name && assetInfo.name.endsWith('.html')) {
              return '[name].[ext]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      outDir: '../dist',
      emptyOutDir: true,
    },
    plugins: [injectHTML(), FullReload(['./**/*.html']), SortCss({ sort: 'mobile-first' })],
  };
});
