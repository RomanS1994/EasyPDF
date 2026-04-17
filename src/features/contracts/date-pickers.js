import { findContractInput, contractRefs } from './selectors.js';

export async function initDatePickers() {
  try {
    const flatpickr = (await import('flatpickr')).default;

    contractRefs.root?.querySelectorAll('input.today[type="date"]').forEach(input => {
      flatpickr(input, {
        dateFormat: 'Y-m-d',
        allowInput: true,
      });
    });

    const tripTimeInput = findContractInput('trip-time');
    if (tripTimeInput) {
      flatpickr(tripTimeInput, {
        enableTime: true,
        time_24hr: true,
        dateFormat: 'Y-m-d H:i',
        allowInput: true,
      });
    }
  } catch (error) {
    console.error('Flatpickr init failed', error);
  }
}
