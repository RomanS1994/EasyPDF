import { contractRefs, hasContractRoot } from './selectors.js';
import { syncDocumentTypeButtons } from './document-type.js';
import { getContractData } from './state.js';
import { resetContractData } from './storage.js';
import { initContractDefaults } from './defaults.js';
import { bindContractInputEvents } from './input-bindings.js';
import { bindContractWizardNavigation } from './wizard-bindings.js';
import { bindContractUtilityButtons } from './utility-bindings.js';
import { bindContractWindowEvents } from './window-bindings.js';
import { initOrderGenerationSession } from './generation-session.js';
import { syncContractActionState } from './validation.js';

export function initContractFeature() {
  if (!hasContractRoot()) return;

  initContractDefaults();
  bindContractWizardNavigation();
  bindContractUtilityButtons();
  bindContractInputEvents();
  bindContractWindowEvents();

  initOrderGenerationSession();
  syncContractActionState();
}

export function getCurrentContractData() {
  return getContractData();
}

export function clearContractData() {
  resetContractData();
  syncDocumentTypeButtons(contractRefs.documentTypeButtons);
  syncContractActionState();
}
