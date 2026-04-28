const GENERATION_SESSION_KEY = 'react-generation-session';

export function loadGenerationSession() {
  try {
    if (typeof localStorage === 'undefined') return null;

    const rawValue = localStorage.getItem(GENERATION_SESSION_KEY);
    if (!rawValue) return null;

    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue || typeof parsedValue !== 'object') return null;

    return parsedValue;
  } catch {
    return null;
  }
}

export function saveGenerationSession(session) {
  try {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(GENERATION_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage errors.
  }
}

export function clearGenerationSession() {
  try {
    if (typeof localStorage === 'undefined') return;

    localStorage.removeItem(GENERATION_SESSION_KEY);
  } catch {
    // Ignore storage errors.
  }
}
