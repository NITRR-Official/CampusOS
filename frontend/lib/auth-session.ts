import type { AuthResponseData } from '@plugins/auth/frontend/api';

const AUTH_STORAGE_KEY = 'campusos.auth-session';
const AUTH_SESSION_EVENT = 'campusos.auth-session-change';

function emitAuthSessionChange() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export function storeAuthSession(data: AuthResponseData | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!data?.accessToken) {
    clearAuthSession();
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  document.cookie = `campusos_access_token=${data.accessToken}; path=/; max-age=604800; SameSite=Lax`;
  emitAuthSessionChange();
}

export function readAuthSession(): AuthResponseData | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthResponseData;
  } catch {
    return null;
  }
}

export function readAccessToken() {
  return readAuthSession()?.accessToken || null;
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  document.cookie =
    'campusos_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  emitAuthSessionChange();
}

export function subscribeAuthSession(
  callback: (session: AuthResponseData | null) => void
) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== AUTH_STORAGE_KEY) {
      return;
    }
    callback(readAuthSession());
  };

  const handleEvent = () => {
    callback(readAuthSession());
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(AUTH_SESSION_EVENT, handleEvent);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(AUTH_SESSION_EVENT, handleEvent);
  };
}
