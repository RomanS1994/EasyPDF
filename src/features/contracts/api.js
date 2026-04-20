import { fetchApi } from '../../shared/api/client.js';
import { t } from '../../shared/i18n/app.js';

export async function getContractPdf(contractData, { orderId, documentType } = {}) {
  const response = await fetchApi('/contracts/get-pdf', {
    method: 'POST',
    body: {
      orderId,
      documentType,
      contractData,
      language: document.documentElement.lang || 'uk',
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const error = new Error(payload?.error || t('pdf_generation_failed'));
    error.status = response.status;
    throw error;
  }

  return {
    blob: await response.blob(),
    fileName: response.headers.get('Content-Disposition')?.match(/filename=\"?([^"]+)\"?/)?.[1],
  };
}
