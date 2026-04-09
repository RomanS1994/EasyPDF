import { fetchApi } from '../settings';
import { t } from '../../js/i18n/app.js';

export const API_getContractPdf = async order => {
  const res = await fetchApi('/contracts/get-pdf', {
    method: 'POST',
    body: { order },
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
    const fileName = t('pdf_file_name', {
      orderNumber: order?.orderNumber || 'order',
    });

    return { blob, fileName };
  }

  throw new Error(t('api_contract_pdf_missing'));
};
