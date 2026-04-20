import { getCurrentLocale } from '../../shared/i18n/app.js';
import { findContractInput, contractRefs } from './selectors.js';

const FLATPICKR_LOCALE_MAP = {
  uk: () => import('flatpickr/dist/l10n/uk.js').then(module => module.Ukrainian || module.default),
  cs: () => import('flatpickr/dist/l10n/cs.js').then(module => module.Czech || module.default),
};

async function resolveFlatpickrLocale() {
  const locale = getCurrentLocale();
  const loader = FLATPICKR_LOCALE_MAP[locale];
  if (!loader) return undefined;
  try {
    return await loader();
  } catch {
    return undefined;
  }
}

function lockManualDateInput(input) {
  input.readOnly = true;
  input.setAttribute('readonly', 'readonly');
  input.setAttribute('inputmode', 'none');
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('spellcheck', 'false');
  input.setAttribute('aria-readonly', 'true');
}

export async function initDatePickers(root = contractRefs.root) {
  try {
    const flatpickr = (await import('flatpickr')).default;
    const locale = await resolveFlatpickrLocale();
    const datePickerOptions = {
      dateFormat: 'Y-m-d',
      allowInput: false,
      disableMobile: true,
    };

    if (locale) {
      datePickerOptions.locale = locale;
    }

    root?.querySelectorAll('input[type="date"]').forEach(input => {
      if (input.dataset.flatpickrBound === 'true') return;
      input.dataset.flatpickrBound = 'true';
      lockManualDateInput(input);
      flatpickr(input, datePickerOptions);
    });

    const tripTimeInput = findContractInput('trip-time');
    if (tripTimeInput) {
      if (tripTimeInput.dataset.flatpickrBound !== 'true') {
        tripTimeInput.dataset.flatpickrBound = 'true';
        lockManualDateInput(tripTimeInput);
        flatpickr(tripTimeInput, {
          enableTime: true,
          time_24hr: true,
          dateFormat: 'Y-m-d H:i',
          allowInput: false,
          disableMobile: true,
          ...(locale ? { locale } : {}),
        });
      }
    }
  } catch (error) {
    console.error('Flatpickr init failed', error);
  }
}
