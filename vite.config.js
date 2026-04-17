import { defineConfig } from 'vite';
import path from 'node:path';
import injectHTML from 'vite-plugin-html-inject';
import FullReload from 'vite-plugin-full-reload';
import SortCss from 'postcss-sort-media-queries';

const devPageRouteMap = {
  '/cz/pdf': '/pages/pdf/index.html',
  '/cz/pdf/': '/pages/pdf/index.html',
  '/cz/pdf/account': '/pages/account/index.html',
  '/cz/pdf/account/': '/pages/account/index.html',
  '/cz/pdf/stats': '/pages/stats/index.html',
  '/cz/pdf/stats/': '/pages/stats/index.html',
  '/cz/pdf/orders': '/pages/orders/index.html',
  '/cz/pdf/orders/': '/pages/orders/index.html',
  '/cz/pdf/manager': '/pages/manager/index.html',
  '/cz/pdf/manager/': '/pages/manager/index.html',
  '/cz/pdf/admin': '/pages/admin/index.html',
  '/cz/pdf/admin/': '/pages/admin/index.html',
  '/cz/pdf/admin/accounts': '/pages/admin/accounts/index.html',
  '/cz/pdf/admin/accounts/': '/pages/admin/accounts/index.html',
  '/cz/pdf/admin/subscriptions': '/pages/admin/subscriptions/index.html',
  '/cz/pdf/admin/subscriptions/': '/pages/admin/subscriptions/index.html',
  '/cz/pdf/admin/orders': '/pages/admin/orders/index.html',
  '/cz/pdf/admin/orders/': '/pages/admin/orders/index.html',
  '/cz/pdf/admin/settings': '/pages/admin/settings/index.html',
  '/cz/pdf/admin/settings/': '/pages/admin/settings/index.html',
};

function devRouteRewritePlugin() {
  return {
    name: 'dev-route-rewrite',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (!request.url) {
          next();
          return;
        }

        const requestUrl = new URL(request.url, 'http://localhost');
        const targetPath = devPageRouteMap[requestUrl.pathname];

        if (!targetPath) {
          next();
          return;
        }

        request.url = `${targetPath}${requestUrl.search || ''}`;
        next();
      });
    },
  };
}

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
    plugins: [
      injectHTML(),
      devRouteRewritePlugin(),
      FullReload(['./**/*.html']),
      SortCss({ sort: 'mobile-first' }),
    ],
  };
});
