import { getCurrentLocale } from '../../shared/i18n/app.js';
import { getContractData } from './state.js';
import { findContractInput, contractRefs } from './selectors.js';
import { persistContractData } from './storage.js';
import { syncTripTimeDisplay } from './ui.js';

const FLATPICKR_DATE_FORMAT = 'Y-m-d';
const FLATPICKR_DATE_TIME_FORMAT = 'Y-m-d H:i';
const IOS_LOCKED_VIEWPORT =
  'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

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

function getMinDateTime() {
  const minDate = new Date();
  minDate.setSeconds(0, 0);
  return minDate;
}

function iosTemporarilyLockZoom(lock) {
  if (typeof document === 'undefined') return;

  const viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) return;

  if (lock) {
    if (!viewport.dataset.originalContent) {
      viewport.dataset.originalContent = viewport.getAttribute('content') || '';
    }

    viewport.setAttribute('content', IOS_LOCKED_VIEWPORT);
    return;
  }

  if (viewport.dataset.originalContent !== undefined) {
    viewport.setAttribute('content', viewport.dataset.originalContent);
    delete viewport.dataset.originalContent;
  }
}

export async function initDatePickers(root = contractRefs.root) {
  try {
    const flatpickr = (await import('flatpickr')).default;
    const locale = await resolveFlatpickrLocale();
    const datePickerOptions = {
      dateFormat: FLATPICKR_DATE_FORMAT,
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
          dateFormat: FLATPICKR_DATE_TIME_FORMAT,
          time_24hr: true,
          minDate: getMinDateTime(),
          allowInput: false,
          clickOpens: false,
          disableMobile: true,
          ...(locale ? { locale } : {}),
          onChange: (_selectedDates, dateStr) => {
            syncTripTimeDisplay(dateStr);
            persistContractData({
              trip: {
                ...getContractData().trip,
                time: dateStr,
              },
            });
          },
          onOpen: (_selectedDates, _dateStr, instance) => {
            iosTemporarilyLockZoom(true);
            instance.set('minDate', getMinDateTime());
          },
          onClose: () => iosTemporarilyLockZoom(false),
        });
      }

      const tripTimeTrigger = root?.querySelector('[data-trip-time-trigger]');
      if (tripTimeTrigger && tripTimeTrigger.dataset.flatpickrTriggerBound !== 'true') {
        tripTimeTrigger.dataset.flatpickrTriggerBound = 'true';
        tripTimeTrigger.addEventListener('click', () => {
          tripTimeInput._flatpickr?.open();
        });
      }
    }
  } catch (error) {
    console.error('Flatpickr init failed', error);
  }
}
