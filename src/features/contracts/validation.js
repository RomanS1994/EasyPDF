import { t } from '../../shared/i18n/app.js';
import { notifyText } from '../../shared/ui/toast.js';
import { hasGenerationSession } from './generation-session.js';
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

export function validateContractForm({ report = false } = {}) {
  const inputs = getRequiredInputs();
  if (!inputs.length) {
    if (report) {
      notifyText(t('form_complete'), 'error');
    }
    return false;
  }

  inputs.forEach(input => input.setCustomValidity(''));

  const firstInvalid = inputs.find(input => !input.value.trim()) || null;

  if (report && firstInvalid) {
    notifyText(t('form_complete'), 'error');

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
