import { fetchApi } from '../settings';

export const API_getContractPdf = async order => {
  const res = await fetchApi('/contracts/get-pdf', {
    method: 'POST',
    body: { order },
  });

  if (!res) return null;

  if (!res.ok) {
    let errorMessage = 'Не вдалося згенерувати PDF';

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
    const fileName = `dogovir-transferu-${order?.orderNumber}.pdf`;

    return { blob, fileName };
  }

  throw new Error('Сервер не повернув PDF-файл');
};
