import * as z from 'zod';

import { passwordSchema } from '@/modules/auth/schemas/auth.schemas';

/** Username: 3–30 chars, alphanumeric + underscore. Unique (checked in service). */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric or underscore only');

export const updateMeSchema = z.object({
  username: z.union([usernameSchema, z.literal('').transform(() => null), z.null()]).optional(),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;

/** Avatar upload URL request */
export const avatarUploadUrlSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  contentLength: z
    .number()
    .int()
    .positive()
    .max(2 * 1024 * 1024, 'Max 2MB'),
});
export type AvatarUploadUrlInput = z.infer<typeof avatarUploadUrlSchema>;

/** Avatar confirm (after client upload) */
export const avatarConfirmSchema = z.object({
  objectKey: z.string().min(1, 'objectKey required'),
});
export type AvatarConfirmInput = z.infer<typeof avatarConfirmSchema>;

/** Change password: requires current password; new password must meet policy. */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
