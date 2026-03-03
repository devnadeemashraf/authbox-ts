export type VerificationTokenType = 'email_verify' | 'password_reset';

export interface VerificationToken {
  id: string;
  userId: string;
  type: VerificationTokenType;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}
