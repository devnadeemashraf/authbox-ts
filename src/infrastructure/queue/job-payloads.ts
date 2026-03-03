/**
 * Job payload types. Each queue has a specific payload shape.
 */

export interface EmailVerificationJobPayload {
  userId: string;
  email: string;
  otp: string;
}

export interface WelcomeEmailJobPayload {
  email: string;
  name?: string;
}

export interface PasswordResetJobPayload {
  userId: string;
  email: string;
  otp: string;
}
