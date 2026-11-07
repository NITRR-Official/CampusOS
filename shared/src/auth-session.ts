import type { AuthResponseData } from './auth-types';

const AUTH_STORAGE_KEY = 'campusos.auth-session';
const AUTH_SESSION_EVENT = 'campusos.auth-session-change';

function emitAuthSessionChange() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export function parseJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = JSON.parse(globalThis.atob(padded));
    return typeof decoded.exp === 'number' ? decoded.exp : null;
  } catch {
    return null;
  }
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(^|;\\s*)' + name + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[2]) : null;
}

function calculateCookieMaxAge(token: string): number {
  const exp = parseJwtExp(token);
  if (exp) {
    const remaining = Math.floor(exp - Date.now() / 1000);
    return Math.max(0, remaining);
  }
  // Default to 7 days (604800 seconds) if no exp claim
  return 7 * 24 * 60 * 60;
}

export function ensureAuthCookie(data: AuthResponseData | null) {
  if (typeof window === 'undefined' || !data?.accessToken) {
    return;
  }

  const maxAge = calculateCookieMaxAge(data.accessToken);
  if (maxAge <= 0) {
    clearAuthSession();
    return;
  }

  const currentCookie = getCookie('campusos_access_token');
  if (currentCookie !== data.accessToken) {
    const isSecure = window.location.protocol === 'https:' ? 'Secure;' : '';
    document.cookie = `campusos_access_token=${data.accessToken}; path=/; max-age=${maxAge}; SameSite=Lax; ${isSecure}`;
  }
}

export function storeAuthSession(data: AuthResponseData | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!data?.accessToken) {
    clearAuthSession();
    return;
  }

  const maxAge = calculateCookieMaxAge(data.accessToken);
  if (maxAge <= 0) {
    clearAuthSession();
    return;
  }

  const isSecure = window.location.protocol === 'https:' ? 'Secure;' : '';
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  document.cookie = `campusos_access_token=${data.accessToken}; path=/; max-age=${maxAge}; SameSite=Lax; ${isSecure}`;
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

  const isSecure = window.location.protocol === 'https:' ? 'Secure;' : '';
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  document.cookie = `campusos_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; ${isSecure}`;
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
