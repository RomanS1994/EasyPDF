import { fetchApi } from '../../shared/api/client.js';
import { readJsonResponse } from '../../shared/api/response.js';
import { t } from '../../shared/i18n/app.js';

export async function register(payload) {
  const response = await fetchApi('/auth/register', {
    method: 'POST',
    body: payload,
    skipAuthRefresh: true,
  });

  return readJsonResponse(response, t('register_failed'));
}

export async function login(payload) {
  const response = await fetchApi('/auth/login', {
    method: 'POST',
    body: payload,
    skipAuthRefresh: true,
  });

  return readJsonResponse(response, t('sign_in_failed'));
}

export async function logout() {
  const response = await fetchApi('/auth/logout', {
    method: 'POST',
    skipAuthRefresh: true,
  });

  return readJsonResponse(response, t('sign_out_failed'));
}

export async function refreshSession() {
  const response = await fetchApi('/auth/refresh', {
    method: 'POST',
    skipAuthRefresh: true,
  });

  return readJsonResponse(response, t('session_refresh_failed'));
}

export async function getMe() {
  const response = await fetchApi('/me');
  return readJsonResponse(response, t('api_account_failed'));
}

export async function deleteMe() {
  const response = await fetchApi('/me', { method: 'DELETE' });
  return readJsonResponse(response, t('delete_account_failed'));
}

export async function updateMyProfile(profile) {
  const response = await fetchApi('/me/profile', {
    method: 'PATCH',
    body: { profile },
  });

  return readJsonResponse(response, t('update_profile_failed'));
}

export async function requestSubscriptionUpgrade(payload) {
  const response = await fetchApi('/me/subscription/upgrade-request', {
    method: 'POST',
    body: payload,
  });

  return readJsonResponse(response, t('request_upgrade_failed'));
}
