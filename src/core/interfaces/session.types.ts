export interface Session {
  id: string; // The JWT ID (jti) or secure random string
  userId: bigint;
  deviceInfo: string | null; // e.g., 'MacBook Pro - Chrome'
  expiresAt: Date;
  createdAt: Date;
}
