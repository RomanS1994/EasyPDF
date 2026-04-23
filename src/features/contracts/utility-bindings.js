import { contractRefs, findContractInput } from './selectors.js';
import { formatPrice, sanitizePriceInput, setCurrentCurrency } from './currency.js';
import { DEFAULT_DOCUMENT_TYPE, getContractData } from './state.js';
import { setDocumentType, syncDocumentTypeButtons } from './document-type.js';
import { persistContractData } from './storage.js';
import { clearInput, fillQuickPick } from './input.js';
import { syncConvertedPrice, syncCurrencyButtons } from './ui.js';

export function bindContractUtilityButtons() {
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
      const sanitizedPrice = priceInput ? sanitizePriceInput(priceInput.value) : '';
      if (priceInput && priceInput.value !== sanitizedPrice) {
        priceInput.value = sanitizedPrice;
      }

      const formatted = priceInput ? formatPrice(sanitizedPrice) : '';
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
