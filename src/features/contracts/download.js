import { getContractPdf } from './api.js';
import { createOrder, updateOrder } from '../orders/api.js';
import { getCurrentContractData } from './index.js';
import { t } from '../../shared/i18n/app.js';
import { downloadBlobFile, prepareDownloadTarget } from '../../shared/lib/download.js';
import { notifyText } from '../../shared/ui/toast.js';
import { getStoredSession } from '../auth/session.js';
import { withAppLoader } from '../../shared/ui/loader.js';

function hasAuthenticatedSession() {
  return Boolean(getStoredSession()?.token);
}

export function initContractDownload() {
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const saveOrderBtn = document.getElementById('saveOrderBtn');
  if (!downloadPdfBtn && !saveOrderBtn) return;

  saveOrderBtn?.addEventListener('click', async () => {
    if (!hasAuthenticatedSession()) {
      notifyText(t('auth_required_before_order'), 'error');
      document.getElementById('accountHub')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      return;
    }

    const contractData = getCurrentContractData();
    const documentType = 'confirmation';

    await withAppLoader(async () => {
      try {
        await createOrder({
          contractData,
          status: 'created',
          metadata: {
            sourcePage: 'cz/pdf',
            documentType,
          },
        });

        notifyText(t('order_created'), 'success');
        window.dispatchEvent(new CustomEvent('pdf-app:order-created'));
      } catch (error) {
        console.error('Save order failed', error);
        notifyText(error.message || t('api_create_order_failed'), 'error');
      }
    });
  });

  downloadPdfBtn.addEventListener('click', async () => {
    if (!hasAuthenticatedSession()) {
      notifyText(t('auth_required_before_pdf'), 'error');
      document.getElementById('accountHub')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      return;
    }

    let orderId = '';
    const contractData = getCurrentContractData();
    const documentType = contractData.documentType || 'confirmation';
    const downloadTarget = prepareDownloadTarget();

    await withAppLoader(async () => {
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

        downloadBlobFile(response.blob, response.fileName || t('pdf_fallback_name'), {
          targetWindow: downloadTarget,
        });

        if (orderId) {
          void updateOrder(orderId, {
            status: 'pdf_generated',
            pdf: {
              fileName: response.fileName,
              documentType,
            },
          }, { keepalive: true }).catch(updateError => {
            console.error('Order update after PDF generation failed', updateError);
          });
        }

        notifyText(t('order_saved_pdf_downloaded'), 'success');
        window.dispatchEvent(new CustomEvent('pdf-app:order-created', {
          detail: { refresh: false },
        }));
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
            }, { keepalive: true });
          } catch (updateError) {
            console.error('Order update after PDF failure failed', updateError);
          }
        }

        notifyText(error.message || t('pdf_download_failed'), 'error');
      }
    });
  });
}
