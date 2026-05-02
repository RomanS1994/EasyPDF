const EUR_RATE = 25;

let currentCurrency = 'EUR';

export function setCurrentCurrency(value) {
  currentCurrency = value === 'CZK' ? 'CZK' : 'EUR';
}

export function detectCurrency(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('czk')) {
    setCurrentCurrency('CZK');
    return 'CZK';
  }

  if (text.includes('eur')) {
    setCurrentCurrency('EUR');
    return 'EUR';
  }

  return currentCurrency;
}

export function extractNumericPrice(value) {
  const text = String(value || '');
  const match = text.match(/\d+(?:[.,]\d+)?/);
  return match ? match[0].replace(',', '.') : '';
}

export function sanitizePriceInput(value) {
  return String(value || '').replace(/[^\d.,]+/g, '').replace(/,/g, '.');
}

export function formatPrice(value, currency = currentCurrency) {
  const numericValue = extractNumericPrice(value);
  const number = Number.parseFloat(numericValue);

  if (!Number.isFinite(number)) {
    return '';
  }

  const safeCurrency = currency === 'CZK' ? 'CZK' : 'EUR';
  if (safeCurrency === 'EUR') {
    const czk = Math.round(number * EUR_RATE * 100) / 100;
    return `${number} EUR / ${czk} CZK`;
  }

  const eur = Math.round((number / EUR_RATE) * 100) / 100;
  return `${number} CZK / ${eur} EUR`;
}
