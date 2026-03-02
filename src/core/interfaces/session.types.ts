export interface Session {
  id: string; // The JWT ID (jti) or secure random string
  userId: string; // UUID
  deviceInfo: string | null; // e.g., 'MacBook Pro - Chrome'
  ipAddress: string | null; // IPv4 or IPv6
  expiresAt: Date;
  createdAt: Date;
}
