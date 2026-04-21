import { getCurrentLocale } from '../../shared/i18n/app.js';
import { findContractInput, contractRefs } from './selectors.js';

const ONE_HOUR_MS = 60 * 60 * 1000;
const IOS_LOCKED_VIEWPORT =
  'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

const FLATPICKR_LOCALE_MAP = {
  uk: () =>
    import('flatpickr/dist/l10n/uk.js').then(
      module => module.Ukrainian || module.default,
    ),
  cs: () =>
    import('flatpickr/dist/l10n/cs.js').then(
      module => module.Czech || module.default,
    ),
};

function getMinDateTime() {
  const minDate = new Date(Date.now() + ONE_HOUR_MS);
  minDate.setSeconds(0, 0);
  return minDate;
}

async function resolveFlatpickrLocale() {
  const loader = FLATPICKR_LOCALE_MAP[getCurrentLocale()];
  if (!loader) return undefined;

  try {
    return await loader();
  } catch {
    return undefined;
  }
}

function lockViewportZoom(lock) {
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

function dispatchInputEvent(input) {
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function bindFlatpickr(flatpickr, input, options) {
  if (input.dataset.flatpickrBound === 'true') return;
  input.dataset.flatpickrBound = 'true';
  input.classList.add('input-date-time');
  flatpickr(input, {
    ...options,
    onChange: (...args) => {
      options.onChange?.(...args);
      dispatchInputEvent(input);
    },
  });
}

export async function initDatePickers(root = contractRefs.root) {
  try {
    const flatpickr = (await import('flatpickr')).default;
    const locale = await resolveFlatpickrLocale();

    root?.querySelectorAll('input[type="date"]').forEach(input => {
      bindFlatpickr(flatpickr, input, {
        dateFormat: 'Y-m-d',
        allowInput: true,
        disableMobile: true,
        monthSelectorType: 'static',
        ...(locale ? { locale } : {}),
      });
    });

    const tripTimeInput = findContractInput('trip-time');
    if (!tripTimeInput) return;

    bindFlatpickr(flatpickr, tripTimeInput, {
      allowInput: true,
      disableMobile: true,
      enableTime: true,
      dateFormat: 'Y-m-d H:i',
      monthSelectorType: 'static',
      time_24hr: true,
      minuteIncrement: 5,
      minDate: getMinDateTime(),
      onOpen: (_selectedDates, _dateStr, instance) => {
        lockViewportZoom(true);
        instance.set('minDate', getMinDateTime());
      },
      onClose: () => lockViewportZoom(false),
      ...(locale ? { locale } : {}),
    });
  } catch (error) {
    console.error('Flatpickr init failed', error);
  }
}
