import { fetchApi } from '../settings.js';
import { readJsonResponse } from '../utils.js';

export async function API_register(payload) {
  const response = await fetchApi('/auth/register', {
    method: 'POST',
    body: payload,
  });

  return readJsonResponse(response, 'Не вдалося зареєструватися');
}

export async function API_login(payload) {
  const response = await fetchApi('/auth/login', {
    method: 'POST',
    body: payload,
  });

  return readJsonResponse(response, 'Не вдалося увійти');
}

export async function API_logout() {
  const response = await fetchApi('/auth/logout', {
    method: 'POST',
  });

  return readJsonResponse(response, 'Не вдалося вийти');
}

export async function API_getMe() {
  const response = await fetchApi('/me', {
    method: 'GET',
  });

  return readJsonResponse(response, 'Не вдалося завантажити поточного користувача');
}

export async function API_deleteMe() {
  const response = await fetchApi('/me', {
    method: 'DELETE',
  });

  return readJsonResponse(response, 'Не вдалося видалити акаунт');
}

export async function API_updateMyProfile(profile) {
  const response = await fetchApi('/me/profile', {
    method: 'PATCH',
    body: { profile },
  });

  return readJsonResponse(response, 'Не вдалося оновити профіль');
}
