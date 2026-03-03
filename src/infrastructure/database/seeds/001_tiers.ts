import type { Knex } from 'knex';

import { TIER_DEFINITIONS } from '../../../core/config/tiers.config';

export async function seed(knex: Knex): Promise<void> {
  await knex('tiers').del();

  await knex('tiers').insert(
    TIER_DEFINITIONS.map((t) => ({
      name: t.name,
      features: t.features,
    })),
  );
}
