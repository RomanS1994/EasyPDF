const EUR_RATE = 25;

let currentCurrency = 'EUR';

export function sanitizePriceInput(value) {
  return String(value || '').replace(/\D+/g, '');
}

export function formatPrice(value) {
  const numericValue = sanitizePriceInput(value);
  const number = Number.parseInt(numericValue, 10);

  if (!Number.isFinite(number)) {
    return '';
  }

  if (currentCurrency === 'EUR') {
    const czk = Math.round(number * EUR_RATE * 100) / 100;
    return `${number} EUR / ${czk} CZK`;
  }

  const eur = Math.round((number / EUR_RATE) * 100) / 100;
  return `${number} CZK / ${eur} EUR`;
}
