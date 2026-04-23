import { getContractPdf } from './api.js';
import { createOrder, updateOrder } from '../orders/api.js';
import { getCurrentContractData } from './index.js';
import { t } from '../../shared/i18n/app.js';
import { downloadBlobFile, prepareDownloadTarget } from '../../shared/lib/download.js';
import { notifyText } from '../../shared/ui/toast.js';
import { getStoredSession } from '../../shared/lib/session-storage.js';
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
import { getShellRouteConfig, navigateToTab } from '../auth/shell/routes.js';

let reserveInFlight = false;
let generationInFlight = false;
const DEFAULT_DOCUMENT_TYPE = 'confirmation';

function requireAuthenticated(messageKey) {
  if (getStoredSession()?.token) {
    return true;
  }

  notifyText(t(messageKey), 'error');
  document.getElementById('accountHub')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
  return false;
}

function emitOrderCreated() {
  window.dispatchEvent(new CustomEvent('pdf-app:order-created'));
}

function getErrorMessage(error, fallbackKey) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return t(fallbackKey);
}

function getCurrentContractSnapshot(fallbackDocumentType = DEFAULT_DOCUMENT_TYPE) {
  const contractData = structuredClone(getCurrentContractData());

  return {
    contractData,
    documentType: contractData.documentType || fallbackDocumentType,
  };
}

function buildGenerationSessionPayload(session, order, contractData, documentType = DEFAULT_DOCUMENT_TYPE) {
  return {
    accessGranted: true,
    orderId: String(order?.id || session?.orderId || ''),
    orderNumber:
      String(order?.orderNumber || session?.orderNumber || contractData.orderNumber || ''),
    documentType: documentType || session?.documentType || DEFAULT_DOCUMENT_TYPE,
    contractData,
    createdAt: String(session?.createdAt || order?.createdAt || new Date().toISOString()),
    expiresAt:
      session?.expiresAt || new Date(Date.now() + getGenerationWindowMs()).toISOString(),
  };
}

function getCreatedOrderOrThrow(result) {
  const order = result?.order || null;
  if (!order?.id) {
    throw new Error(t('api_create_order_failed'));
  }

  return order;
}

function updateTokenOrderStatus(
  orderId,
  status,
  contractData,
  documentType,
  { pdf = null, pdfError = '' } = {},
  errorLabel,
) {
  return updateOrder(
    orderId,
    {
      status,
      totalPrice: contractData.totalPrice,
      contractData,
      metadata: {
        documentType,
        generationMode: 'token',
        ...(pdfError ? { pdfError } : {}),
      },
      ...(pdf ? { pdf } : {}),
    },
    { keepalive: true },
  ).catch(error => {
    console.error(errorLabel, error);
  });
}

async function createPendingGenerationOrder(contractData, documentType) {
  return getCreatedOrderOrThrow(await createOrder({
    contractData,
    status: 'pending_pdf',
    metadata: {
      sourcePage: 'cz/pdf',
      documentType,
      generationMode: 'token',
      tokenCost: 1,
      generationWindowMs: getGenerationWindowMs(),
    },
  }));
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

  return getCreatedOrderOrThrow(await createOrder({
    contractData,
    status: 'created',
    metadata: {
      sourcePage: 'cz/pdf',
      documentType,
      generationMode: session ? 'token' : 'manual',
    },
  }));
}

async function reserveGenerationOrder() {
  if (reserveInFlight) return;

  if (!validateContractForm({ report: false })) {
    closeGenerationGate();
    validateContractForm({ report: true });
    return;
  }

  reserveInFlight = true;
  setGenerationGateBusy(true);
  const { contractData, documentType } = getCurrentContractSnapshot();

  try {
    const order = await withAppLoader(async () => createPendingGenerationOrder(contractData, documentType));

    closeGenerationGate();
    openGenerationSession(buildGenerationSessionPayload(null, order, contractData, documentType));
    navigateToTab('orders', getShellRouteConfig().orders);
    notifyText(
      t('generation_token_reserved', {
        orderNumber: order.orderNumber || contractData.orderNumber || '',
      }),
      'success',
    );
    emitOrderCreated();
  } catch (error) {
    console.error('Reserve generation order failed', error);
    notifyText(getErrorMessage(error, 'api_create_order_failed'), 'error');
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

  if (!requireAuthenticated('auth_required_before_pdf')) {
    return;
  }

  if (!validateContractForm({ report: true })) {
    return;
  }

  generationInFlight = true;
  const downloadTarget = prepareDownloadTarget();
  const { contractData, documentType } = getCurrentContractSnapshot(
    session.documentType || DEFAULT_DOCUMENT_TYPE,
  );
  let orderId = session.orderId || '';

  try {
    await withAppLoader(async () => {
      if (!orderId) {
        const order = await createPendingGenerationOrder(contractData, documentType);
        orderId = order.id;
        openGenerationSession(buildGenerationSessionPayload(null, order, contractData, documentType));
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
        void updateTokenOrderStatus(
          orderId,
          'pdf_generated',
          contractData,
          documentType,
          {
            pdf: {
              fileName: response.fileName,
              documentType,
            },
          },
          'Order update after token generation failed',
        );
      }

      clearGenerationSession();
      notifyText(t('generation_token_completed'), 'success');
      emitOrderCreated();
    });
  } catch (error) {
    console.error('Token generation failed', error);

    if (orderId) {
      await updateTokenOrderStatus(
        orderId,
        'pdf_failed',
        contractData,
        documentType,
        {
          pdfError: getErrorMessage(error, 'pdf_download_failed'),
        },
        'Order update after token generation failure failed',
      );
    }

    notifyText(getErrorMessage(error, 'pdf_download_failed'), 'error');
  } finally {
    generationInFlight = false;
  }
}

export function initContractDownload() {
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const saveOrderBtn = document.getElementById('saveOrderBtn');
  if (!downloadPdfBtn && !saveOrderBtn) return;

  window.addEventListener('pdf-app:token-gate-confirmed', event => {
    if (event.detail?.intent === 'order-reserve') {
      void reserveGenerationOrder();
    }
  });
  window.addEventListener('pdf-app:generation-session-expired', () => {
    notifyText(t('generation_session_expired'), 'error');
    syncContractActionState();
  });
  window.addEventListener('pdf-app:generation-session-changed', syncContractActionState);
  saveOrderBtn?.addEventListener('click', async () => {
    if (!validateContractForm({ report: true }) || !requireAuthenticated('auth_required_before_order')) {
      return;
    }

    const session = getGenerationSession();
    const { contractData, documentType } = getCurrentContractSnapshot();

    await withAppLoader(async () => {
      try {
        const order = await persistSavedOrder(session, contractData, documentType);

        if (session) {
          openGenerationSession(
            buildGenerationSessionPayload(session, order, contractData, documentType),
          );
        }

        notifyText(t('order_saved'), 'success');
        emitOrderCreated();
      } catch (error) {
        console.error('Save order failed', error);
        notifyText(
          getErrorMessage(
            error,
            session ? 'api_update_order_failed' : 'api_create_order_failed',
          ),
          'error',
        );
      }
    });
  });
  downloadPdfBtn?.addEventListener('click', () => {
    if (!validateContractForm({ report: true }) || !requireAuthenticated('auth_required_before_pdf')) {
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

  syncContractActionState();
}
