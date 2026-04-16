export function readStorageJson(key, fallback = null) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

export function writeStorageJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function mergeStorageJson(key, value) {
  const current = readStorageJson(key, {});
  const nextValue = {
    ...(current && typeof current === 'object' ? current : {}),
    ...(value && typeof value === 'object' ? value : {}),
  };

  writeStorageJson(key, nextValue);
  return nextValue;
}

export function removeStorageItem(key) {
  localStorage.removeItem(key);
}
