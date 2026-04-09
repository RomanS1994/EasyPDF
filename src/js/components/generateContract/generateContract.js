// Generate contract data management
import { loadLs, saveLs } from '../../storage/localStorage.js';
import { t } from '../../i18n/app.js';
import { getRandomDate } from './utils/getRandomDate.js';
import { getRandomOrderNumber } from './utils/getRandomOrderNumber.js';

const KEY_LS = 'contract-data';

// =====================================
// Дані про контракт
// =====================================
export let contractData = {
  orderNumber: 'ORD-0013291093548-7FLQ',
  today: '2025-10-14',
  driver: {
    name: 'Roman Stryzhka',
    address: 'Nam. na Balabence 1437/3, 190 00 Praha 9',
    spz: '1AF V087',
    ico: '22319352',
  },
  provider: {
    name: 'Roman Stryzhka',
    address: 'Nam. na Balabence 1437/3, 190 00 Praha 9',
    ico: '22319352',
  },
  customer: {
    name: 'John Doe',
    email: 'john.doe@gmail.com',
  },
  trip: {
    from: { address: 'Terminal 2, Aviatická, Praha' },
    to: {
      address: 'Hotel Hilton, Pobřežní 311/1, 186 00 Praha 8-Rohanský ostrov',
    },
    time: '2025-11-13 10:00',
    paymentMethod: '',
  },
  totalPrice: '',
};

const EUR_RATE = 25;

// =====================================
// Селектори
// =====================================
const refs = {
  sectionDataContract: document.querySelector('.dataContract'),
  contractRoot: document.querySelector('.dataContract-container'),
  inputsAll: document.querySelectorAll('.dataContract-container input'),
  inputsAllToday: document.querySelectorAll('.dataContract-container .today'),
  inputOrderNumber: document.querySelector('.dataContract-container .orderNumber'),
  pages: document.querySelectorAll('.dataContract-container .dataContract-page'),
  stepTabs: document.querySelectorAll('[data-step-tab]'),
  nextButtons: document.querySelectorAll('.dataContract-container .wizard-next'),
  backButtons: document.querySelectorAll('.dataContract-container .wizard-back'),
  clearButtons: document.querySelectorAll('.dataContract-container .clear-btn'),
  quickPickButtons: document.querySelectorAll('.dataContract-container .quick-pick-btn'),
  priceConverted: document.getElementById('priceConverted'),
  currencyButtons: document.querySelectorAll('.dataContract-container .currency-btn'),
};
const {
  sectionDataContract,
  contractRoot,
  inputsAll,
  inputsAllToday,
  inputOrderNumber,
} = refs;

// =====================================
// Layout sync
// =====================================
const applyContractScale = () => {
  if (!contractRoot) return;
  const container = contractRoot;
  if (!container) return;

  // The builder is now fluid, so the legacy JS scaling must stay disabled.
  container.style.transform = 'none';
  container.style.marginLeft = '';
  container.style.marginRight = '';
  container.style.marginBottom = '';
};

const handleResize = () => {
  window.requestAnimationFrame(applyContractScale);
};

// =====================================
// Допоміжні нормалізатори дат
// =====================================
const normalizeDateValue = val => {
  if (!val) return '';
  // Уже ISO yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  // Формат dd.mm.yyyy -> yyyy-mm-dd
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(val)) {
    const [d, m, y] = val.split('.');
    return `${y}-${m}-${d}`;
  }
  return val;
};

const normalizeDateTimeValue = val => {
  if (!val) return '';
  // ISO datetime-local
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val))
    return val.replace('T', ' ');
  // Simple "dd.mm.yyyy hh:mm" -> convert
  const match = val.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
  if (match) {
    const [, d, m, y, hh, mm] = match;
    return `${y}-${m}-${d} ${hh}:${mm}`;
  }
  return val;
};

const extractEur = val => {
  if (!val) return '';
  const match = String(val).match(/(\d+(?:[.,]\d+)?)/);
  return match ? match[1].replace(',', '.') : '';
};

let currentCurrency = 'EUR';

const setCurrencyButtons = () => {
  refs.currencyButtons.forEach(btn => {
    const active = btn.dataset.currency === currentCurrency;
    btn.classList.toggle('is-active', active);
  });
};

const formatPrice = numericStr => {
  const num = parseFloat(numericStr);
  if (!Number.isFinite(num)) return '';
  if (currentCurrency === 'EUR') {
    const czk = Math.round(num * EUR_RATE * 100) / 100;
    return `${num} EUR / ${czk} CZK`;
  } else {
    const eur = Math.round((num / EUR_RATE) * 100) / 100;
    return `${num} CZK / ${eur} EUR`;
  }
};

const getLocalizedPaymentDefaults = () => {
  return new Set([
    '',
    t('payment_method_default', {}, 'uk'),
    t('payment_method_default', {}, 'en'),
    t('payment_method_default', {}, 'cs'),
  ]);
};

const syncLocalizedContractDefaults = () => {
  if (!contractRoot) return;

  const paymentInput = contractRoot.querySelector('input[name="trip-payment-method"]');
  if (!paymentInput) return;

  const defaults = getLocalizedPaymentDefaults();
  const currentValue = String(paymentInput.value || '').trim();
  if (!defaults.has(currentValue)) return;

  const nextValue = t('payment_method_default');
  paymentInput.value = nextValue;
  contractData.trip = {
    ...contractData.trip,
    paymentMethod: nextValue,
  };
  saveLs(KEY_LS, contractData);
};

// =====================================
// Функція для оновлення contractData і збереження в localStorage
// =====================================
export const setContractData = data => {
  Object.assign(contractData, data);
  saveLs(KEY_LS, contractData);
};

const syncNamedInputs = (fieldName, value) => {
  if (!contractRoot) return;

  const inputs = contractRoot.querySelectorAll(`input[name="${fieldName}"]`);
  inputs.forEach(input => {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

export const applyUserProfileToContract = profile => {
  const driver = profile?.driver || {};
  const provider = profile?.provider || {};

  contractData.driver = {
    ...contractData.driver,
    name: driver.name || contractData.driver.name || '',
    address: driver.address || contractData.driver.address || '',
    spz: driver.spz || contractData.driver.spz || '',
    ico: driver.ico || contractData.driver.ico || '',
  };

  contractData.provider = {
    ...contractData.provider,
    name: provider.name || contractData.provider.name || '',
    address: provider.address || contractData.provider.address || '',
    ico: provider.ico || contractData.provider.ico || '',
  };

  saveLs(KEY_LS, contractData);

  syncNamedInputs('driver-name', contractData.driver.name);
  syncNamedInputs('driver-address', contractData.driver.address);
  syncNamedInputs('driver-spz', contractData.driver.spz);
  syncNamedInputs('driver-ico', contractData.driver.ico);
  syncNamedInputs('provider-name', contractData.provider.name);
  syncNamedInputs('provider-address', contractData.provider.address);
  syncNamedInputs('provider-ico', contractData.provider.ico);
};

// =====================================
// Відновлення даних з localStorage
// =====================================
export const recoveryContractData = () => {
  const data = loadLs(KEY_LS);
  if (data) {
    // нормалізуємо можливі старі формати дат
    const normalized = {
      ...data,
      today: normalizeDateValue(data.today),
      trip: {
        ...contractData.trip,
        ...data.trip,
        time: normalizeDateTimeValue(data.trip?.time),
      },
      totalPrice: data.totalPrice || '',
    };

    contractData = { ...contractData, ...normalized };
    // Заповнюємо поля форми відновленими даними
    if (inputsAll) {
      inputsAll.forEach(input => {
        const { name } = input;
        if (name in contractData) {
          input.value = contractData[name];
        }
        // driver-name, driver-address, driver-spz, driver-ico
        if (name.startsWith('driver-')) {
          const key = name.split('-')[1]; // отримуємо ключ після 'driver-'
          if (key in contractData.driver) {
            input.value = contractData.driver[key];
          }
        }
        // provider-name, provider-address, provider-ico
        if (name.startsWith('provider-')) {
          const key = name.split('-')[1]; // отримуємо ключ після 'provider-'
          if (key in contractData.provider) {
            input.value = contractData.provider[key];
          }
        }

        // customer-name, customer-email
        if (name.startsWith('customer-')) {
          const key = name.split('-')[1]; // отримуємо ключ після 'customer-'
          if (key in contractData.customer) {
            input.value = contractData.customer[key];
          }
        }

        // trip-from-address, trip-to-address, trip-time
        if (name.startsWith('trip-')) {
          const key = name.split('-')[1]; // отримуємо ключ після 'trip-' 'to'/'from'/'time'
          if (
            key in contractData.trip &&
            contractData.trip[key].address !== ''
          ) {
            if (key === 'from' || key === 'to') {
              input.value = contractData.trip[key].address;
            }
          }
          if (key === 'time' && contractData?.trip?.time !== '') {
            input.value = contractData.trip.time;
          }
          if (key === 'totalPrice' && contractData?.totalPrice) {
            input.value = contractData.totalPrice;
          }
          if (
            key === 'paymentMethod' &&
            contractData?.trip?.paymentMethod !== ''
          ) {
            input.value = contractData.trip.paymentMethod;
          }
        }
      });
    }
  }

  // Відновлюємо ціну (EUR ввод, конверсія показ)
  const priceInput = contractRoot?.querySelector('input[name="trip-totalPrice"]');
  if (priceInput) {
    // визначаємо валюту збереженого рядка
    if (contractData.totalPrice?.toLowerCase().includes('czk')) {
      currentCurrency = 'CZK';
    } else {
      currentCurrency = 'EUR';
    }
    setCurrencyButtons();

    const numericVal = extractEur(contractData.totalPrice);
    priceInput.value = numericVal;
    if (numericVal) {
      const formatted = formatPrice(numericVal);
      refs.priceConverted && (refs.priceConverted.textContent = formatted);
      contractData.totalPrice = formatted;
    }
  }
};

// =====================================
// Очистка даних контракту
// =====================================
export const clearContractData = () => {
  contractData = {
    orderNumber: '',
    today: '',
  };
  saveLs(KEY_LS, contractData);
};

// =====================================
// Ініціалізація даних контракту
// =====================================
const initContractData = () => {
  recoveryContractData();
  syncLocalizedContractDefaults();

  const randomDate = contractData.today || getRandomDate();
  inputsAllToday.forEach(input => (input.value = randomDate));
  setContractData({ today: randomDate });

  const randomOrderNumber = contractData.orderNumber || getRandomOrderNumber();
  if (inputOrderNumber) {
    inputOrderNumber.value = randomOrderNumber;
  }
  setContractData({ orderNumber: randomOrderNumber });
};

if (contractRoot) {
  initContractData();
  window.addEventListener('pdf-app:language-changed', () => {
    syncLocalizedContractDefaults();
  });
}

// Apply initial scale and keep it in sync on resize
if (contractRoot) {
  // Run after initial layout
  window.requestAnimationFrame(() => applyContractScale());
  window.addEventListener('resize', handleResize, { passive: true });
}

// =====================================
// Обробник змін у полях форми контракту
// =====================================
if (contractRoot) {
  sectionDataContract.addEventListener('input', e => {
    if (!contractRoot?.contains(e.target)) return;
    if (e.target.tagName !== 'INPUT') return;
    const { name, value } = e.target;

    if (name === 'today') {
      setContractData({ today: value });
      inputsAll.forEach(input => {
        if (input.name === 'today') {
          input.value = value;
        }
      });
    }

    if (name === 'orderNumber') {
      setContractData({ orderNumber: value });
    }

    // driver-name, driver-address, driver-spz, driver-ico
    if (name.startsWith('driver-')) {
      const key = name.split('-')[1]; // отримуємо ключ після 'driver-'
      setContractData({ driver: { ...contractData.driver, [key]: value } });
      if (key === 'name') {
        inputsAll.forEach(input => {
          if (input.name === 'driver-name') {
            input.value = value;
          }
        });
      }
    }

    // provider-name, provider-address, provider-ico
    if (name.startsWith('provider-')) {
      const key = name.split('-')[1]; // отримуємо ключ після 'provider-'
      setContractData({ provider: { ...contractData.provider, [key]: value } });
    }

    // customer-name, customer-email
    if (name.startsWith('customer-')) {
      const key = name.split('-')[1]; // отримуємо ключ після 'customer-'
      setContractData({ customer: { ...contractData.customer, [key]: value } });
      if (key === 'name') {
        inputsAll.forEach(input => {
          if (input.name === 'customer-name') {
            input.value = value;
          }
        });
      }
      if (key === 'email') {
        inputsAll.forEach(input => {
          if (input.name === 'customer-email') {
            input.value = value;
          }
        });
      }
    }

    // trip-from-address, trip-to-address, trip-time
    if (name.startsWith('trip-')) {
      const key = name.split('-')[1]; // отримуємо ключ після 'trip-'
      if (key === 'from' || key === 'to') {
        setContractData({
          trip: {
            ...contractData.trip,
            [key]: { address: value },
          },
        });
      }
      if (key === 'time') {
        setContractData({
          trip: {
            ...contractData.trip,
            time: value,
          },
        });
      }
    }

    // trip-totalPrice,
    if (name === 'trip-totalPrice') {
      const numeric = parseFloat(String(value).replace(',', '.'));
      if (Number.isFinite(numeric)) {
        const formatted = formatPrice(numeric);
        refs.priceConverted && (refs.priceConverted.textContent = formatted);
        setContractData({ totalPrice: formatted });
      } else {
        refs.priceConverted && (refs.priceConverted.textContent = '');
        setContractData({ totalPrice: value });
      }
    }

    // trip-payment-method,
    if (name === 'trip-payment-method') {
      setContractData({
        trip: {
          ...contractData.trip,
          paymentMethod: value,
        },
      });
    }
  });
}

// =====================================
// Простий степпер (2 екрани: 1 — водій/посередник, 2 — клієнт/поездка)
// =====================================
const setStep = step => {
  refs.pages.forEach(page => {
    page.classList.toggle('is-active', page.dataset.step === String(step));
  });
  refs.stepTabs.forEach(tab => {
    tab.classList.toggle('is-active', tab.dataset.stepTab === String(step));
  });
};

if (contractRoot) {
  refs.stepTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const step = tab.dataset.stepTab || '1';
      setStep(step);
      applyContractScale();
    });
  });

  refs.nextButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.next || '2';
      setStep(next);
      applyContractScale();
    });
  });

  refs.backButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const prev = btn.dataset.prev || '1';
      setStep(prev);
      applyContractScale();
    });
  });
}

// Кнопки очищення адрес
if (contractRoot) {
  refs.clearButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetName = btn.dataset.target;
      if (!targetName) return;
      const input = contractRoot.querySelector(
        `input[name="${targetName}"]`
      );
      if (!input) return;
      input.value = '';
      // Тригеримо стандартний інпут-обробник, щоб синхронізувати state/localStorage
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
}

// Кнопки швидкого вибору (термінали)
if (contractRoot) {
  refs.quickPickButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetName =
        btn.dataset.target || btn.parentElement?.dataset?.target;
      const value = btn.dataset.value;
      if (!targetName || !value) return;
      const input = contractRoot.querySelector(
        `input[name="${targetName}"]`
      );
      if (!input) return;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
}

// Кнопки валюти для ціни
if (contractRoot) {
  refs.currencyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentCurrency = btn.dataset.currency || 'EUR';
      setCurrencyButtons();
      const priceInput = contractRoot?.querySelector(
        'input[name="trip-totalPrice"]'
      );
      if (!priceInput) return;
      const formatted = formatPrice(priceInput.value);
      refs.priceConverted && (refs.priceConverted.textContent = formatted);
      if (formatted) {
        contractData.totalPrice = formatted;
        saveLs(KEY_LS, contractData);
      }
    });
  });
}

// =====================================
// Flatpickr для дати/часу
// =====================================
const initDatePickers = async () => {
  if (!contractRoot) return;
  try {
    const flatpickr = (await import('flatpickr')).default;

    const todayInputs = contractRoot.querySelectorAll(
      'input.today[type="date"]'
    );
    todayInputs.forEach(input => {
      flatpickr(input, {
        dateFormat: 'Y-m-d', // зберігаємо ISO для контракту/бекенду
        allowInput: true,
      });
    });

    const tripTimeInput = contractRoot.querySelector(
      'input[name="trip-time"]'
    );
    if (tripTimeInput) {
      flatpickr(tripTimeInput, {
        enableTime: true,
        time_24hr: true,
        dateFormat: 'Y-m-d H:i',
        allowInput: true,
      });
    }
  } catch (err) {
    console.error('Flatpickr init failed', err);
  }
};

initDatePickers();

window.addEventListener('pdf-app:auth-changed', event => {
  const profile = event.detail?.user?.profile;

  if (!profile) return;
  applyUserProfileToContract(profile);
});
