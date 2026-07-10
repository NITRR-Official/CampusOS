import { apiClient } from '@/lib/api/client';
import { z } from 'zod';
export { ApiError } from '@/lib/api/errors';

// 1. Zod Schemas
export const UserRoleSchema = z.string();

export const AuthUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  isSuperAdmin: z.boolean().optional(),
  role: UserRoleSchema.optional(),
  createdAt: z.string().optional()
});

export const AuthResponseSchema = z.object({
  user: AuthUserSchema,
  accessToken: z.string(),
  tokenType: z.literal('Bearer')
});

// 2. Inferred Types
export type UserRole = z.infer<typeof UserRoleSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthResponseData = z.infer<typeof AuthResponseSchema>;

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
