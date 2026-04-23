import { getContractPdf } from './api.js';
import { createOrder, updateOrder } from '../orders/api.js';
import { getCurrentContractData } from './index.js';
import { t } from '../../shared/i18n/app.js';
import { downloadBlobFile, prepareDownloadTarget } from '../../shared/lib/download.js';
import { notifyText } from '../../shared/ui/toast.js';
import { getStoredSession } from '../auth/session.js';
import { withAppLoader } from '../../shared/ui/loader.js';
import { syncContractActionState, validateContractForm } from './validation.js';
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
import { getShellRouteConfig, navigateToTab } from '../auth/panel/routes.js';

let reserveInFlight = false;
let generationInFlight = false;

function hasAuthenticatedSession() {
  return Boolean(getStoredSession()?.token);
}

function buildGenerationSessionPayload(order, contractData, documentType) {
  const generationWindowMs = getGenerationWindowMs();

  return {
    accessGranted: true,
    orderId: order.id,
    orderNumber: order.orderNumber || contractData.orderNumber || '',
    documentType,
    contractData,
    createdAt: order.createdAt || new Date().toISOString(),
    expiresAt: new Date(Date.now() + generationWindowMs).toISOString(),
  };
}

function buildSessionSnapshot(session, order, contractData, documentType) {
  return {
    accessGranted: true,
    orderId: order?.id || session?.orderId || '',
    orderNumber:
      order?.orderNumber ||
      session?.orderNumber ||
      contractData.orderNumber ||
      '',
    documentType: documentType || session?.documentType || 'confirmation',
    contractData,
    createdAt: session?.createdAt || order?.createdAt || new Date().toISOString(),
    expiresAt:
      session?.expiresAt || new Date(Date.now() + getGenerationWindowMs()).toISOString(),
  };
}

async function createPendingGenerationOrder(contractData, documentType) {
  const created = await createOrder({
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

  const order = created?.order || null;
  if (!order?.id) {
    throw new Error(t('api_create_order_failed'));
  }

  return order;
}

async function persistSavedOrder(session, contractData, documentType) {
  if (session?.orderId) {
    const updated = await updateOrder(session.orderId, {
      status: 'created',
      totalPrice: contractData.totalPrice,
      contractData,
      metadata: {
        documentType,
        generationMode: 'token',
      },
    });

    return updated?.order || {
      id: session.orderId,
      orderNumber: session.orderNumber || contractData.orderNumber || '',
      createdAt: session.createdAt,
    };
  }

  const created = await createOrder({
    contractData,
    status: 'created',
    metadata: {
      sourcePage: 'cz/pdf',
      documentType,
      generationMode: session ? 'token' : 'manual',
    },
  });

  const order = created?.order || null;
  if (!order?.id) {
    throw new Error(t('api_create_order_failed'));
  }

  return order;
}

async function reserveGenerationOrder() {
  if (reserveInFlight) return;

  if (!validateContractForm({ report: false })) {
    closeGenerationGate();
    validateContractForm({ report: true });
    syncContractActionState();
    return;
  }

  reserveInFlight = true;
  setGenerationGateBusy(true);

  const contractData = structuredClone(getCurrentContractData());
  const documentType = contractData.documentType || 'confirmation';

  try {
    const order = await withAppLoader(async () => createPendingGenerationOrder(contractData, documentType));

    closeGenerationGate();
    openGenerationSession(buildGenerationSessionPayload(order, contractData, documentType));
    navigateToTab('orders', getShellRouteConfig().orders);
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

  if (!validateContractForm({ report: true })) {
    return;
  }

  generationInFlight = true;
  const downloadTarget = prepareDownloadTarget();
  const contractData = structuredClone(getCurrentContractData());
  const documentType = contractData.documentType || session.documentType || 'confirmation';
  let orderId = session.orderId || '';

  try {
    await withAppLoader(async () => {
      if (!orderId) {
        const order = await createPendingGenerationOrder(contractData, documentType);
        orderId = order.id;
        openGenerationSession(buildGenerationSessionPayload(order, contractData, documentType));
      }

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
        void updateOrder(
          orderId,
          {
            status: 'pdf_generated',
            totalPrice: contractData.totalPrice,
            contractData,
            pdf: {
              fileName: response.fileName,
              documentType,
            },
            metadata: {
              documentType,
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

    if (orderId) {
      try {
        await updateOrder(
          orderId,
          {
            status: 'pdf_failed',
            totalPrice: contractData.totalPrice,
            contractData,
            metadata: {
              pdfError: error.message,
              documentType,
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

  window.addEventListener('pdf-app:token-gate-confirmed', event => {
    if (event.detail?.intent !== 'order-reserve') {
      return;
    }

    void reserveGenerationOrder();
  });

  window.addEventListener('pdf-app:generation-session-expired', () => {
    notifyText(t('generation_session_expired'), 'error');
    syncContractActionState();
  });

  window.addEventListener('pdf-app:generation-session-changed', () => {
    syncContractActionState();
  });

  window.addEventListener('pdf-app:order-created', () => {
    syncContractActionState();
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

    if (!validateContractForm({ report: true })) {
      return;
    }

    const contractData = structuredClone(getCurrentContractData());
    const documentType = contractData.documentType || 'confirmation';
    const session = getGenerationSession();

    await withAppLoader(async () => {
      try {
        const order = await persistSavedOrder(session, contractData, documentType);

        if (session) {
          openGenerationSession(buildSessionSnapshot(session, order, contractData, documentType));
        }

        notifyText(t('order_saved'), 'success');
        window.dispatchEvent(new CustomEvent('pdf-app:order-created'));
      } catch (error) {
        console.error('Save order failed', error);
        notifyText(
          error.message || (session ? t('api_update_order_failed') : t('api_create_order_failed')),
          'error',
        );
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

    if (!validateContractForm({ report: true })) {
      return;
    }

    openGenerationGate();
  });

  syncContractActionState();
}
