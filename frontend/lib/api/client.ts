import { ApiError } from './errors';
import { readAccessToken } from '../auth-session';

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const baseUrl = rawBaseUrl.replace(/\/+$/, '');
export const API_BASE_URL = baseUrl.endsWith('/api/v1')
  ? baseUrl
  : `${baseUrl}/api/v1`;

interface RequestOptions extends RequestInit {
  accessToken?: string | null;
}

/**
 * Core fetch wrapper that automatically handles base URLs, tokens, and standard error parsing.
 */
async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { accessToken, ...init } = options;

  // Normalize path: strip leading /api/v1 if present to avoid duplication
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  cleanPath = cleanPath.replace(/^(?:\/api\/v1)+/, '');
  if (cleanPath && !cleanPath.startsWith('/') && !cleanPath.startsWith('?')) {
    cleanPath = `/${cleanPath}`;
  }

  // Resolve token: explicit token > auth-session token > null
  const token = accessToken !== undefined ? accessToken : readAccessToken();

  const headers = new Headers(init.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${cleanPath}`, {
    ...init,
    headers
  });

  // Safe parsing
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      json?.message || json?.error || 'Request failed',
      response.status,
      json?.error,
      json?.details,
      json?.requestId
    );
  }

  // The backend might return data wrapped in `data` or as the raw response.
  // E.g., { success: true, data: { ... } } or just { ... }
  if (json && typeof json === 'object') {
    if ('success' in json && 'data' in json) {
      return json.data as T;
    }
  }

  return json as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    }),

  put: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body)
    }),

  delete: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined
    })
};
