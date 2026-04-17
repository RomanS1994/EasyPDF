import { t } from '../../../shared/i18n/app.js';
import { refs, TAB_NAMES } from './refs.js';
import { isAdminShell, isManagerRole } from './shell.js';
import {
  setStoredManagerOrdersSelectedOnly,
  setStoredManagerSelectedOrderId,
} from './manager-storage.js';
import { state } from './state.js';
import {
  buildOrderStatusSummary,
  escapeHtml,
  formatCycleLabel,
  formatDateLabel,
  formatDateTimeLabel,
  formatOrderStatusLabel,
  isoToDateInput,
  localizeAuditAction,
  localizeRole,
  localizeSubscriptionStatus,
} from './formatters.js';
import { getSelectedManagerContextUser, renderOrderList } from './orders.js';

function resolvePlanName(planId, plans = []) {
  if (!planId) return '-';
  return plans.find(plan => plan.id === planId)?.name || planId;
}

function buildManagerOrderListMarkup(order) {
  const createdAt = formatDateTimeLabel(order.createdAt);
  const route =
    [order.trip?.from, order.trip?.to].filter(Boolean).join(' -> ') || t('route_not_set');
  const ownerLabel = order.user
    ? `${order.user.name || t('no_name')} · ${order.user.email || '-'}`
    : t('no_account');
  const customerLabel = order.customer?.name || order.customer?.email || t('no_customer');
  const statusLabel = formatOrderStatusLabel(order.status || 'created');
  const isActive = order.id === state.managerSelectedOrderId;

  return `
    <li class="orderItem ${isActive ? 'is-active' : ''}">
      <button type="button" class="orderItemButton" data-manager-order-id="${order.id}">
        <div class="orderItem-main">
          <strong>${escapeHtml(order.orderNumber || '-')}</strong>
          <p class="orderItem-owner">${escapeHtml(ownerLabel)}</p>
          <p>${escapeHtml(customerLabel)}</p>
          <p>${escapeHtml(route)}</p>
        </div>
        <div class="orderItem-meta">
          <span>${escapeHtml(order.totalPrice || t('no_total'))}</span>
          <span>${escapeHtml(createdAt)}</span>
          <span class="orderStatus">${escapeHtml(statusLabel)}</span>
        </div>
      </button>
    </li>
  `;
}

function buildAuditMarkup(record) {
  const actor = record.actor?.name || record.actor?.email || t('system_actor');
  const target = record.target?.email || record.target?.name || '-';
  const createdAt = formatDateTimeLabel(record.createdAt);

  return `
    <li class="auditItem">
      <div>
        <strong>${escapeHtml(localizeAuditAction(record.action || 'system.event'))}</strong>
        <p>${escapeHtml(t('audit_target_arrow', { actor, target }))}</p>
      </div>
      <span>${escapeHtml(createdAt)}</span>
    </li>
  `;
}

export function setManagerOrderActionButtonsDisabled(disabled) {
  if (refs.managerOrderMarkPendingBtn) refs.managerOrderMarkPendingBtn.disabled = disabled;
  if (refs.managerOrderMarkGeneratedBtn) refs.managerOrderMarkGeneratedBtn.disabled = disabled;
  if (refs.managerOrderMarkFailedBtn) refs.managerOrderMarkFailedBtn.disabled = disabled;
}

export function renderManagerOrderDetail() {
  const order = state.managerSelectedOrder;
  const contextUser = getSelectedManagerContextUser();
  const isVisibleInCurrentResults = Boolean(
    order && state.managerOrders.some(item => item.id === order.id),
  );

  refs.managerOrderDetailEmpty?.classList.toggle('is-hidden', Boolean(order));
  refs.managerOrderDetailCard?.classList.toggle('is-hidden', !order);

  if (!order) {
    setManagerOrderActionButtonsDisabled(true);
    if (refs.managerOrderDetailNumber) refs.managerOrderDetailNumber.textContent = '-';
    if (refs.managerOrderDetailStatus) refs.managerOrderDetailStatus.textContent = '-';
    if (refs.managerOrderDetailAccount) refs.managerOrderDetailAccount.textContent = '-';
    if (refs.managerOrderDetailCustomer) refs.managerOrderDetailCustomer.textContent = '-';
    if (refs.managerOrderDetailTime) refs.managerOrderDetailTime.textContent = '-';
    if (refs.managerOrderDetailTotal) refs.managerOrderDetailTotal.textContent = '-';
    if (refs.managerOrderDetailCreated) refs.managerOrderDetailCreated.textContent = '-';
    if (refs.managerOrderDetailUpdated) refs.managerOrderDetailUpdated.textContent = '-';
    if (refs.managerOrderDetailRoute) refs.managerOrderDetailRoute.textContent = '-';
    if (refs.managerOrderDetailPdf) refs.managerOrderDetailPdf.textContent = '-';
    if (refs.managerOrderDetailHint) refs.managerOrderDetailHint.textContent = t('visible_in_results');
    return;
  }

  setManagerOrderActionButtonsDisabled(false);
  if (refs.managerOrderDetailNumber) refs.managerOrderDetailNumber.textContent = order.orderNumber || '-';
  if (refs.managerOrderDetailStatus) refs.managerOrderDetailStatus.textContent = formatOrderStatusLabel(order.status || '-');
  if (refs.managerOrderDetailAccount) {
    refs.managerOrderDetailAccount.textContent = order.user
      ? `${order.user.name || order.user.email || t('no_account')}`
      : '-';
  }
  if (refs.managerOrderDetailCustomer) refs.managerOrderDetailCustomer.textContent = order.customer?.name || order.customer?.email || '-';
  if (refs.managerOrderDetailTime) refs.managerOrderDetailTime.textContent = order.trip?.time || '-';
  if (refs.managerOrderDetailTotal) refs.managerOrderDetailTotal.textContent = order.totalPrice || '-';
  if (refs.managerOrderDetailCreated) refs.managerOrderDetailCreated.textContent = formatDateTimeLabel(order.createdAt);
  if (refs.managerOrderDetailUpdated) refs.managerOrderDetailUpdated.textContent = formatDateTimeLabel(order.updatedAt);
  if (refs.managerOrderDetailRoute) {
    refs.managerOrderDetailRoute.textContent =
      [order.trip?.from, order.trip?.to].filter(Boolean).join(' -> ') || t('route_not_set');
  }
  if (refs.managerOrderDetailPdf) {
    refs.managerOrderDetailPdf.textContent = order.pdf?.fileName || order.pdf?.url || t('not_attached');
  }
  if (refs.managerOrderDetailHint) {
    refs.managerOrderDetailHint.textContent = isVisibleInCurrentResults
      ? state.managerOrdersSelectedOnly && contextUser
        ? t('filtered_to_user', { name: contextUser.name || contextUser.email })
        : t('visible_in_results')
      : t('selected_order_outside_filters');
  }
}

export function renderManagerOrders() {
  if (!refs.managerOrdersList || !refs.managerOrdersEmpty) return;
  const contextUser = getSelectedManagerContextUser();
  const summary = state.managerOrdersSummary || buildOrderStatusSummary(state.managerOrders);

  if (refs.managerOrdersAllCount) refs.managerOrdersAllCount.textContent = String(summary.all || 0);
  if (refs.managerOrdersPendingCount) refs.managerOrdersPendingCount.textContent = String(summary.pending || 0);
  if (refs.managerOrdersFailedCount) refs.managerOrdersFailedCount.textContent = String(summary.failed || 0);
  if (refs.managerOrdersGeneratedCount) refs.managerOrdersGeneratedCount.textContent = String(summary.generated || 0);

  const activeStatus = refs.managerOrdersStatusFilter?.value || 'all';
  refs.managerOrdersStatusButtons.forEach(button => {
    button.classList.toggle('is-active', button.dataset.managerOrdersStatus === activeStatus);
  });

  if (refs.managerOrdersContextNote) {
    refs.managerOrdersContextNote.textContent = contextUser
      ? state.managerOrdersSelectedOnly
        ? t('filtered_to_selected_account', { name: contextUser.name || contextUser.email })
        : t('selected_account_context', { name: contextUser.name || contextUser.email })
      : t('all_accounts_visible');
  }

  if (!state.managerOrders.length) {
    refs.managerOrdersList.innerHTML = '';
    refs.managerOrdersEmpty.hidden = false;
  } else {
    refs.managerOrdersEmpty.hidden = true;
    refs.managerOrdersList.innerHTML = state.managerOrders.map(buildManagerOrderListMarkup).join('');
  }

  if (refs.managerOrdersSelectedUserBtn) {
    const canUseSelected = Boolean(state.managerSelectedUserId);
    refs.managerOrdersSelectedUserBtn.disabled = !canUseSelected;
    refs.managerOrdersSelectedUserBtn.classList.toggle('is-active', canUseSelected && state.managerOrdersSelectedOnly);
    refs.managerOrdersSelectedUserBtn.textContent = canUseSelected
      ? state.managerOrdersSelectedOnly
        ? t('showing_selected_account')
        : t('selected_account_only')
      : t('select_account_first');
  }

  renderManagerOrderDetail();
}

export function renderManagerPlanOptions() {
  const plans = state.managerPlans.length ? state.managerPlans : state.plans;

  if (refs.managerSubscriptionPlan) {
    refs.managerSubscriptionPlan.innerHTML = plans
      .map(plan => `<option value="${plan.id}">${escapeHtml(plan.name)} - ${escapeHtml(t('per_cycle', { count: plan.monthlyGenerationLimit }))}</option>`)
      .join('');
  }

  if (refs.managerPlanFilter) {
    const currentValue = refs.managerPlanFilter.value || 'all';
    refs.managerPlanFilter.innerHTML = [
      `<option value="all">${escapeHtml(t('all_plans_filter'))}</option>`,
      ...plans.map(plan => `<option value="${plan.id}">${escapeHtml(plan.name)}</option>`),
    ].join('');
    refs.managerPlanFilter.value = plans.some(plan => plan.id === currentValue) ? currentValue : 'all';
  }
}

export function renderManagerUsers() {
  if (refs.managerUsersCount) refs.managerUsersCount.textContent = String(state.managerUsers.length);
  if (refs.managerActiveCount) refs.managerActiveCount.textContent = String(state.managerUsers.filter(user => user.subscription?.isAccessActive).length);
  if (refs.managerInactiveCount) refs.managerInactiveCount.textContent = String(state.managerUsers.filter(user => !user.subscription?.isAccessActive).length);
  if (refs.managerStaffCount) refs.managerStaffCount.textContent = String(state.managerUsers.filter(user => isManagerRole(user.role)).length);
  if (!refs.managerUsersList || !refs.managerUsersEmpty) return;

  if (!state.managerUsers.length) {
    refs.managerUsersList.innerHTML = '';
    refs.managerUsersEmpty.hidden = false;
    return;
  }

  refs.managerUsersEmpty.hidden = true;
  refs.managerUsersList.innerHTML = state.managerUsers.map(user => {
    const isActive = user.id === state.managerSelectedUserId;
    return `
      <li class="managerUserItem ${isActive ? 'is-active' : ''}">
        <button type="button" class="managerUserButton" data-manager-user-id="${user.id}">
          <div class="managerUserCopy">
            <strong>${escapeHtml(user.name || t('no_name'))}</strong>
            <p>${escapeHtml(user.email || '-')}</p>
          </div>
          <div class="managerUserMeta">
            <span>${escapeHtml(user.plan?.name || '-')}</span>
            <span>${escapeHtml(
              user.subscription?.pendingPlanId
                ? `${localizeSubscriptionStatus(user.subscription?.status || '-')} · ${t('pending_payment')}`
                : localizeSubscriptionStatus(user.subscription?.status || '-')
            )}</span>
          </div>
        </button>
      </li>
    `;
  }).join('');
}

export function renderManagerSelectedUser() {
  const user = state.managerSelectedUser;

  refs.managerSelectedEmpty?.classList.toggle('is-hidden', Boolean(user));
  refs.managerSelectedCard?.classList.toggle('is-hidden', !user);
  refs.managerSubscriptionEmpty?.classList.toggle('is-hidden', Boolean(user));
  refs.managerSubscriptionCard?.classList.toggle('is-hidden', !user);

  if (isAdminShell() && refs.workspaceUsage) {
    refs.workspaceUsage.textContent = user?.email || t('no_account');
  }

  if (!user) {
    state.managerOrdersSelectedOnly = false;
    setStoredManagerOrdersSelectedOnly(false);
    renderOrderList(refs.managerSelectedOrdersList, refs.managerSelectedOrdersEmpty, [], { emptyText: t('recent_orders_empty') });
    if (refs.managerSubscriptionName) refs.managerSubscriptionName.textContent = '-';
    if (refs.managerSubscriptionEmail) refs.managerSubscriptionEmail.textContent = '-';
    if (refs.managerSubscriptionStatusLabel) refs.managerSubscriptionStatusLabel.textContent = '-';
    if (refs.managerSubscriptionUsageLabel) refs.managerSubscriptionUsageLabel.textContent = '-';
    refs.managerSubscriptionPendingRow?.classList.add('is-hidden');
    refs.managerSubscriptionPendingRequestedAtRow?.classList.add('is-hidden');
    if (refs.managerSubscriptionPendingPlan) refs.managerSubscriptionPendingPlan.textContent = '-';
    if (refs.managerSubscriptionPendingRequestedAt) refs.managerSubscriptionPendingRequestedAt.textContent = '-';
    if (refs.managerSubscriptionConfirmBtn) refs.managerSubscriptionConfirmBtn.hidden = true;
    renderManagerOrders();
    return;
  }

  if (refs.managerSelectedName) refs.managerSelectedName.textContent = user.name || '-';
  if (refs.managerSelectedEmail) refs.managerSelectedEmail.textContent = user.email || '-';
  if (refs.managerSelectedRole) refs.managerSelectedRole.textContent = localizeRole(user.role || 'user');
  if (refs.managerSelectedPlan) refs.managerSelectedPlan.textContent = user.plan?.name || '-';
  if (refs.managerSelectedStatus) refs.managerSelectedStatus.textContent = localizeSubscriptionStatus(user.subscription?.status || '-');
  if (refs.managerSelectedCycle) refs.managerSelectedCycle.textContent = formatCycleLabel(user.usage);
  if (refs.managerSelectedUsage) refs.managerSelectedUsage.textContent = `${user.usage?.used || 0} / ${user.usage?.limit || 0}`;
  if (refs.managerSelectedOrdersCount) refs.managerSelectedOrdersCount.textContent = String(user.totalOrders || 0);
  if (refs.managerRecentOrdersLabel) refs.managerRecentOrdersLabel.textContent = t('recent_count', { count: state.managerSelectedOrders.length });
  if (refs.managerSubscriptionName) refs.managerSubscriptionName.textContent = user.name || '-';
  if (refs.managerSubscriptionEmail) refs.managerSubscriptionEmail.textContent = user.email || '-';
  if (refs.managerSubscriptionStatusLabel) refs.managerSubscriptionStatusLabel.textContent = localizeSubscriptionStatus(user.subscription?.status || '-');
  if (refs.managerSubscriptionUsageLabel) refs.managerSubscriptionUsageLabel.textContent = `${user.usage?.used || 0} / ${user.usage?.limit || 0}`;
  const pendingPlanName = resolvePlanName(
    user.subscription?.pendingPlanId,
    state.managerPlans.length ? state.managerPlans : state.plans,
  );
  refs.managerSubscriptionPendingRow?.classList.toggle('is-hidden', !user.subscription?.pendingPlanId);
  refs.managerSubscriptionPendingRequestedAtRow?.classList.toggle('is-hidden', !user.subscription?.pendingPlanId);
  if (refs.managerSubscriptionPendingPlan) refs.managerSubscriptionPendingPlan.textContent = pendingPlanName;
  if (refs.managerSubscriptionPendingRequestedAt) {
    refs.managerSubscriptionPendingRequestedAt.textContent = user.subscription?.pendingRequestedAt
      ? formatDateLabel(user.subscription.pendingRequestedAt)
      : '-';
  }

  renderManagerPlanOptions();
  if (refs.managerSubscriptionPlan) refs.managerSubscriptionPlan.value = user.planId || '';
  if (refs.managerSubscriptionStatus) refs.managerSubscriptionStatus.value = user.subscription?.status || 'active';
  if (refs.managerSubscriptionStart) refs.managerSubscriptionStart.value = isoToDateInput(user.subscription?.currentPeriodStart);
  if (refs.managerSubscriptionEnd) refs.managerSubscriptionEnd.value = isoToDateInput(user.subscription?.currentPeriodEnd);
  if (refs.managerSubscriptionQuota) refs.managerSubscriptionQuota.value = user.subscription?.quotaOverride ?? '';
  if (refs.managerSubscriptionNotes) refs.managerSubscriptionNotes.value = user.subscription?.notes || '';
  if (refs.managerSubscriptionConfirmBtn) refs.managerSubscriptionConfirmBtn.hidden = !user.subscription?.pendingPlanId;
  refs.managerRoleSection?.classList.toggle('is-hidden', state.user?.role !== 'admin');
  if (refs.managerRoleSelect) refs.managerRoleSelect.value = user.role || 'user';

  renderOrderList(refs.managerSelectedOrdersList, refs.managerSelectedOrdersEmpty, state.managerSelectedOrders, {
    compact: true,
    emptyText: t('recent_orders_empty'),
  });
  renderManagerOrders();
}

export function renderManagerPlans() {
  renderManagerPlanOptions();
  if (!refs.managerPlansList || !refs.managerPlansEmpty) return;

  if (!state.managerPlans.length) {
    refs.managerPlansList.innerHTML = '';
    refs.managerPlansEmpty.hidden = false;
    return;
  }

  refs.managerPlansEmpty.hidden = true;
  refs.managerPlansList.innerHTML = state.managerPlans.map(plan => {
    const isEditing = refs.managerPlanId?.value === plan.id;
    return `
      <li class="managerPlanItem ${isEditing ? 'is-active' : ''}">
        <button type="button" class="managerPlanButton" data-manager-plan-id="${plan.id}">
          <div>
            <strong>${escapeHtml(plan.name)}</strong>
            <p>${escapeHtml(plan.description || t('no_description'))}</p>
          </div>
          <div class="managerPlanMeta">
            <span>${escapeHtml(t('per_cycle', { count: plan.monthlyGenerationLimit }))}</span>
            <span>${escapeHtml(plan.isActive === false ? t('plan_inactive_status') : t('plan_active_status'))}</span>
          </div>
        </button>
      </li>
    `;
  }).join('');
}

export function renderManagerAudit() {
  if (!refs.managerAuditList || !refs.managerAuditEmpty) return;
  if (!state.managerAudit.length) {
    refs.managerAuditList.innerHTML = '';
    refs.managerAuditEmpty.hidden = false;
    return;
  }
  refs.managerAuditEmpty.hidden = true;
  refs.managerAuditList.innerHTML = state.managerAudit.map(buildAuditMarkup).join('');
}

export function renderManagerAccessState() {
  const canManage = isManagerRole(state.user?.role);
  refs.managerEntrySection?.classList.toggle('is-hidden', !canManage);
  refs.managerGate?.classList.toggle('is-hidden', canManage);
  refs.managerWorkspace?.classList.toggle('is-hidden', !canManage);
}

export function syncSelectedManagerOrderFromCollections() {
  if (!state.managerSelectedOrderId) {
    state.managerSelectedOrder = null;
    renderManagerOrderDetail();
    return;
  }

  const nextOrder =
    state.managerOrders.find(order => order.id === state.managerSelectedOrderId) ||
    state.managerSelectedOrders.find(order => order.id === state.managerSelectedOrderId) ||
    state.managerSelectedOrder;

  state.managerSelectedOrder = nextOrder || null;
  if (!state.managerSelectedOrder) {
    state.managerSelectedOrderId = '';
    setStoredManagerSelectedOrderId('');
  }
  renderManagerOrderDetail();
}
