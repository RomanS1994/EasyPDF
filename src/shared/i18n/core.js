import { applyTextTranslations, syncPageMeta } from './apply-translations.js';
import { dispatchLanguageChangedEvent } from './dispatch-language-events.js';
import { getCurrentLanguage, getCurrentLocale } from './detect-language.js';
import { resolveLanguage } from './language.js';
import { getStoredLanguage, setStoredLanguage } from './language-storage.js';
import { formatMessage, t, translations } from './translations.js';

export { translations, formatMessage, t };
export { getCurrentLanguage, getCurrentLocale };
export { getStoredLanguage, setStoredLanguage };
export { syncPageMeta };

export function applyLanguage(language = getStoredLanguage(), { persist = true } = {}) {
  const nextLanguage = persist ? setStoredLanguage(language) : resolveLanguage(language);

  document.documentElement.lang = nextLanguage;
  applyTextTranslations(document);
  syncPageMeta(nextLanguage);
  dispatchLanguageChangedEvent(nextLanguage);

  return nextLanguage;
}

export function initLanguage() {
  const language = getStoredLanguage();
  document.documentElement.lang = language;
  applyTextTranslations(document);
  syncPageMeta(language);
  return language;
}
