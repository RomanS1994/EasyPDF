import {
  deleteMe,
  getMe,
  logout,
  refreshSession,
  updateMyProfile,
} from '../api.js';
import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from '../session.js';
import { getOrders } from '../../orders/api.js';
import { refs } from './refs.js';
import { clearAppStorage } from './manager-storage.js';
import { isAdminShell } from './shell.js';
import { clearManagerState, state } from './state.js';
import { loadManagerData } from './manager-data.js';
import { renderAuthenticatedState } from './dashboard.js';
import { t } from '../../../shared/i18n/app.js';
import { notifyText } from '../../../shared/ui/toast.js';

export async function refreshAccountData({ resetTab = false } = {}) {
  const hadUser = Boolean(state.user);
  let session = getStoredSession();

  if (!session?.token) {
    try {
      const refreshed = await refreshSession();
      setStoredSession({ token: refreshed.token, user: refreshed.user });
      session = getStoredSession();
    } catch {
      state.user = null;
      state.orders = [];
      clearManagerState();
      renderAuthenticatedState({ resetTab });
      return;
    }
  }

  try {
    const meResponse = await getMe();
    let orders = [];

    try {
      const ordersResponse = await getOrders();
      orders = ordersResponse.orders || [];
    } catch (error) {
      orders = [];
      notifyText(error.message || t('api_orders_failed'), 'error');
    }

    state.user = meResponse.user;
    state.orders = orders;

    setStoredSession({
      token: session.token,
      user: state.user,
    });

    renderAuthenticatedState({ resetTab });

    if (isAdminShell()) {
      await loadManagerData();
    }
  } catch (error) {
    if (error.status === 401) {
      clearStoredSession();
      state.user = null;
      state.orders = [];
      clearManagerState();
      renderAuthenticatedState({ resetTab: true });
      notifyText(t('session_expired'), 'error');
      return;
    }

    if (!hadUser) {
      state.user = null;
      state.orders = [];
      clearManagerState();
      renderAuthenticatedState({ resetTab });
    }

    notifyText(error.message || t('account_load_failed'), 'error');
  }
}

export async function handleLogoutClick() {
  try {
    await logout();
  } catch {
    // Local session must still be cleared.
  }

  clearStoredSession();
  clearAppStorage();
  state.user = null;
  state.orders = [];
  clearManagerState();
  renderAuthenticatedState({ resetTab: true });
  notifyText(t('signed_out'), 'success');
}

export async function handleDeleteAccountClick() {
  if (!state.user) return;
  if (!window.confirm(t('delete_account_confirm'))) return;

  try {
    await deleteMe();
    clearStoredSession();
    clearAppStorage();
    state.user = null;
    state.orders = [];
    clearManagerState();
    renderAuthenticatedState({ resetTab: true });
    refs.hub?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    notifyText(t('account_deleted'), 'success');
  } catch (error) {
    notifyText(error.message || t('delete_account_failed'), 'error');
  }
}

export async function handleUpdateProfileClick() {
  if (!state.user) return;

  const profile = {
    driver: {
      name: refs.accountDriverName?.value || '',
      address: refs.accountDriverAddress?.value || '',
      spz: refs.accountDriverSpz?.value || '',
      ico: refs.accountDriverIco?.value || '',
    },
    provider: {
      name: refs.accountProviderName?.value || '',
      address: refs.accountProviderAddress?.value || '',
      ico: refs.accountProviderIco?.value || '',
    },
  };

  if (refs.updateProfileBtn) refs.updateProfileBtn.disabled = true;

  try {
    const data = await updateMyProfile(profile);
    state.user = data.user;

    const session = getStoredSession();
    if (session?.token) {
      setStoredSession({ token: session.token, user: state.user });
    }

    notifyText(t('business_profile_updated'), 'success');
    renderAuthenticatedState();
  } catch (error) {
    notifyText(error.message || t('update_profile_failed'), 'error');
  } finally {
    if (refs.updateProfileBtn) refs.updateProfileBtn.disabled = false;
  }
}
