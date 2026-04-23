import { getCurrentLanguage } from './detect-language.js';
import { getPageMetaKey, PAGE_META } from './page-meta.js';
import { t } from './translations.js';

export function applyTextTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.dataset.i18n;
    if (!key) return;
    element.textContent = t(key);
  });

  root.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.dataset.i18nPlaceholder;
    if (!key) return;
    element.setAttribute('placeholder', t(key));
  });

  root.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.dataset.i18nTitle;
    if (!key) return;
    element.setAttribute('title', t(key));
  });

  root.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
    const key = element.dataset.i18nAriaLabel;
    if (!key) return;
    element.setAttribute('aria-label', t(key));
  });
}

function applyPageMeta(language = getCurrentLanguage()) {
  const metaKey = getPageMetaKey();
  const meta = metaKey ? PAGE_META[metaKey] : null;
  if (!meta) return;

  document.title = meta.title?.[language] || meta.title?.['uk'] || document.title;

  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.setAttribute(
      'content',
      meta.description?.[language] ||
        meta.description?.['uk'] ||
        description.getAttribute('content') ||
        ''
    );
  }
}

export function syncPageMeta(language = getCurrentLanguage()) {
  applyPageMeta(language);
}
