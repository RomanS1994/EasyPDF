import { t } from '../../shared/i18n/app.js';
import { readStorageJson } from '../../shared/lib/storage.js';
import { contractRefs, hasContractRoot } from './selectors.js';
import { syncDocumentTypeButtons } from './document-type.js';
import {
  CONTRACT_STORAGE_KEY,
  getContractData,
  mergeContractData,
} from './state.js';
import { resetContractData } from './storage.js';
import { initContractDefaults } from './defaults.js';
import {
  bindContractInputs,
  bindContractUtilities,
  bindContractWindowEvents,
  bindWizardNavigation,
} from './bindings.js';
import { initDatePickers } from './date-pickers.js';
import { initOrderGenerationSession } from './generation-session.js';

export function initContractFeature() {
  if (!hasContractRoot()) return;

  initContractDefaults();
  bindWizardNavigation();
  bindContractUtilities();
  bindContractInputs();
  bindContractWindowEvents();

  initDatePickers();
  initOrderGenerationSession();
}

export function getCurrentContractData() {
  return getContractData();
}

export function clearContractData() {
  resetContractData();
  syncDocumentTypeButtons(contractRefs.documentTypeButtons);
}
