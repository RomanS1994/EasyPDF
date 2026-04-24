import { refs } from './refs.js';
import { state } from './state.js';
import {
  loadManagerData,
  loadManagerOrders,
  refreshManagerOrderDetail,
  refreshManagerUserDetail,
} from './manager-data.js';
import { renderManagerOrders, renderManagerPlans } from './manager-render.js';
import { openOrderActions } from '../auth/orders/order-actions.js';
import {
  cancelCurrentManagerSubscription,
  confirmPendingManagerSubscription,
  extendManagerSubscription,
  handleManagerOrderStatusChange,
  resetManagerPlanForm,
  saveManagerPlan,
  saveManagerRole,
  saveManagerSubscription,
} from './manager-actions.js';

export async function bindManagerUserClick(event) {
  const userButton = event.target.closest('[data-manager-user-id]');
  if (!userButton) return;

  state.managerSelectedUserId = userButton.dataset.managerUserId || '';
  await refreshManagerUserDetail(state.managerSelectedUserId);
  if (state.managerOrdersSelectedOnly) {
    await loadManagerOrders();
  }
}

export async function handleManagerOrdersClick(event) {
  const orderButton = event.target.closest('[data-manager-order-id]');
  if (!orderButton) return;

  const nextOrderId = orderButton.dataset.managerOrderId || '';
  if (!nextOrderId) return;

  state.managerSelectedOrderId = nextOrderId;
  state.managerSelectedOrder =
    state.managerOrders.find(order => order.id === nextOrderId) || state.managerSelectedOrder;
  renderManagerOrders();
  await refreshManagerOrderDetail(nextOrderId, { silent: true });
}

export function handleManagerPlansClick(event) {
  const button = event.target.closest('[data-manager-plan-id]');
  if (!button) return;

  const plan = state.managerPlans.find(item => item.id === button.dataset.managerPlanId);
  if (!plan) return;

  if (refs.managerPlanId) refs.managerPlanId.value = plan.id;
  if (refs.managerPlanName) refs.managerPlanName.value = plan.name || '';
  if (refs.managerPlanLimit) refs.managerPlanLimit.value = String(plan.monthlyGenerationLimit || '');
  if (refs.managerPlanDescription) refs.managerPlanDescription.value = plan.description || '';
  if (refs.managerPlanActive) refs.managerPlanActive.checked = plan.isActive !== false;
  renderManagerPlans();
}

export function bindManagerEvents(refreshAccountData, loadPlansForGuest) {
  refs.managerUsersList?.addEventListener('click', bindManagerUserClick);
  refs.managerPlansList?.addEventListener('click', handleManagerPlansClick);
  refs.managerRefreshBtn?.addEventListener('click', () => loadManagerData({ preserveSelection: true }));
  refs.managerSearchInput?.addEventListener('input', () => loadManagerData({ preserveSelection: false }));
  refs.managerStatusFilter?.addEventListener('change', () => loadManagerData({ preserveSelection: false }));
  refs.managerRoleFilter?.addEventListener('change', () => loadManagerData({ preserveSelection: false }));
  refs.managerPlanFilter?.addEventListener('change', () => loadManagerData({ preserveSelection: false }));
  refs.managerOrdersRefreshBtn?.addEventListener('click', () => loadManagerOrders());
  refs.managerOrdersSearchInput?.addEventListener('input', () => loadManagerOrders());
  refs.managerOrdersStatusFilter?.addEventListener('change', () => loadManagerOrders());
  refs.managerOrdersSelectedUserBtn?.addEventListener('click', async () => {
    if (!state.managerSelectedUserId) return;
    state.managerOrdersSelectedOnly = !state.managerOrdersSelectedOnly;
    renderManagerOrders();
    await loadManagerOrders();
  });
  refs.managerOrdersList?.addEventListener('click', handleManagerOrdersClick);
  refs.managerOrdersStatusButtons.forEach(button => {
    button.addEventListener('click', async () => {
      if (refs.managerOrdersStatusFilter) {
        refs.managerOrdersStatusFilter.value = button.dataset.managerOrdersStatus || 'all';
      }
      await loadManagerOrders();
    });
  });
  refs.managerOrderMarkPendingBtn?.addEventListener('click', () => {
    handleManagerOrderStatusChange('pending_pdf', refreshAccountData);
  });
  refs.managerOrderMarkGeneratedBtn?.addEventListener('click', () => {
    handleManagerOrderStatusChange('pdf_generated', refreshAccountData);
  });
  refs.managerOrderMarkFailedBtn?.addEventListener('click', () => {
    handleManagerOrderStatusChange('pdf_failed', refreshAccountData);
  });
  refs.managerOrderDeleteBtn?.addEventListener('click', () => {
    openOrderActions(state.managerSelectedOrder, { origin: 'manager-detail' });
  });
  refs.managerSubscriptionSaveBtn?.addEventListener('click', async () => {
    await saveManagerSubscription();
    await refreshAccountData();
  });
  refs.managerSubscriptionExtendBtn?.addEventListener('click', async () => {
    await extendManagerSubscription();
    await refreshAccountData();
  });
  refs.managerSubscriptionCancelBtn?.addEventListener('click', async () => {
    await cancelCurrentManagerSubscription();
    await refreshAccountData();
  });
  refs.managerSubscriptionConfirmBtn?.addEventListener('click', async () => {
    await confirmPendingManagerSubscription();
    await refreshAccountData();
  });
  refs.managerRoleSaveBtn?.addEventListener('click', async () => {
    await saveManagerRole();
    await refreshAccountData();
  });
  refs.managerPlanForm?.addEventListener('submit', async event => {
    event.preventDefault();
    await saveManagerPlan();
    await loadPlansForGuest();
    await refreshAccountData();
  });
  refs.managerPlanResetBtn?.addEventListener('click', resetManagerPlanForm);
}
