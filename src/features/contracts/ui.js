import { t } from '../../shared/i18n/app.js';
import { contractRefs } from './selectors.js';
import { getCurrentCurrency } from './currency.js';

export function applyContractScale() {
  if (!contractRefs.root) return;

  contractRefs.root.style.transform = 'none';
  contractRefs.root.style.marginLeft = '';
  contractRefs.root.style.marginRight = '';
  contractRefs.root.style.marginBottom = '';
}

export function syncCurrencyButtons() {
  contractRefs.currencyButtons.forEach(button => {
    const isActive = button.dataset.currency === getCurrentCurrency();
    button.classList.toggle('is-active', isActive);
  });
}

export function syncConvertedPrice(value) {
  if (!contractRefs.priceConverted) return;
  contractRefs.priceConverted.textContent = value || '';
}

export function syncTripTimeDisplay(value) {
  const tripTimeDisplay = contractRefs.root?.querySelector('[data-trip-time-display]');
  if (!tripTimeDisplay) return;

  const tripTimeButton = tripTimeDisplay.closest('[data-trip-time-trigger]');
  const nextValue = value || t('pickup_time_placeholder');
  tripTimeDisplay.textContent = nextValue;
  tripTimeButton?.classList.toggle('is-placeholder', !value);
}

export function syncRepeatedTextInput(fieldName, value) {
  contractRefs.allInputs.forEach(input => {
    if (input.name === fieldName && input.value !== value) {
      input.value = value;
    }
  });
}
