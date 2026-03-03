import * as z from 'zod';

export const registerSchema = z.object({
  email: z.email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type LogoutInput = z.infer<typeof logoutSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshInput = z.infer<typeof refreshSchema>;

export const oauthInitiateSchema = z.object({
  success_redirect: z.string().url().optional(),
});

export type OAuthInitiateInput = z.infer<typeof oauthInitiateSchema>;

export const oauthCallbackSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  state: z.string().min(1, 'State is required'),
});

export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>;

export const verifyOtpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

/** Shared password policy: min 12 chars, 1 upper, 1 lower, 1 number, 1 special */
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const forgotPasswordSchema = z.object({
  email: z.email('Invalid email format'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const verifyPasswordResetOtpSchema = z.object({
  email: z.email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
});

export type VerifyPasswordResetOtpInput = z.infer<typeof verifyPasswordResetOtpSchema>;

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Session id (UUID) for revoke endpoint */
export const sessionIdParamSchema = z.object({
  id: z.string().uuid('Invalid session id'),
});
export type SessionIdParam = z.infer<typeof sessionIdParamSchema>;
