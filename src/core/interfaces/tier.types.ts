export type TierName = 'free' | 'premium';

export interface TierFeatures {
  auth: {
    maxSessions: number;
  };
  /** Requests per minute for general API (tier-based rate limiting). */
  rateLimit: {
    requestsPerMinute: number;
  };
  [key: string]: unknown;
}

export interface Tier {
  id: number;
  name: TierName;
  features: TierFeatures;
}
