import './styles/dataContract.css';

import { t } from '../../shared/i18n/app.js';
import { readStorageJson } from '../../shared/lib/storage.js';
import {
  contractRefs,
  findContractInput,
  hasContractRoot,
} from './selectors.js';
import {
  detectCurrency,
  extractNumericPrice,
  formatPrice,
  getCurrentCurrency,
  setCurrentCurrency,
} from './currency.js';
import { setDocumentType, syncDocumentTypeButtons } from './document-type.js';
import {
  CONTRACT_STORAGE_KEY,
  DEFAULT_DOCUMENT_TYPE,
  getContractData,
  mergeContractData,
} from './state.js';
import {
  applyUserProfileToContract,
  persistContractData,
  resetContractData,
  restoreContractData,
  syncLocalizedContractDefaults,
} from './storage.js';
import { setWizardStep } from './wizard.js';
import { getRandomDate } from './lib/getRandomDate.js';
import { getRandomOrderNumber } from './lib/getRandomOrderNumber.js';

function applyContractScale() {
  if (!contractRefs.root) return;

  contractRefs.root.style.transform = 'none';
  contractRefs.root.style.marginLeft = '';
  contractRefs.root.style.marginRight = '';
  contractRefs.root.style.marginBottom = '';
}

function syncCurrencyButtons() {
  contractRefs.currencyButtons.forEach(button => {
    const isActive = button.dataset.currency === getCurrentCurrency();
    button.classList.toggle('is-active', isActive);
  });
}

function syncConvertedPrice(value) {
  if (!contractRefs.priceConverted) return;
  contractRefs.priceConverted.textContent = value || '';
}

function initContractDefaults() {
  restoreContractData(contractRefs);
  syncLocalizedContractDefaults(contractRefs);

  const current = getContractData();
  const today = current.today || getRandomDate();
  contractRefs.dateInputs.forEach(input => {
    input.value = today;
  });
  persistContractData({ today });

  const orderNumber = current.orderNumber || getRandomOrderNumber();
  if (contractRefs.orderNumberInput) {
    contractRefs.orderNumberInput.value = orderNumber;
  }
  persistContractData({ orderNumber });

  detectCurrency(getContractData().totalPrice);
  syncCurrencyButtons();

  const numericPrice = extractNumericPrice(getContractData().totalPrice);
  if (numericPrice) {
    syncConvertedPrice(formatPrice(numericPrice));
    persistContractData({ totalPrice: formatPrice(numericPrice) });
  }

  syncDocumentTypeButtons(contractRefs.documentTypeButtons);
}

function syncRepeatedTextInput(fieldName, value) {
  contractRefs.allInputs.forEach(input => {
    if (input.name === fieldName && input.value !== value) {
      input.value = value;
    }
  });
}

function handleContractInput(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;

  const { name, value } = input;

  if (name === 'today') {
    persistContractData({ today: value });
    contractRefs.dateInputs.forEach(dateInput => {
      dateInput.value = value;
    });
    return;
  }

  if (name === 'orderNumber') {
    persistContractData({ orderNumber: value });
    return;
  }

  if (name.startsWith('driver-')) {
    const key = name.split('-')[1];
    persistContractData({
      driver: {
        ...getContractData().driver,
        [key]: value,
      },
    });
    if (key === 'name') {
      syncRepeatedTextInput('driver-name', value);
    }
    return;
  }

  if (name.startsWith('provider-')) {
    const key = name.split('-')[1];
    persistContractData({
      provider: {
        ...getContractData().provider,
        [key]: value,
      },
    });
    return;
  }

  if (name.startsWith('customer-')) {
    const key = name.split('-')[1];
    persistContractData({
      customer: {
        ...getContractData().customer,
        [key]: value,
      },
    });
    if (key === 'name' || key === 'email') {
      syncRepeatedTextInput(name, value);
    }
    return;
  }

  if (name.startsWith('trip-')) {
    const key = name.split('-')[1];

    if (key === 'from' || key === 'to') {
      persistContractData({
        trip: {
          ...getContractData().trip,
          [key]: { address: value },
        },
      });
      return;
    }

    if (key === 'time') {
      persistContractData({
        trip: {
          ...getContractData().trip,
          time: value,
        },
      });
      return;
    }

    if (key === 'paymentMethod') {
      persistContractData({
        trip: {
          ...getContractData().trip,
          paymentMethod: value,
        },
      });
      return;
    }
  }

  if (name === 'trip-totalPrice') {
    const formatted = formatPrice(value);
    syncConvertedPrice(formatted);
    persistContractData({
      totalPrice: formatted || value,
    });
  }
}

function bindWizard() {
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

function bindUtilityButtons() {
  contractRefs.clearButtons.forEach(button => {
    button.addEventListener('click', () => {
      const input = findContractInput(button.dataset.target);
      if (!input) return;

      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  contractRefs.quickPickButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetName = button.dataset.target || button.parentElement?.dataset?.target;
      const value = button.dataset.value;
      const input = findContractInput(targetName);
      if (!input || !value) return;

      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
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

async function initDatePickers() {
  try {
    const flatpickr = (await import('flatpickr')).default;

    contractRefs.root?.querySelectorAll('input.today[type="date"]').forEach(input => {
      flatpickr(input, {
        dateFormat: 'Y-m-d',
        allowInput: true,
      });
    });

    const tripTimeInput = findContractInput('trip-time');
    if (tripTimeInput) {
      flatpickr(tripTimeInput, {
        enableTime: true,
        time_24hr: true,
        dateFormat: 'Y-m-d H:i',
        allowInput: true,
      });
    }
  } catch (error) {
    console.error('Flatpickr init failed', error);
  }
}

export function initContractFeature() {
  if (!hasContractRoot()) return;

  initContractDefaults();
  bindWizard();
  bindUtilityButtons();
  contractRefs.section.addEventListener('input', handleContractInput);

  window.requestAnimationFrame(applyContractScale);
  window.addEventListener('resize', () => {
    window.requestAnimationFrame(applyContractScale);
  }, { passive: true });

  window.addEventListener('pdf-app:language-changed', () => {
    syncLocalizedContractDefaults(contractRefs);
  });

  window.addEventListener('pdf-app:auth-changed', event => {
    if (event.detail?.user?.profile) {
      applyUserProfileToContract(contractRefs, event.detail.user.profile);
    }
  });

  initDatePickers();
}

export function getCurrentContractData() {
  return getContractData();
}

export function clearContractData() {
  resetContractData();
  syncDocumentTypeButtons(contractRefs.documentTypeButtons);
}
