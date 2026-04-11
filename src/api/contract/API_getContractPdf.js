import { fetchApi } from '../settings';
import { getCurrentLanguage, t } from '../../js/i18n/app.js';

function extractFileName(contentDisposition = '') {
  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {
      return utfMatch[1];
    }
  }

  const plainMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return plainMatch?.[1] || '';
}

export const API_getContractPdf = async (
  order,
  {
    orderId = '',
    documentType = order?.documentType || 'confirmation',
    language = getCurrentLanguage(),
  } = {}
) => {
  const res = await fetchApi('/contracts/get-pdf', {
    method: 'POST',
    body: {
      order,
      orderId,
      documentType,
      language,
    },
  });

  if (!res) return null;

  if (!res.ok) {
    let errorMessage = t('api_contract_pdf_failed');

    try {
      const payload = await res.json();
      errorMessage = payload?.error || errorMessage;
    } catch {
      // Ignore JSON parse errors and keep the fallback message.
    }

    const error = new Error(errorMessage);
    error.status = res.status;
    throw error;
  }

  const contentType = res.headers.get('Content-Type') || '';
  if (contentType.includes('application/pdf')) {
    const blob = await res.blob();
    const fileName =
      extractFileName(res.headers.get('Content-Disposition') || '') ||
      t('pdf_file_name', {
        orderNumber: order?.orderNumber || 'order',
      });

    return { blob, fileName };
  }

  throw new Error(t('api_contract_pdf_missing'));
};
