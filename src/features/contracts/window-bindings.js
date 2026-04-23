import { contractRefs } from './selectors.js';
import { applyContractScale } from './ui.js';
import {
  applyUserProfileToContract,
  syncLocalizedContractDefaults,
} from './storage.js';
import { syncContractActionState } from './validation.js';

export function bindContractWindowEvents() {
  window.requestAnimationFrame(applyContractScale);
  window.addEventListener(
    'resize',
    () => {
      window.requestAnimationFrame(applyContractScale);
    },
    { passive: true },
  );

  window.addEventListener('pdf-app:language-changed', () => {
    syncLocalizedContractDefaults(contractRefs);
    syncContractActionState();
  });

  window.addEventListener('pdf-app:auth-changed', event => {
    if (event.detail?.user?.profile) {
      applyUserProfileToContract(contractRefs, event.detail.user.profile);
    }
  });
}
