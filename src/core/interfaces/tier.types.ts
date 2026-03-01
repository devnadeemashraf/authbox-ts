export type TierName = 'free' | 'premium';

export interface TierFeatures {
  // allow for dynamic additions without breaking the type (good to begin with)
  auth: {
    maxSessions: number;
  };
  [key: string]: unknown;
}

export interface Tier {
  id: number;
  name: TierName;
  features: TierFeatures;
}
