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

export function syncRepeatedTextInput(fieldName, value) {
  contractRefs.allInputs.forEach(input => {
    if (input.name === fieldName && input.value !== value) {
      input.value = value;
    }
  });
}
