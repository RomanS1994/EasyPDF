const AUTH_SESSION_KEY = 'react-auth-session';

function readSession() {
  try {
    if (typeof localStorage === 'undefined') return null;

    const rawValue = localStorage.getItem(AUTH_SESSION_KEY);
    if (!rawValue) return null;

    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue || typeof parsedValue !== 'object') return null;

    return parsedValue;
  } catch {
    return null;
  }
}

export function getToken() {
  return readSession()?.token || '';
}

export function getStoredUser() {
  return readSession()?.user || null;
}

export function saveSession(token, user) {
  try {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ token, user }));
  } catch {
    // Ignore storage errors.
  }
}

export function clearSession() {
  try {
    if (typeof localStorage === 'undefined') return;

    localStorage.removeItem(AUTH_SESSION_KEY);
  } catch {
    // Ignore storage errors.
  }
}
