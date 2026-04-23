import { DEFAULT_LANGUAGE, resolveLanguage } from './language.js';
import { getStoredLanguage } from './language-storage.js';

const LANGUAGE_LOCALES = {
  uk: 'uk-UA',
  en: 'en-GB',
  cs: 'cs-CZ',
};

export function getCurrentLanguage() {
  return resolveLanguage(document.documentElement.lang || getStoredLanguage());
}

export function getCurrentLocale() {
  const language = getCurrentLanguage();
  return LANGUAGE_LOCALES[language] || LANGUAGE_LOCALES[DEFAULT_LANGUAGE];
}
