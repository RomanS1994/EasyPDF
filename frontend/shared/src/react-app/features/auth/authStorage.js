const AUTH_SESSION_KEY = 'react-auth-session';

// Безпечно читає збережену auth-сесію з localStorage.
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

// Повертає поточний access token для API-запитів.
export function getToken() {
  return readSession()?.token || '';
}

// Повертає збереженого користувача для bootstrap-а фронта.
export function getStoredUser() {
  return readSession()?.user || null;
}

// Зберігає токен і користувача локально після login або refresh.
export function saveSession(token, user) {
  try {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ token, user }));
  } catch {
    // Ignore storage errors.
  }
}

// Повністю очищає локальну auth-сесію.
export function clearSession() {
  try {
    if (typeof localStorage === 'undefined') return;

    localStorage.removeItem(AUTH_SESSION_KEY);
  } catch {
    // Ignore storage errors.
  }
}
