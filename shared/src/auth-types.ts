import { z } from 'zod';

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

export type UserRole = z.infer<typeof UserRoleSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthResponseData = z.infer<typeof AuthResponseSchema>;
