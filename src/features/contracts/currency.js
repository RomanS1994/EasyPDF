const EUR_RATE = 25;

let currentCurrency = 'EUR';

export function getCurrentCurrency() {
  return currentCurrency;
}

export function detectCurrency(value) {
  currentCurrency = String(value || '').toLowerCase().includes('czk') ? 'CZK' : 'EUR';
  return currentCurrency;
}

export function setCurrentCurrency(value) {
  currentCurrency = value === 'CZK' ? 'CZK' : 'EUR';
}

export function extractNumericPrice(value) {
  if (!value) return '';
  const match = String(value).match(/(\d+(?:[.,]\d+)?)/);
  return match ? match[1].replace(',', '.') : '';
}

export function formatPrice(value) {
  const number = parseFloat(String(value).replace(',', '.'));
  if (!Number.isFinite(number)) return '';

  if (currentCurrency === 'EUR') {
    const czk = Math.round(number * EUR_RATE * 100) / 100;
    return `${number} EUR / ${czk} CZK`;
  }

  const eur = Math.round((number / EUR_RATE) * 100) / 100;
  return `${number} CZK / ${eur} EUR`;
}
