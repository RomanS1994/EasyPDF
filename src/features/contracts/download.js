import { getContractPdf } from './api.js';
import { createOrder, updateOrder } from '../orders/api.js';
import { getCurrentContractData } from './index.js';
import { t } from '../../shared/i18n/app.js';
import { hideAppLoader, showAppLoader } from '../../shared/ui/loader.js';
import { notifyText } from '../../shared/ui/toast.js';
import { getStoredSession } from '../auth/session.js';

function hasAuthenticatedSession() {
  return Boolean(getStoredSession()?.token);
}

export function initContractDownload() {
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  if (!downloadPdfBtn) return;

  downloadPdfBtn.addEventListener('click', async () => {
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
    const contractData = getCurrentContractData();
    const documentType = contractData.documentType || 'confirmation';

    try {
      const created = await createOrder({
        contractData,
        status: 'pending_pdf',
        metadata: {
          sourcePage: 'cz/pdf',
          documentType,
        },
      });

      orderId = created.order?.id || '';

      const response = await getContractPdf(contractData, {
        orderId,
        documentType,
      });

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
        await updateOrder(orderId, {
          status: 'pdf_generated',
          pdf: {
            fileName: response.fileName,
            documentType,
          },
        });
      }

      notifyText(t('order_saved_pdf_downloaded'), 'success');
      window.dispatchEvent(new CustomEvent('pdf-app:order-created'));
    } catch (error) {
      console.error('Download PDF failed', error);

      if (orderId) {
        try {
          await updateOrder(orderId, {
            status: 'pdf_failed',
            metadata: {
              pdfError: error.message,
              documentType,
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
}
