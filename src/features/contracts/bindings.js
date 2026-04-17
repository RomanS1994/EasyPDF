import { contractRefs, findContractInput } from './selectors.js';
import { setCurrentCurrency, formatPrice } from './currency.js';
import { setDocumentType, syncDocumentTypeButtons } from './document-type.js';
import { DEFAULT_DOCUMENT_TYPE, getContractData } from './state.js';
import {
  applyUserProfileToContract,
  persistContractData,
  syncLocalizedContractDefaults,
} from './storage.js';
import { setWizardStep } from './wizard.js';
import {
  applyContractScale,
  syncConvertedPrice,
  syncCurrencyButtons,
} from './ui.js';
import { clearInput, fillQuickPick, handleContractInput } from './input.js';

export function bindContractInputs() {
  contractRefs.section.addEventListener('input', handleContractInput);
}

export function bindWizardNavigation() {
  contractRefs.stepTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      setWizardStep(contractRefs, tab.dataset.stepTab || '1');
      applyContractScale();
    });
  });

  contractRefs.nextButtons.forEach(button => {
    button.addEventListener('click', () => {
      setWizardStep(contractRefs, button.dataset.next || '2');
      applyContractScale();
    });
  });

  contractRefs.backButtons.forEach(button => {
    button.addEventListener('click', () => {
      setWizardStep(contractRefs, button.dataset.prev || '1');
      applyContractScale();
    });
  });
}

export function bindContractUtilities() {
  contractRefs.clearButtons.forEach(button => {
    button.addEventListener('click', () => {
      clearInput(button.dataset.target);
    });
  });

  contractRefs.quickPickButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetName = button.dataset.target || button.parentElement?.dataset?.target;
      fillQuickPick(targetName, button.dataset.value);
    });
  });

  contractRefs.currencyButtons.forEach(button => {
    button.addEventListener('click', () => {
      setCurrentCurrency(button.dataset.currency || 'EUR');
      syncCurrencyButtons();

      const priceInput = findContractInput('trip-totalPrice');
      const formatted = priceInput ? formatPrice(priceInput.value) : '';
      syncConvertedPrice(formatted);

      if (formatted) {
        persistContractData({ totalPrice: formatted });
      }
    });
  });

  contractRefs.documentTypeButtons.forEach(button => {
    button.addEventListener('click', () => {
      setDocumentType(button.dataset.pdfDocument || DEFAULT_DOCUMENT_TYPE);
      persistContractData({ documentType: getContractData().documentType });
      syncDocumentTypeButtons(contractRefs.documentTypeButtons);
    });
  });
}

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
  });

  window.addEventListener('pdf-app:auth-changed', event => {
    if (event.detail?.user?.profile) {
      applyUserProfileToContract(contractRefs, event.detail.user.profile);
    }
  });
}
