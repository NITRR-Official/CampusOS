import { apiClient } from './api/client';
export { ApiError } from './api/errors';

export type UserRole = 'admin' | 'coordinator' | 'volunteer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface AuthResponseData {
  user: AuthUser;
  accessToken: string;
  tokenType: 'Bearer';
}

export function signup(payload: {
  name: string;
  email: string;
  password: string;
}) {
  return apiClient.post<AuthResponseData>('/api/v1/auth/signup', payload);
}

export function login(payload: { email: string; password: string }) {
  return apiClient.post<AuthResponseData>('/api/v1/auth/login', payload);
}
