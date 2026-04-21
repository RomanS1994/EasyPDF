import {
  deleteMe,
  getMe,
  logout,
  requestSubscriptionUpgrade,
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
import { renderAuthenticatedState, syncAccountAvatarPreview } from './dashboard.js';
import { t } from '../../../shared/i18n/app.js';
import { notifyText } from '../../../shared/ui/toast.js';
import { withAppLoader } from '../../../shared/ui/loader.js';

const ACCOUNT_AVATAR_MAX_SIDE = 512;
const ACCOUNT_AVATAR_QUALITY = 0.86;
const ACCOUNT_AVATAR_OUTPUT_TYPE = 'image/jpeg';
const ACCOUNT_AVATAR_PROCESSING_ERRORS = new Set([
  'Failed to read image file',
  'Failed to load image file',
  'Failed to prepare image file',
]);

function syncStoredSessionUser(user) {
  state.user = user;

  const session = getStoredSession();
  if (session?.token) {
    setStoredSession({
      token: session.token,
      user: state.user,
    });
  }
}

function setAccountControlsDisabled(disabled) {
  const controls = [
    refs.saveAccountProfileBtn,
    refs.updateProfileBtn,
    refs.accountAvatarButton,
    refs.accountAvatarRemoveBtn,
    refs.accountAvatarInput,
  ];

  controls.forEach(control => {
    if (control) control.disabled = disabled;
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file'));
    };

    image.src = objectUrl;
  });
}

async function createAvatarDataUrl(file) {
  const image = await loadImageFromFile(file);
  const sourceWidth = image.naturalWidth || image.width || 0;
  const sourceHeight = image.naturalHeight || image.height || 0;

  if (!sourceWidth || !sourceHeight) {
    throw new Error('Failed to load image file');
  }

  const maxSide = Math.max(sourceWidth, sourceHeight);
  const scale = Math.min(1, ACCOUNT_AVATAR_MAX_SIDE / maxSide);
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Failed to prepare image file');
  }

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL(ACCOUNT_AVATAR_OUTPUT_TYPE, ACCOUNT_AVATAR_QUALITY);
}

function resolveAccountProfileErrorMessage(error, { photo = false } = {}) {
  const message = error instanceof Error ? error.message : String(error || '');

  if (message === 'Request body is too large') {
    return t('profile_photo_too_large');
  }

  if (photo && ACCOUNT_AVATAR_PROCESSING_ERRORS.has(message)) {
    return t('profile_photo_upload_failed');
  }

  return message || t('update_profile_failed');
}

async function saveAccountProfile(payload, successMessage, { photo = false } = {}) {
  let succeeded = false;

  await withAppLoader(async () => {
    setAccountControlsDisabled(true);

    try {
      const data = await updateMyProfile(payload);
      syncStoredSessionUser(data.user);
      renderAuthenticatedState();
      notifyText(successMessage || t('account_profile_updated'), 'success');
      succeeded = true;
    } catch (error) {
      notifyText(resolveAccountProfileErrorMessage(error, { photo }), 'error');
    } finally {
      setAccountControlsDisabled(false);
    }
  });

  return succeeded;
}

export async function refreshAccountData({ resetTab = false } = {}) {
  await withAppLoader(async () => {
    const hadUser = Boolean(state.user);

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

      // fetchApi may rotate the access token during a 401 refresh, so read the latest stored value.
      const session = getStoredSession();
      if (session?.token) {
        setStoredSession({
          token: session.token,
          user: state.user,
        });
      }

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
  });
}

export async function handleLogoutClick() {
  await withAppLoader(async () => {
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
  });
}

export async function handleDeleteAccountClick() {
  if (!state.user) return;
  if (!window.confirm(t('delete_account_confirm'))) return;

  await withAppLoader(async () => {
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
  });
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

  await withAppLoader(async () => {
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
  });
}

export async function handleUpdateAccountClick() {
  if (!state.user) return;

  const nextName = refs.accountDisplayName?.value.trim() || '';
  if (!nextName) {
    notifyText(t('account_name_required'), 'error');
    return;
  }

  await saveAccountProfile({ name: nextName }, t('account_profile_updated'));
}

export function handleAccountAvatarButtonClick() {
  if (!state.user) return;
  refs.accountAvatarInput?.click();
}

export async function handleAccountAvatarRemoveClick() {
  if (!state.user) return;
  if (!state.user.profile?.avatarUrl) return;

  syncAccountAvatarPreview({
    avatarUrl: '',
    name: state.user.name || state.user.email || '',
  });

  const succeeded = await saveAccountProfile(
    { avatarUrl: '' },
    t('account_photo_removed'),
    { photo: true },
  );
  if (!succeeded) {
    renderAuthenticatedState();
  }
}

export async function handleAccountAvatarChange(event) {
  if (!state.user) return;

  const input = event.currentTarget;
  const file = input?.files?.[0];

  if (!file) return;
  if (!file.type.startsWith('image/')) {
    notifyText(t('profile_photo_invalid'), 'error');
    input.value = '';
    return;
  }

  let dataUrl = '';
  try {
    try {
      dataUrl = await createAvatarDataUrl(file);
    } catch {
      dataUrl = await readFileAsDataUrl(file);
    }
  } catch (error) {
    notifyText(error.message || t('update_profile_failed'), 'error');
    input.value = '';
    return;
  }

  syncAccountAvatarPreview({
    avatarUrl: dataUrl,
    name: state.user.name || state.user.email || '',
  });

  const succeeded = await saveAccountProfile(
    { avatarUrl: dataUrl },
    t('account_photo_updated'),
    { photo: true },
  );
  if (!succeeded) {
    renderAuthenticatedState();
  }
  input.value = '';
}

export async function handleRequestUpgradeClick() {
  if (!state.user) return;

  const planId =
    refs.accountUpgradePlan?.value ||
    refs.accountUpgradePlan?.querySelector('option[value]:not([value=""])')?.value ||
    '';
  if (!planId) {
    notifyText(t('choose_paid_plan_validation'), 'error');
    return;
  }

  await withAppLoader(async () => {
    if (refs.requestUpgradeBtn) refs.requestUpgradeBtn.disabled = true;

    try {
      const data = await requestSubscriptionUpgrade({ planId });
      state.user = data.user;

      const session = getStoredSession();
      if (session?.token) {
        setStoredSession({ token: session.token, user: state.user });
      }

      notifyText(t('upgrade_requested'), 'success');
      renderAuthenticatedState();
    } catch (error) {
      notifyText(error.message || t('request_upgrade_failed'), 'error');
    } finally {
      if (refs.requestUpgradeBtn) refs.requestUpgradeBtn.disabled = false;
    }
  });
}
