export function normalizeTripTime(value) {
  if (!value) return '';

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    return value.replace('T', ' ');
  }

  return value;
}
