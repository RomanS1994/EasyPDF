import { cs } from './dictionaries/cs.js';
import { en } from './dictionaries/en.js';
import { uk } from './dictionaries/uk.js';
import { DEFAULT_LANGUAGE, resolveLanguage } from './language.js';
import { getCurrentLanguage } from './detect-language.js';

export const translations = {
  uk,
  en,
  cs,
};

export function formatMessage(template, params = {}) {
  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replaceAll('{' + key + '}', String(value ?? ''));
  }, template);
}

export function t(key, params = {}, language = getCurrentLanguage()) {
  const nextLanguage = resolveLanguage(language);
  const template =
    translations[nextLanguage]?.[key] ??
    translations[DEFAULT_LANGUAGE]?.[key] ??
    key;

  return params && typeof template === "string"
    ? formatMessage(template, params)
    : template;
}
