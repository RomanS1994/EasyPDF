import { API_getContractPdf } from '../../../../api/contract/API_getContractPdf.js';
import { API_createOrder, API_updateOrder } from '../../../../api/orders/API_orders.js';
import { hasAuthenticatedSession } from '../../auth/authPanel.js';
import { contractData } from '../generateContract';
import { t } from '../../../i18n/app.js';
import { hideAppLoader, showAppLoader } from '../../../loaderOverlay.js';
import { notifyText } from '../../../toastify.js';

const downloadPdfBtn = document.getElementById('downloadPdfBtn');

downloadPdfBtn?.addEventListener('click', async () => {
  if (!hasAuthenticatedSession()) {
    notifyText(t('auth_required_before_pdf'), 'error');
    document.getElementById('accountHub')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    return;
  }

  showAppLoader('generating_pdf');
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
      throw new Error(t('pdf_generation_failed'));
    }

    const blobUrl = URL.createObjectURL(response.blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = response.fileName || t('pdf_fallback_name');
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

    notifyText(t('order_saved_pdf_downloaded'), 'success');
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

    notifyText(error.message || t('pdf_download_failed'), 'error');
  } finally {
    hideAppLoader();
  }
});
