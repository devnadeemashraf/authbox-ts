import type { TierFeatures, TierName } from '../interfaces/tier.types';

/**
 * Single source of truth for tier definitions.
 * Used by: seeds (DB insert), business logic (limits, validation).
 * Update here → run db:seed → DB and code stay in sync.
 */
export const TIER_DEFINITIONS: ReadonlyArray<{
  name: TierName;
  features: TierFeatures;
}> = [
  {
    name: 'free',
    features: { auth: { maxSessions: 1 } },
  },
  {
    name: 'premium',
    features: { auth: { maxSessions: 3 } },
  },
] as const;

/** Lookup by name – use in services for limit checks */
export const TIER_BY_NAME = Object.fromEntries(TIER_DEFINITIONS.map((t) => [t.name, t])) as Record<
  TierName,
  (typeof TIER_DEFINITIONS)[number]
>;

/** Lookup by id (1-based, matches DB after seed) – use when user has tierId */
export const TIER_BY_ID = Object.fromEntries(TIER_DEFINITIONS.map((t, i) => [i + 1, t])) as Record<
  number,
  (typeof TIER_DEFINITIONS)[number]
>;
