import { t } from '../../shared/i18n/app.js';
import { notifyText } from '../../shared/ui/toast.js';
import { hasGenerationSession } from './generation-session.js';
import { extractNumericPrice } from './currency.js';
import { contractRefs, findContractInput } from './selectors.js';

const REQUIRED_FIELD_NAMES = [
  'customer-name',
  'customer-email',
  'passengers',
  'trip-from-address',
  'trip-to-address',
  'trip-time',
  'trip-totalPrice',
];

function getRequiredInputs() {
  return REQUIRED_FIELD_NAMES.map(name => findContractInput(name)).filter(Boolean);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function isPositiveInteger(value) {
  return /^[1-9]\d*$/.test(String(value || '').trim());
}

function hasPositivePrice(value) {
  const numericPrice = extractNumericPrice(value);
  return Number.parseInt(numericPrice, 10) > 0;
}

function getValidationMessage(input) {
  const value = String(input.value || '').trim();

  if (!value) {
    return t('form_complete');
  }

  if (input.name === 'customer-email' && !isValidEmail(value)) {
    return t('order_contract_email_invalid');
  }

  if (input.name === 'passengers' && !isPositiveInteger(value)) {
    return t('order_contract_passengers_invalid');
  }

  if (input.name === 'trip-totalPrice' && !hasPositivePrice(value)) {
    return t('order_contract_total_price_invalid');
  }

  return '';
}

export function validateContractForm({ report = false } = {}) {
  const inputs = getRequiredInputs();
  if (!inputs.length) {
    if (report) {
      notifyText(t('form_complete'), 'error');
    }
    return false;
  }

  inputs.forEach(input => input.setCustomValidity(''));

  let firstInvalid = null;

  for (const input of inputs) {
    const message = getValidationMessage(input);
    if (message) {
      input.setCustomValidity(message);
      if (!firstInvalid) {
        firstInvalid = input;
      }
    }
  }

  if (report && firstInvalid) {
    notifyText(firstInvalid.validationMessage || t('form_complete'), 'error');

    if (typeof firstInvalid.reportValidity === 'function') {
      firstInvalid.reportValidity();
    }

    if (typeof firstInvalid.focus === 'function') {
      firstInvalid.focus({ preventScroll: true });
    }
  }

  return !firstInvalid;
}

function syncButtonLabel(button, key) {
  if (!button) return;

  const labelTarget = button.querySelector('[data-i18n]') || button;
  labelTarget.dataset.i18n = key;
  labelTarget.textContent = t(key);
}

export function syncContractActionState() {
  const hasSession = hasGenerationSession();

  syncButtonLabel(
    contractRefs.downloadPdfBtn,
    hasSession ? 'generate_now' : 'generate_order',
  );
  syncButtonLabel(contractRefs.saveOrderBtn, 'save_order');
}
