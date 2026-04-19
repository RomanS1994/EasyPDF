import { findContractInput, contractRefs } from './selectors.js';
import { formatPrice } from './currency.js';
import { getContractData } from './state.js';
import { persistContractData } from './storage.js';
import { syncConvertedPrice, syncRepeatedTextInput } from './ui.js';

export function handleContractInput(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;

  const { name, value } = input;

  if (name === 'today') {
    persistContractData({ today: value });
    contractRefs.dateInputs.forEach(dateInput => {
      dateInput.value = value;
    });
    return;
  }

  if (name === 'orderNumber') {
    persistContractData({ orderNumber: value });
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
    return;
  }

  if (name === 'passengers') {
    persistContractData({ passengers: value });
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
      return;
    }

    if (key === 'time' || key === 'paymentMethod') {
      persistContractData({
        trip: {
          ...getContractData().trip,
          [key]: value,
        },
      });
      return;
    }
  }

  if (name === 'trip-totalPrice') {
    const formatted = formatPrice(value);
    syncConvertedPrice(formatted);
    persistContractData({
      totalPrice: formatted || value,
    });
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
