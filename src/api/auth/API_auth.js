import { fetchApi } from '../settings.js';
import { readJsonResponse } from '../utils.js';
import { t } from '../../js/i18n/app.js';

export async function API_register(payload) {
  const response = await fetchApi('/auth/register', {
    method: 'POST',
    body: payload,
  });

  return readJsonResponse(response, t('api_registration_failed'));
}

export async function API_login(payload) {
  const response = await fetchApi('/auth/login', {
    method: 'POST',
    body: payload,
  });

  return readJsonResponse(response, t('api_login_failed'));
}

export async function API_logout() {
  const response = await fetchApi('/auth/logout', {
    method: 'POST',
  });

  return readJsonResponse(response, t('api_logout_failed'));
}

export async function API_refreshSession() {
  const response = await fetchApi('/auth/refresh', {
    method: 'POST',
    skipAuthRefresh: true,
  });

  return readJsonResponse(response, t('api_current_user_failed'));
}

export async function API_getMe() {
  const response = await fetchApi('/me', {
    method: 'GET',
  });

  return readJsonResponse(response, t('api_current_user_failed'));
}

export async function API_deleteMe() {
  const response = await fetchApi('/me', {
    method: 'DELETE',
  });

  return readJsonResponse(response, t('api_delete_account_failed'));
}

export async function API_updateMyProfile(profile) {
  const response = await fetchApi('/me/profile', {
    method: 'PATCH',
    body: { profile },
  });

  return readJsonResponse(response, t('api_update_profile_failed'));
}
