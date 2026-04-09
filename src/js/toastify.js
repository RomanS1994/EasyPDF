import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import { messages } from './i18n/message.js';

export function notify(key, type = 'info') {
  const lang = document.documentElement.lang || 'uk';
  const text = messages[lang][key] || messages.en[key] || key;

  return notifyText(text, type);
}

export function notifyText(text, type = 'info') {
  Toastify({
    text,
    duration: 4000,
    close: true,
    gravity: 'top',
    position: 'right',
    className: `toast-${type}`,
  }).showToast();
}
