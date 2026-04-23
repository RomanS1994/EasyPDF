import { messages } from '../../shared/i18n/messages.js';
import { t } from '../../shared/i18n/app.js';
import { hasGenerationSession } from './generation-session.js';
import { contractRefs, findContractInput } from './selectors.js';
import { sanitizePriceInput } from './currency.js';
import { syncTripTimeInputConstraints } from './date-pickers.js';

const REQUIRED_FIELD_NAMES = [
  'customer-name',
  'customer-email',
  'passengers',
  'trip-from-address',
  'trip-to-address',
  'trip-time',
  'trip-totalPrice',
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getMessage(key) {
  const lang = document.documentElement.lang || 'uk';
  return messages[lang]?.[key] || messages.en?.[key] || key;
}

function setCustomFieldValidity(input, messageKey = '') {
  input.setCustomValidity(messageKey ? getMessage(messageKey) : '');
}

function validateCustomerEmail(input) {
  const value = input.value.trim();
  if (!value) {
    setCustomFieldValidity(input, 'form_complete');
    return false;
  }

  if (!EMAIL_PATTERN.test(value)) {
    setCustomFieldValidity(input, 'invalid_email');
    return false;
  }

  setCustomFieldValidity(input);
  return true;
}

function validatePassengers(input) {
  const value = input.value.trim();
  if (!value) {
    setCustomFieldValidity(input, 'form_complete');
    return false;
  }

  if (!/^[1-9]\d*$/.test(value)) {
    setCustomFieldValidity(input, 'form_complete');
    return false;
  }

  setCustomFieldValidity(input);
  return true;
}

function validateTripTime(input) {
  syncTripTimeInputConstraints(input);

  const value = input.value.trim().replace(' ', 'T');
  if (!value) {
    setCustomFieldValidity(input, 'form_complete');
    return false;
  }

  const minValue = input.min || '';
  if (minValue && value < minValue) {
    setCustomFieldValidity(input, 'trip_time_min_one_hour');
    return false;
  }

  setCustomFieldValidity(input);
  return true;
}

function validatePrice(input) {
  const value = sanitizePriceInput(input.value);
  if (!value) {
    setCustomFieldValidity(input, 'form_complete');
    return false;
  }

  if (Number.parseInt(value, 10) <= 0) {
    setCustomFieldValidity(input, 'form_complete');
    return false;
  }

  setCustomFieldValidity(input);
  return true;
}

export function validateContractInput(input) {
  if (!input) return true;

  switch (input.name) {
    case 'customer-name': {
      const valid = Boolean(input.value.trim());
      setCustomFieldValidity(input, valid ? '' : 'form_complete');
      return valid;
    }
    case 'customer-email':
      return validateCustomerEmail(input);
    case 'passengers':
      return validatePassengers(input);
    case 'trip-from-address': {
      const valid = Boolean(input.value.trim());
      setCustomFieldValidity(input, valid ? '' : 'select_fromAdress');
      return valid;
    }
    case 'trip-to-address': {
      const valid = Boolean(input.value.trim());
      setCustomFieldValidity(input, valid ? '' : 'select_toAdress');
      return valid;
    }
    case 'trip-time':
      return validateTripTime(input);
    case 'trip-totalPrice':
      return validatePrice(input);
    default:
      return true;
  }
}

export function validateContractForm({ report = false } = {}) {
  const inputs = REQUIRED_FIELD_NAMES.map(name => findContractInput(name)).filter(Boolean);
  let firstInvalid = null;

  inputs.forEach(input => {
    const valid = validateContractInput(input);
    if (!valid && !firstInvalid) {
      firstInvalid = input;
    }
  });

  if (report && firstInvalid) {
    firstInvalid.reportValidity();

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
  const isFormValid = validateContractForm({ report: false });
  const hasSession = hasGenerationSession();

  if (contractRefs.saveOrderBtn) {
    contractRefs.saveOrderBtn.disabled = !isFormValid;
  }

  if (contractRefs.downloadPdfBtn) {
    contractRefs.downloadPdfBtn.disabled = !isFormValid;
  }

  syncButtonLabel(
    contractRefs.downloadPdfBtn,
    hasSession ? 'generate_now' : 'generate_order',
  );
  syncButtonLabel(contractRefs.saveOrderBtn, 'save_order');
}
