import { findContractInput, contractRefs } from './selectors.js';
import { formatPrice, sanitizePriceInput } from './currency.js';
import { getContractData } from './state.js';
import { persistContractData } from './storage.js';
import { syncContractActionState } from './validation.js';
import { syncConvertedPrice, syncRepeatedTextInput } from './ui.js';

function normalizeTripTimeValue(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    return value.replace('T', ' ');
  }
  return value;
}

export function handleContractInput(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;

  const { name, value } = input;

  if (name === 'today') {
    persistContractData({ today: value });
    contractRefs.dateInputs.forEach(dateInput => {
      dateInput.value = value;
    });
    syncContractActionState();
    return;
  }

  if (name === 'orderNumber') {
    persistContractData({ orderNumber: value });
    syncContractActionState();
    return;
  }

  if (name.startsWith('driver-')) {
    const key = name.split('-')[1];
    persistContractData({
      driver: {
        ...getContractData().driver,
        [key]: value,
      },
    });
    if (key === 'name') {
      syncRepeatedTextInput('driver-name', value);
    }
    syncContractActionState();
    return;
  }

  if (name.startsWith('provider-')) {
    const key = name.split('-')[1];
    persistContractData({
      provider: {
        ...getContractData().provider,
        [key]: value,
      },
    });
    syncContractActionState();
    return;
  }

  if (name.startsWith('customer-')) {
    const key = name.split('-')[1];
    persistContractData({
      customer: {
        ...getContractData().customer,
        [key]: value,
      },
    });
    if (key === 'name' || key === 'email') {
      syncRepeatedTextInput(name, value);
    }
    syncContractActionState();
    return;
  }

  if (name === 'passengers') {
    persistContractData({ passengers: value });
    syncContractActionState();
    return;
  }

  if (name.startsWith('trip-')) {
    const key = name.split('-')[1];

    if (key === 'from' || key === 'to') {
      persistContractData({
        trip: {
          ...getContractData().trip,
          [key]: { address: value },
        },
      });
      syncContractActionState();
      return;
    }

    if (key === 'time' || key === 'paymentMethod') {
      persistContractData({
        trip: {
          ...getContractData().trip,
          [key]: key === 'time' ? normalizeTripTimeValue(value) : value,
        },
      });
      syncContractActionState();
      return;
    }
  }

  if (name === 'trip-totalPrice') {
    const sanitized = sanitizePriceInput(value);
    if (input.value !== sanitized) {
      input.value = sanitized;
    }

    const formatted = formatPrice(sanitized);
    syncConvertedPrice(formatted);
    persistContractData({
      totalPrice: formatted || value,
    });
    syncContractActionState();
  }
}

export function clearInput(targetName) {
  const input = findContractInput(targetName);
  if (!input) return;

  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

export function fillQuickPick(targetName, value) {
  const input = findContractInput(targetName);
  if (!input || !value) return;

  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
