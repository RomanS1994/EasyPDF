import {
  cancelManagerUserSubscription,
  confirmManagerUserSubscription,
  createManagerPlan,
  extendManagerUserSubscription,
  updateManagerPlan,
  updateManagerUserRole,
  updateManagerUserSubscription,
} from './api.js';
import { updateOrder } from '../orders/api.js';
import { t } from '../../shared/i18n/app.js';
import { notifyText } from '../../shared/ui/toast.js';
import { refs } from './refs.js';
import { setStoredManagerSelectedOrderId } from './manager-storage.js';
import { state } from './state.js';
import { state as accountState } from '../auth/account/state.js';
import { formatOrderStatusLabel } from '../../shared/lib/formatters.js';
import {
  loadManagerOrders,
  refreshManagerUserDetail,
} from './manager-data.js';
import { setManagerOrderActionButtonsDisabled } from './manager-render.js';

function getOrderStatusActionLabel(status) {
  if (status === 'pending_pdf') return t('order_pending_pdf');
  if (status === 'pdf_generated') return t('order_pdf_generated');
  if (status === 'pdf_failed') return t('order_pdf_failed');
  return formatOrderStatusLabel(status);
}

export async function saveManagerSubscription() {
  const userId = state.managerSelectedUserId;
  if (!userId) return;

  const payload = {
    planId: refs.managerSubscriptionPlan?.value || '',
    status: refs.managerSubscriptionStatus?.value || 'active',
    currentPeriodStart: refs.managerSubscriptionStart?.value || '',
    currentPeriodEnd: refs.managerSubscriptionEnd?.value || '',
    quotaOverride: refs.managerSubscriptionQuota?.value || null,
    notes: refs.managerSubscriptionNotes?.value || '',
  };

  if (refs.managerSubscriptionSaveBtn) refs.managerSubscriptionSaveBtn.disabled = true;
  try {
    await updateManagerUserSubscription(userId, payload);
    notifyText(t('subscription_updated'), 'success');
  } catch (error) {
    notifyText(error.message || t('update_subscription_failed'), 'error');
    throw error;
  } finally {
    if (refs.managerSubscriptionSaveBtn) refs.managerSubscriptionSaveBtn.disabled = false;
  }
}

export async function extendManagerSubscription() {
  const userId = state.managerSelectedUserId;
  if (!userId) return;
  if (refs.managerSubscriptionExtendBtn) refs.managerSubscriptionExtendBtn.disabled = true;
  try {
    await extendManagerUserSubscription(userId, { months: 1 });
    notifyText(t('subscription_extended_30'), 'success');
  } catch (error) {
    notifyText(error.message || t('extend_subscription_failed'), 'error');
    throw error;
  } finally {
    if (refs.managerSubscriptionExtendBtn) refs.managerSubscriptionExtendBtn.disabled = false;
  }
}

export async function cancelCurrentManagerSubscription() {
  const userId = state.managerSelectedUserId;
  if (!userId) return;
  if (!window.confirm(t('cancel_subscription_confirm'))) return;
  if (refs.managerSubscriptionCancelBtn) refs.managerSubscriptionCancelBtn.disabled = true;
  try {
    await cancelManagerUserSubscription(userId);
    notifyText(t('subscription_canceled_message'), 'success');
  } catch (error) {
    notifyText(error.message || t('cancel_subscription_failed'), 'error');
    throw error;
  } finally {
    if (refs.managerSubscriptionCancelBtn) refs.managerSubscriptionCancelBtn.disabled = false;
  }
}

export async function confirmPendingManagerSubscription() {
  const userId = state.managerSelectedUserId;
  if (!userId) return;
  if (refs.managerSubscriptionConfirmBtn) refs.managerSubscriptionConfirmBtn.disabled = true;
  try {
    await confirmManagerUserSubscription(userId, {
      notes: refs.managerSubscriptionNotes?.value || '',
    });
    notifyText(t('subscription_payment_confirmed'), 'success');
  } catch (error) {
    notifyText(error.message || t('confirm_payment_failed'), 'error');
    throw error;
  } finally {
    if (refs.managerSubscriptionConfirmBtn) refs.managerSubscriptionConfirmBtn.disabled = false;
  }
}

export async function saveManagerRole() {
  const userId = state.managerSelectedUserId;
  if (!userId || accountState.user?.role !== 'admin') return;
  const role = refs.managerRoleSelect?.value || 'user';
  if (refs.managerRoleSaveBtn) refs.managerRoleSaveBtn.disabled = true;
  try {
    await updateManagerUserRole(userId, role);
    notifyText(t('role_updated'), 'success');
  } catch (error) {
    notifyText(error.message || t('update_role_failed'), 'error');
    throw error;
  } finally {
    if (refs.managerRoleSaveBtn) refs.managerRoleSaveBtn.disabled = false;
  }
}

export function resetManagerPlanForm() {
  if (refs.managerPlanId) refs.managerPlanId.value = '';
  if (refs.managerPlanName) refs.managerPlanName.value = '';
  if (refs.managerPlanLimit) refs.managerPlanLimit.value = '';
  if (refs.managerPlanDescription) refs.managerPlanDescription.value = '';
  if (refs.managerPlanActive) refs.managerPlanActive.checked = true;
}

export async function saveManagerPlan() {
  const planId = refs.managerPlanId?.value || '';
  const payload = {
    name: refs.managerPlanName?.value || '',
    monthlyGenerationLimit: refs.managerPlanLimit?.value || '',
    description: refs.managerPlanDescription?.value || '',
    isActive: refs.managerPlanActive?.checked ?? true,
  };

  if (!payload.name || !payload.monthlyGenerationLimit) {
    notifyText(t('plan_validation'), 'error');
    return;
  }

  if (refs.managerPlanSubmitBtn) refs.managerPlanSubmitBtn.disabled = true;
  try {
    if (planId) {
      await updateManagerPlan(planId, payload);
      notifyText(t('plan_updated'), 'success');
    } else {
      await createManagerPlan(payload);
      notifyText(t('plan_created'), 'success');
    }
    resetManagerPlanForm();
  } catch (error) {
    notifyText(error.message || t('save_plan_failed'), 'error');
    throw error;
  } finally {
    if (refs.managerPlanSubmitBtn) refs.managerPlanSubmitBtn.disabled = false;
  }
}

export async function handleManagerOrderStatusChange(nextStatus, refreshAccountData) {
  const orderId = state.managerSelectedOrderId;
  if (!orderId) return;
  setManagerOrderActionButtonsDisabled(true);
  try {
    const data = await updateOrder(orderId, { status: nextStatus });
    state.managerSelectedOrder = data.order || state.managerSelectedOrder;
    state.managerSelectedOrderId = data.order?.id || state.managerSelectedOrderId;
    setStoredManagerSelectedOrderId(state.managerSelectedOrderId);
    notifyText(t('order_marked_as', { status: getOrderStatusActionLabel(nextStatus) }), 'success');

    const refreshTasks = [loadManagerOrders()];
    if (state.managerSelectedUserId && data.order?.userId === state.managerSelectedUserId) {
      refreshTasks.push(refreshManagerUserDetail(state.managerSelectedUserId));
    }
    if (refreshAccountData) {
      refreshTasks.push(refreshAccountData());
    }
    await Promise.all(refreshTasks);
  } catch (error) {
    notifyText(error.message || t('update_order_status_failed'), 'error');
  } finally {
    setManagerOrderActionButtonsDisabled(false);
  }
}
