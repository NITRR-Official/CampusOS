import { apiClient } from '@campus-os/shared/api-client';
import { z } from 'zod';
export { ApiError } from '@campus-os/shared/api-errors';

import {
  AuthResponseSchema,
  type AuthResponseData,
  type AuthUser,
  type UserRole,
  UserRoleSchema,
  AuthUserSchema
} from '@campus-os/shared/auth-types';

export {
  AuthResponseSchema,
  type AuthResponseData,
  type AuthUser,
  type UserRole,
  UserRoleSchema,
  AuthUserSchema
};

// 3. API Fetchers with Zod Validation
export function signup(payload: {
  name: string;
  email: string;
  password: string;
}) {
  return apiClient.post<AuthResponseData>('/auth/signup', payload, {
    schema: AuthResponseSchema
  });
}

export function login(payload: { email: string; password: string }) {
  return apiClient.post<AuthResponseData>('/auth/login', payload, {
    schema: AuthResponseSchema
  });
}
