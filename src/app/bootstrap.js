import { initContractFeature } from '../features/contracts/index.js';
import { initContractDownload } from '../features/contracts/download.js';
import { initAuthPage } from '../features/auth/index.js';

export function bootstrapUserPage() {
  initContractFeature();
  initContractDownload();
  void initAuthPage();
}

export function bootstrapAdminPage() {
  void initAuthPage();
}
