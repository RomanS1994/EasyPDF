import { getContractPdf } from './api.js';
import { createOrder, updateOrder } from '../orders/api.js';
import { getCurrentContractData } from './index.js';
import { t } from '../../shared/i18n/app.js';
import { downloadBlobFile, prepareDownloadTarget } from '../../shared/lib/download.js';
import { notifyText } from '../../shared/ui/toast.js';
import { getStoredSession } from '../auth/session.js';
import { withAppLoader } from '../../shared/ui/loader.js';
import {
  clearGenerationSession,
  closeGenerationGate,
  getGenerationSession,
  getGenerationWindowMs,
  hasGenerationSession,
  isGenerationSessionExpired,
  markGenerationSessionExpired,
  openGenerationGate,
  openGenerationSession,
  resetGenerationGateSwipe,
  setGenerationGateBusy,
} from './generation-session.js';

let reserveInFlight = false;
let generationInFlight = false;

function hasAuthenticatedSession() {
  return Boolean(getStoredSession()?.token);
}

function buildGenerationSessionPayload(order, contractData, documentType) {
  const generationWindowMs = getGenerationWindowMs();

  return {
    orderId: order.id,
    orderNumber: order.orderNumber || contractData.orderNumber || '',
    documentType,
    contractData,
    createdAt: order.createdAt || new Date().toISOString(),
    expiresAt: new Date(Date.now() + generationWindowMs).toISOString(),
  };
}

async function reserveGenerationOrder() {
  if (reserveInFlight) return;

  reserveInFlight = true;
  setGenerationGateBusy(true);

  const contractData = structuredClone(getCurrentContractData());
  const documentType = contractData.documentType || 'confirmation';

  try {
    const created = await withAppLoader(async () => {
      return createOrder({
        contractData,
        status: 'pending_pdf',
        metadata: {
          sourcePage: 'cz/pdf',
          documentType,
          generationMode: 'token',
          tokenCost: 1,
          generationWindowMs: getGenerationWindowMs(),
        },
      });
    });

    const order = created?.order || null;
    if (!order?.id) {
      throw new Error(t('api_create_order_failed'));
    }

    closeGenerationGate();
    openGenerationSession(buildGenerationSessionPayload(order, contractData, documentType));
    notifyText(
      t('generation_token_reserved', {
        orderNumber: order.orderNumber || contractData.orderNumber || '',
      }),
      'success',
    );
    window.dispatchEvent(new CustomEvent('pdf-app:order-created'));
  } catch (error) {
    console.error('Reserve generation order failed', error);
    notifyText(error.message || t('api_create_order_failed'), 'error');
    setGenerationGateBusy(false);
    resetGenerationGateSwipe();
  } finally {
    reserveInFlight = false;
  }
}

async function generateReservedOrderPdf() {
  if (generationInFlight) return;

  const session = getGenerationSession();
  if (!session) {
    if (isGenerationSessionExpired()) {
      markGenerationSessionExpired();
    }
    return;
  }

  if (!hasAuthenticatedSession()) {
    notifyText(t('auth_required_before_pdf'), 'error');
    document.getElementById('accountHub')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    return;
  }

  generationInFlight = true;
  const downloadTarget = prepareDownloadTarget();

  try {
    await withAppLoader(async () => {
      const response = await getContractPdf(session.contractData || {}, {
        orderId: session.orderId,
        documentType: session.documentType || 'confirmation',
      });

      if (!response?.blob) {
        throw new Error(t('pdf_generation_failed'));
      }

      downloadBlobFile(response.blob, response.fileName || t('pdf_fallback_name'), {
        targetWindow: downloadTarget,
      });

      if (session.orderId) {
        void updateOrder(
          session.orderId,
          {
            status: 'pdf_generated',
            pdf: {
              fileName: response.fileName,
              documentType: session.documentType || 'confirmation',
            },
            metadata: {
              documentType: session.documentType || 'confirmation',
              generationMode: 'token',
            },
          },
          { keepalive: true },
        ).catch(updateError => {
          console.error('Order update after token generation failed', updateError);
        });
      }

      clearGenerationSession();
      notifyText(t('generation_token_completed'), 'success');
      window.dispatchEvent(new CustomEvent('pdf-app:order-created'));
    });
  } catch (error) {
    console.error('Token generation failed', error);

    if (session.orderId) {
      try {
        await updateOrder(
          session.orderId,
          {
            status: 'pdf_failed',
            metadata: {
              pdfError: error.message,
              documentType: session.documentType || 'confirmation',
              generationMode: 'token',
            },
          },
          { keepalive: true },
        );
      } catch (updateError) {
        console.error('Order update after token generation failure failed', updateError);
      }
    }

    notifyText(error.message || t('pdf_download_failed'), 'error');
  } finally {
    generationInFlight = false;
  }
}

export function initContractDownload() {
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const saveOrderBtn = document.getElementById('saveOrderBtn');
  if (!downloadPdfBtn && !saveOrderBtn) return;

  window.addEventListener('pdf-app:token-gate-confirmed', () => {
    void reserveGenerationOrder();
  });

  window.addEventListener('pdf-app:generation-session-generate', () => {
    void generateReservedOrderPdf();
  });

  window.addEventListener('pdf-app:generation-session-expired', () => {
    notifyText(t('generation_session_expired'), 'error');
  });

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

  downloadPdfBtn?.addEventListener('click', () => {
    if (!hasAuthenticatedSession()) {
      notifyText(t('auth_required_before_pdf'), 'error');
      document.getElementById('accountHub')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      return;
    }

    if (isGenerationSessionExpired()) {
      markGenerationSessionExpired();
      return;
    }

    if (hasGenerationSession()) {
      void generateReservedOrderPdf();
      return;
    }

    openGenerationGate();
  });
}
