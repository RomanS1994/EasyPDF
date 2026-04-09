import { API_getContractPdf } from '../../../../api/contract/API_getContractPdf.js';
import { API_createOrder, API_updateOrder } from '../../../../api/orders/API_orders.js';
import { hasAuthenticatedSession } from '../../auth/authPanel.js';
import { contractData } from '../generateContract';
import { notifyText } from '../../../toastify.js';

const loader = document.getElementById('loaderOverlay');

const showLoader = () => loader?.classList.add('is-active');
const hideLoader = () => loader?.classList.remove('is-active');

const downloadPdfBtn = document.getElementById('downloadPdfBtn');

downloadPdfBtn?.addEventListener('click', async () => {
  if (!hasAuthenticatedSession()) {
    notifyText(
      'Увійдіть або створіть акаунт перед генерацією збереженого замовлення.',
      'error'
    );
    document.getElementById('accountHub')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    return;
  }

  showLoader();
  let orderId = '';

  try {
    const created = await API_createOrder({
      contractData,
      status: 'pending_pdf',
      metadata: {
        sourcePage: 'cz/pdf',
      },
    });

    orderId = created.order?.id || '';

    const response = await API_getContractPdf(contractData);
    if (!response?.blob) {
      throw new Error('Не вдалося згенерувати PDF-файл.');
    }

    const blobUrl = URL.createObjectURL(response.blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = response.fileName || 'dogovir-transferu.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);

    if (orderId) {
      await API_updateOrder(orderId, {
        status: 'pdf_generated',
        pdfFileName: response.fileName,
      });
    }

    notifyText('Замовлення збережено, PDF завантажено.', 'success');
    window.dispatchEvent(new CustomEvent('pdf-app:order-created'));
  } catch (error) {
    console.error('Download PDF failed', error);

    if (orderId) {
      try {
        await API_updateOrder(orderId, {
          status: 'pdf_failed',
          metadata: {
            pdfError: error.message,
          },
        });
      } catch (updateError) {
        console.error('Order update after PDF failure failed', updateError);
      }
    }

    notifyText(error.message || 'Не вдалося завантажити PDF.', 'error');
  } finally {
    hideLoader();
  }
});
