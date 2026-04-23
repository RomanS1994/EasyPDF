import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

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
