import { getContractPdf } from '../../contracts/api.js';
import { updateOrder } from '../../orders/api.js';
import { t } from '../../../shared/i18n/app.js';
import { downloadBlobFile, prepareDownloadTarget } from '../../../shared/lib/download.js';
import { notifyText } from '../../../shared/ui/toast.js';
import { withAppLoader } from '../../../shared/ui/loader.js';
import { refs as ordersRefs } from './refs.js';
import { refs as historyRefs } from '../history/refs.js';
import { state } from './state.js';
import { isAdminShell } from '../shell/shell.js';
import { formatDateTimeLabel, formatOrderStatusLabel } from '../../../shared/lib/formatters.js';

function getSelectedOrder() {
  const orderId = state.orderDetailOrderId;
  if (!orderId) return null;
  return state.orders.find(order => order.id === orderId) || null;
}

function getContractValue(order, path, fallback = '-') {
  return path.split('.').reduce((value, key) => value?.[key], order?.contractData) || fallback;
}

function formatLocation(value) {
  if (!value) return '-';
  if (typeof value === 'string') return value;
  return value.address || value.name || value.label || '-';
}

function formatDocumentTypeLabel(value) {
  if (value === 'offer') return t('pdf_document_offer');
  if (value === 'confirmation') return t('pdf_document_confirmation');
  return value || '-';
}

function setOrderDetailVisibility(isVisible) {
  if (!ordersRefs.orderDetailModal) return;

  ordersRefs.orderDetailModal.classList.toggle('is-open', isVisible);
  ordersRefs.orderDetailModal.setAttribute('aria-hidden', isVisible ? 'false' : 'true');

  if (isVisible) {
    ordersRefs.orderDetailModal.removeAttribute('hidden');
    document.body.classList.add('no-scroll');
  } else {
    ordersRefs.orderDetailModal.setAttribute('hidden', '');
    document.body.classList.remove('no-scroll');
  }
}

export function closeOrderDetail() {
  state.orderDetailOrderId = '';
  renderOrderDetail();
}

export function openOrderDetail(orderId) {
  if (!orderId) return;
  state.orderDetailOrderId = orderId;
  renderOrderDetail();
}

async function downloadOrderPdf(order, documentType) {
  if (!order) return;
  const downloadTarget = prepareDownloadTarget();

  await withAppLoader(async () => {
    try {
      const response = await getContractPdf(order.contractData || {}, {
        orderId: order.id,
        documentType,
      });

      if (!response?.blob) {
        throw new Error(t('pdf_generation_failed'));
      }

      downloadBlobFile(response.blob, response.fileName || t('pdf_fallback_name'), {
        targetWindow: downloadTarget,
      });

      void updateOrder(order.id, {
        status: 'pdf_generated',
        pdf: {
          fileName: response.fileName,
          documentType,
        },
        metadata: {
          documentType,
        },
      }, { keepalive: true }).catch(updateError => {
        console.error('Order update after PDF generation failed', updateError);
      });

      window.dispatchEvent(new CustomEvent('pdf-app:order-created'));
      notifyText(t('order_saved_pdf_downloaded'), 'success');
    } catch (error) {
      console.error('Order PDF generation failed', error);
      notifyText(error.message || t('pdf_download_failed'), 'error');
    }
  });
}

export function renderOrderDetail() {
  const order = getSelectedOrder();
  if (!ordersRefs.orderDetailModal) return;

  if (!order) {
    setOrderDetailVisibility(false);
    if (ordersRefs.orderDetailTitle) ordersRefs.orderDetailTitle.textContent = t('order_detail');
    return;
  }

  setOrderDetailVisibility(true);
  if (ordersRefs.orderDetailTitle) ordersRefs.orderDetailTitle.textContent = order.orderNumber || t('order_detail');
  if (ordersRefs.orderDetailNumber) ordersRefs.orderDetailNumber.textContent = order.orderNumber || '-';
  if (ordersRefs.orderDetailCustomer) {
    ordersRefs.orderDetailCustomer.textContent = order.customer?.name || order.customer?.email || t('client_not_specified');
  }
  if (ordersRefs.orderDetailCustomerEmail) ordersRefs.orderDetailCustomerEmail.textContent = order.customer?.email || '-';
  if (ordersRefs.orderDetailRoute) {
    const routeSeparator = isAdminShell() ? ' · ' : ' -> ';
    ordersRefs.orderDetailRoute.textContent = [formatLocation(order.trip?.from), formatLocation(order.trip?.to)]
      .filter(value => value && value !== '-')
      .join(routeSeparator) || t('route_not_added');
  }
  if (ordersRefs.orderDetailDate) ordersRefs.orderDetailDate.textContent = formatDateTimeLabel(order.createdAt);
  if (ordersRefs.orderDetailIssueDate) ordersRefs.orderDetailIssueDate.textContent = formatDateTimeLabel(order.contractData?.issueDate || order.contractData?.today || order.createdAt);
  if (ordersRefs.orderDetailStatus) ordersRefs.orderDetailStatus.textContent = formatOrderStatusLabel(order.status || '-');
  if (ordersRefs.orderDetailTotal) ordersRefs.orderDetailTotal.textContent = order.totalPrice || t('no_price');
  if (ordersRefs.orderDetailPdf) ordersRefs.orderDetailPdf.textContent = order.pdf?.fileName || order.pdf?.url || t('not_attached');
  if (ordersRefs.orderDetailDocumentType) {
    ordersRefs.orderDetailDocumentType.textContent = formatDocumentTypeLabel(
      order.pdf?.documentType || order.contractData?.documentType || 'confirmation',
    );
  }
  if (ordersRefs.orderDetailPickup) ordersRefs.orderDetailPickup.textContent = formatLocation(order.trip?.from);
  if (ordersRefs.orderDetailDropoff) ordersRefs.orderDetailDropoff.textContent = formatLocation(order.trip?.to);
  if (ordersRefs.orderDetailTripTime) ordersRefs.orderDetailTripTime.textContent = order.trip?.time || '-';
  if (ordersRefs.orderDetailPayment) ordersRefs.orderDetailPayment.textContent = order.trip?.paymentMethod || '-';
}

export function bindOrderDetailEvents() {
  ordersRefs.ordersList?.addEventListener('click', handleOrderListClick);
  historyRefs.statsHistoryList?.addEventListener('click', handleOrderListClick);
  ordersRefs.orderDetailBackdrop?.addEventListener('click', closeOrderDetail);
  ordersRefs.orderDetailCloseBtn?.addEventListener('click', closeOrderDetail);
  ordersRefs.orderDetailOfferBtn?.addEventListener('click', async () => {
    const order = getSelectedOrder();
    await downloadOrderPdf(order, 'offer');
  });
  ordersRefs.orderDetailConfirmationBtn?.addEventListener('click', async () => {
    const order = getSelectedOrder();
    await downloadOrderPdf(order, 'confirmation');
  });
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && ordersRefs.orderDetailModal?.classList.contains('is-open')) {
      closeOrderDetail();
    }
  });
}

export function handleOrderListClick(event) {
  const button = event.target.closest('[data-order-open]');
  if (!button) return;

  const orderId = button.dataset.orderOpen || button.closest('[data-order-id]')?.dataset.orderId || '';
  if (!orderId) return;

  openOrderDetail(orderId);
}
