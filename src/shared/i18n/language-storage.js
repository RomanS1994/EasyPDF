import { resolveLanguage } from './language.js';

export const LANGUAGE_STORAGE_KEY = 'pdf-app-language';

export function getStoredLanguage() {
  return resolveLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'uk');
}

export function setStoredLanguage(language) {
  const nextLanguage = resolveLanguage(language);
  localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  return nextLanguage;
}
