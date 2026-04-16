import { t } from '../../shared/i18n/app.js';
import {
  mergeStorageJson,
  readStorageJson,
  writeStorageJson,
} from '../../shared/lib/storage.js';
import { extractNumericPrice } from './currency.js';
import {
  CONTRACT_STORAGE_KEY,
  DEFAULT_DOCUMENT_TYPE,
  SUPPORTED_DOCUMENT_TYPES,
  createDefaultContractData,
  getContractData,
  mergeContractData,
  replaceContractData,
} from './state.js';

function normalizeDateValue(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
    const [day, month, year] = value.split('.');
    return `${year}-${month}-${day}`;
  }
  return value;
}

function normalizeDateTimeValue(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    return value.replace('T', ' ');
  }

  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
  if (!match) return value;

  const [, day, month, year, hours, minutes] = match;
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getLocalizedPaymentDefaults() {
  return new Set([
    '',
    t('payment_method_default', {}, 'uk'),
    t('payment_method_default', {}, 'en'),
    t('payment_method_default', {}, 'cs'),
  ]);
}

export function persistContractData(partial) {
  mergeContractData(partial);
  return mergeStorageJson(CONTRACT_STORAGE_KEY, getContractData());
}

export function loadStoredContractData() {
  return readStorageJson(CONTRACT_STORAGE_KEY, null);
}

export function restoreContractData(refs) {
  const stored = loadStoredContractData();
  if (!stored) return getContractData();

  const defaults = createDefaultContractData();
  const normalized = {
    ...stored,
    documentType: SUPPORTED_DOCUMENT_TYPES.has(stored.documentType)
      ? stored.documentType
      : DEFAULT_DOCUMENT_TYPE,
    today: normalizeDateValue(stored.today),
    trip: {
      ...defaults.trip,
      ...stored.trip,
      time: normalizeDateTimeValue(stored.trip?.time),
    },
    totalPrice: stored.totalPrice || '',
  };

  replaceContractData({
    ...defaults,
    ...normalized,
  });

  refs.allInputs.forEach(input => {
    const { name } = input;
    const data = getContractData();

    if (name in data) {
      input.value = data[name];
    }

    if (name.startsWith('driver-')) {
      const key = name.split('-')[1];
      if (key in data.driver) input.value = data.driver[key];
    }

    if (name.startsWith('provider-')) {
      const key = name.split('-')[1];
      if (key in data.provider) input.value = data.provider[key];
    }

    if (name.startsWith('customer-')) {
      const key = name.split('-')[1];
      if (key in data.customer) input.value = data.customer[key];
    }

    if (name.startsWith('trip-')) {
      const key = name.split('-')[1];
      if ((key === 'from' || key === 'to') && data.trip[key]?.address) {
        input.value = data.trip[key].address;
      }
      if (key === 'time' && data.trip.time) {
        input.value = data.trip.time;
      }
      if (key === 'paymentMethod' && data.trip.paymentMethod) {
        input.value = data.trip.paymentMethod;
      }
      if (key === 'totalPrice' && data.totalPrice) {
        input.value = extractNumericPrice(data.totalPrice);
      }
    }
  });

  return getContractData();
}

export function resetContractData() {
  const nextData = {
    orderNumber: '',
    today: '',
    documentType: DEFAULT_DOCUMENT_TYPE,
  };

  replaceContractData(nextData);
  writeStorageJson(CONTRACT_STORAGE_KEY, nextData);
  return nextData;
}

export function applyUserProfileToContract(refs, profile) {
  const current = getContractData();
  const driver = profile?.driver || {};
  const provider = profile?.provider || {};

  const nextData = {
    ...current,
    driver: {
      ...current.driver,
      name: driver.name || current.driver.name || '',
      address: driver.address || current.driver.address || '',
      spz: driver.spz || current.driver.spz || '',
      ico: driver.ico || current.driver.ico || '',
    },
    provider: {
      ...current.provider,
      name: provider.name || current.provider.name || '',
      address: provider.address || current.provider.address || '',
      ico: provider.ico || current.provider.ico || '',
    },
  };

  replaceContractData(nextData);
  writeStorageJson(CONTRACT_STORAGE_KEY, nextData);

  const updates = {
    'driver-name': nextData.driver.name,
    'driver-address': nextData.driver.address,
    'driver-spz': nextData.driver.spz,
    'driver-ico': nextData.driver.ico,
    'provider-name': nextData.provider.name,
    'provider-address': nextData.provider.address,
    'provider-ico': nextData.provider.ico,
  };

  Object.entries(updates).forEach(([fieldName, value]) => {
    refs.root
      ?.querySelectorAll(`input[name="${fieldName}"]`)
      .forEach(input => {
        input.value = value;
      });
  });
}

export function syncLocalizedContractDefaults(refs) {
  const paymentInput = refs.root?.querySelector('input[name="trip-payment-method"]');
  if (!paymentInput) return;

  const defaults = getLocalizedPaymentDefaults();
  const currentValue = String(paymentInput.value || '').trim();
  if (!defaults.has(currentValue)) return;

  const nextValue = t('payment_method_default');
  paymentInput.value = nextValue;
  persistContractData({
    trip: {
      ...getContractData().trip,
      paymentMethod: nextValue,
    },
  });
}
