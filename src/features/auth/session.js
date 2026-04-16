import {
  readStorageJson,
  removeStorageItem,
  writeStorageJson,
} from '../../shared/lib/storage.js';

const SESSION_KEY = 'pdf-app-session';

export function getStoredSession() {
  return readStorageJson(SESSION_KEY, null);
}

export function getSessionToken() {
  return getStoredSession()?.token || '';
}

export function setStoredSession(session) {
  writeStorageJson(SESSION_KEY, session);
}

export function clearStoredSession() {
  removeStorageItem(SESSION_KEY);
}
