import { getContractPdf } from '../../contracts/api.js';
import { updateOrder } from '../../orders/api.js';
import { getCurrentLocale, t } from '../../../shared/i18n/app.js';
import { notifyText } from '../../../shared/ui/toast.js';
import { withAppLoader } from '../../../shared/ui/loader.js';
import { refs } from './refs.js';
import { state } from './state.js';
import { isAdminShell } from './shell.js';
import { formatDateTimeLabel, formatOrderStatusLabel, titleCase } from './formatters.js';

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
  if (!refs.orderDetailModal) return;

  refs.orderDetailModal.classList.toggle('is-open', isVisible);
  refs.orderDetailModal.setAttribute('aria-hidden', isVisible ? 'false' : 'true');

  if (isVisible) {
    refs.orderDetailModal.removeAttribute('hidden');
    document.body.classList.add('no-scroll');
  } else {
    refs.orderDetailModal.setAttribute('hidden', '');
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

  await withAppLoader(async () => {
    try {
      const response = await getContractPdf(order.contractData || {}, {
        orderId: order.id,
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

      await updateOrder(order.id, {
        status: 'pdf_generated',
        pdf: {
          fileName: response.fileName,
          documentType,
        },
        metadata: {
          documentType,
        },
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
  if (!refs.orderDetailModal) return;

  if (!order) {
    setOrderDetailVisibility(false);
    if (refs.orderDetailTitle) refs.orderDetailTitle.textContent = t('order_detail');
    return;
  }

  setOrderDetailVisibility(true);
  if (refs.orderDetailTitle) refs.orderDetailTitle.textContent = order.orderNumber || t('order_detail');
  if (refs.orderDetailNumber) refs.orderDetailNumber.textContent = order.orderNumber || '-';
  if (refs.orderDetailCustomer) refs.orderDetailCustomer.textContent = order.customer?.name || order.customer?.email || '-';
  if (refs.orderDetailCustomerEmail) refs.orderDetailCustomerEmail.textContent = order.customer?.email || '-';
  if (refs.orderDetailRoute) {
    const routeSeparator = isAdminShell() ? ' · ' : ' -> ';
    refs.orderDetailRoute.textContent = [formatLocation(order.trip?.from), formatLocation(order.trip?.to)]
      .filter(value => value && value !== '-')
      .join(routeSeparator) || t('route_not_set');
  }
  if (refs.orderDetailDate) refs.orderDetailDate.textContent = formatDateTimeLabel(order.createdAt);
  if (refs.orderDetailIssueDate) refs.orderDetailIssueDate.textContent = formatDateTimeLabel(order.contractData?.issueDate || order.contractData?.today || order.createdAt);
  if (refs.orderDetailStatus) refs.orderDetailStatus.textContent = formatOrderStatusLabel(order.status || '-');
  if (refs.orderDetailTotal) refs.orderDetailTotal.textContent = order.totalPrice || '-';
  if (refs.orderDetailPdf) refs.orderDetailPdf.textContent = order.pdf?.fileName || order.pdf?.url || t('not_attached');
  if (refs.orderDetailDocumentType) {
    refs.orderDetailDocumentType.textContent = formatDocumentTypeLabel(
      order.pdf?.documentType || order.contractData?.documentType || 'confirmation',
    );
  }
  if (refs.orderDetailPickup) refs.orderDetailPickup.textContent = formatLocation(order.trip?.from);
  if (refs.orderDetailDropoff) refs.orderDetailDropoff.textContent = formatLocation(order.trip?.to);
  if (refs.orderDetailTripTime) refs.orderDetailTripTime.textContent = order.trip?.time || '-';
  if (refs.orderDetailPayment) refs.orderDetailPayment.textContent = order.trip?.paymentMethod || '-';
}

export function bindOrderDetailEvents() {
  refs.orderDetailBackdrop?.addEventListener('click', closeOrderDetail);
  refs.orderDetailCloseBtn?.addEventListener('click', closeOrderDetail);
  refs.orderDetailOfferBtn?.addEventListener('click', async () => {
    const order = getSelectedOrder();
    await downloadOrderPdf(order, 'offer');
  });
  refs.orderDetailConfirmationBtn?.addEventListener('click', async () => {
    const order = getSelectedOrder();
    await downloadOrderPdf(order, 'confirmation');
  });
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && refs.orderDetailModal?.classList.contains('is-open')) {
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
