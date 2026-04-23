import { initContractFeature } from '../features/contracts/index.js';
import { initContractDownload } from '../features/contracts/download.js';
import { initAuthPage } from '../features/auth/index.js';

function bootstrapUserShellPage() {
  initContractFeature();
  initContractDownload();
  void initAuthPage();
}

function bootstrapAdminShellPage() {
  void initAuthPage();
}

export function bootstrapPdfPage() {
  bootstrapUserShellPage();
}

export function bootstrapAccountPage() {
  bootstrapUserShellPage();
}

export function bootstrapOrdersPage() {
  bootstrapUserShellPage();
}

export function bootstrapHistoryPage() {
  bootstrapUserShellPage();
}

export function bootstrapStatsPage() {
  bootstrapUserShellPage();
}

export function bootstrapSettingsPage() {
  bootstrapUserShellPage();
}

export function bootstrapAdminPage() {
  bootstrapAdminShellPage();
}

export function bootstrapManagerPage() {
  bootstrapAdminShellPage();
}
