export const DEFAULT_LANGUAGE = 'uk';
export const SUPPORTED_LANGUAGES = ['uk', 'en', 'cs'];

export function resolveLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value) ? value : DEFAULT_LANGUAGE;
}
