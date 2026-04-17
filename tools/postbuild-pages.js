import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(projectRoot, 'dist');

const pageOutputMap = {
  'pages/pdf/index.html': 'cz/pdf/index.html',
  'pages/account/index.html': 'cz/pdf/account/index.html',
  'pages/orders/index.html': 'cz/pdf/orders/index.html',
  'pages/stats/index.html': 'cz/pdf/stats/index.html',
  'pages/manager/index.html': 'cz/pdf/manager/index.html',
  'pages/admin/index.html': 'cz/pdf/admin/index.html',
  'pages/admin/accounts/index.html': 'cz/pdf/admin/accounts/index.html',
  'pages/admin/subscriptions/index.html': 'cz/pdf/admin/subscriptions/index.html',
  'pages/admin/orders/index.html': 'cz/pdf/admin/orders/index.html',
  'pages/admin/settings/index.html': 'cz/pdf/admin/settings/index.html',
};

for (const [from, to] of Object.entries(pageOutputMap)) {
  const sourcePath = path.join(distRoot, from);
  const targetPath = path.join(distRoot, to);

  if (!existsSync(sourcePath)) {
    continue;
  }

  mkdirSync(path.dirname(targetPath), { recursive: true });
  renameSync(sourcePath, targetPath);
}

rmSync(path.join(distRoot, 'pages'), { recursive: true, force: true });
