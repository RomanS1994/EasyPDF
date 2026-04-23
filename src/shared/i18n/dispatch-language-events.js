export function dispatchLanguageChangedEvent(language) {
  window.dispatchEvent(
    new CustomEvent('pdf-app:language-changed', {
      detail: { language },
    }),
  );
}
