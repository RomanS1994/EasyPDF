import { getMessage } from '../i18n/messages.js';
import { readStoredLanguage } from '../i18n/languageStorage.js';

function readErrorText(error) {
  if (!error) {
    return '';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object') {
    const data = error.data;
    if (typeof data === 'string') {
      return data;
    }

    if (data && typeof data === 'object') {
      if (typeof data.error === 'string') {
        return data.error;
      }

      if (typeof data.message === 'string') {
        return data.message;
      }

      if (Array.isArray(data.details) && data.details.length) {
        return data.details.filter(Boolean).join(', ');
      }
    }

    if (typeof error.error === 'string') {
      return error.error;
    }
  }

  return '';
}

export function getApiErrorMessage(error, fallbackKey = 'common.failedToLoad') {
  const language = readStoredLanguage();
  const fallback = getMessage(language, fallbackKey);
  const detail = readErrorText(error);

  if (detail) {
    return detail;
  }

  if (error && typeof error === 'object') {
    if (error.status === 'FETCH_ERROR') {
      return getMessage(language, 'common.failedToConnect');
    }

    if (error.status === 'TIMEOUT_ERROR') {
      return getMessage(language, 'common.requestTimedOut');
    }

    if (error.status === 'PARSING_ERROR') {
      return getMessage(language, 'common.invalidServerResponse');
    }
  }

  return fallback;
}
