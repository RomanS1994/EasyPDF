const SESSION_KEY = 'pdf-app-session';

export function getStoredSession() {
  const raw = localStorage.getItem(SESSION_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function getSessionToken() {
  return getStoredSession()?.token || '';
}

export function setStoredSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_KEY);
}
