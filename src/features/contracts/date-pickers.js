import { findContractInput, contractRefs } from './selectors.js';

const ONE_HOUR_MS = 60 * 60 * 1000;
const TIME_STEP_MINUTES = 5;
const TIME_STEP_SECONDS = TIME_STEP_MINUTES * 60;

function pad(value) {
  return String(value).padStart(2, '0');
}

function toDateTimeLocalValue(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getMinDateTime() {
  const next = new Date(Date.now() + ONE_HOUR_MS);
  next.setSeconds(0, 0);

  const remainder = next.getMinutes() % TIME_STEP_MINUTES;
  if (remainder) {
    next.setMinutes(next.getMinutes() + (TIME_STEP_MINUTES - remainder));
  }

  return next;
}

function toDateTimeInputValue(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value)) {
    return value.replace(' ', 'T');
  }

  const localized = value.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
  if (!localized) return value;

  const [, day, month, year, hour, minute] = localized;
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function syncTripTimeInputConstraints(input) {
  if (!input) return;

  input.step = String(TIME_STEP_SECONDS);
  input.min = toDateTimeLocalValue(getMinDateTime());

  const normalizedValue = toDateTimeInputValue(input.value);
  if (normalizedValue && input.value !== normalizedValue) {
    input.value = normalizedValue;
  }
}

function bindTripTimeInput(input) {
  if (!input || input.dataset.nativeDateTimeBound === 'true') return;

  input.dataset.nativeDateTimeBound = 'true';
  const syncInput = () => syncTripTimeInputConstraints(input);

  syncInput();
  input.addEventListener('focus', syncInput);
  input.addEventListener('click', syncInput);
}

export function initDatePickers(root = contractRefs.root) {
  try {
    const tripTimeInput =
      findContractInput('trip-time') ||
      root?.querySelector('input[name="trip-time"]');

    bindTripTimeInput(tripTimeInput);
  } catch (error) {
    console.error('Native date/time init failed', error);
  }
}
