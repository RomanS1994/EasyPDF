import { contractRefs } from './selectors.js';
import {
  detectCurrency,
  extractNumericPrice,
  formatPrice,
  sanitizePriceInput,
} from './currency.js';
import { syncDocumentTypeButtons } from './document-type.js';
import { getContractData } from './state.js';
import {
  persistContractData,
  restoreContractData,
  syncLocalizedContractDefaults,
} from './storage.js';
import { getRandomDate } from './lib/getRandomDate.js';
import { getRandomOrderNumber } from './lib/getRandomOrderNumber.js';
import { syncConvertedPrice, syncCurrencyButtons } from './ui.js';

export function initContractDefaults() {
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

  const numericPrice = sanitizePriceInput(extractNumericPrice(getContractData().totalPrice));
  if (numericPrice) {
    syncConvertedPrice(formatPrice(numericPrice));
    persistContractData({ totalPrice: formatPrice(numericPrice) });
  }

  syncDocumentTypeButtons(contractRefs.documentTypeButtons);
}
