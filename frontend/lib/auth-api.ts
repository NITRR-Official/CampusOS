export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

export interface AuthResponseData {
  user: AuthUser;
  accessToken: string;
  tokenType: 'Bearer';
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function requestAuth(path: string, body: Record<string, string>) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      json?.message || 'Request failed',
      response.status,
      json?.code,
      json?.details
    );
  }

  return (json?.data || null) as AuthResponseData | null;
}

export function signup(payload: {
  name: string;
  email: string;
  password: string;
}) {
  return requestAuth('/api/v1/auth/signup', payload);
}

export function login(payload: { email: string; password: string }) {
  return requestAuth('/api/v1/auth/login', payload);
}
