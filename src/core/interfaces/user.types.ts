import { Tier } from '@core/interfaces/tier.types';

export interface User {
  id: bigint;
  email: string;
  username: string | null;
  passwordHash: string | null; // Nullable for users who only use OAuth
  isEmailVerified: boolean;

  permissions: number; // Bitmask integer
  tierId: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithTier extends User {
  tier: Tier;
}
