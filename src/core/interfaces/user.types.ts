import { Tier } from '@core/interfaces/tier.types';

export interface User {
  id: string; // UUID
  email: string;
  username: string | null;
  passwordHash: string | null; // Nullable for users who only use OAuth
  isEmailVerified: boolean;
  avatarUrl: string | null; // Object key or URL for avatar (e.g. avatars/{userId}/{uuid}.ext)

  permissions: number; // Bitmask integer
  tierId: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithTier extends User {
  tier: Tier;
}
