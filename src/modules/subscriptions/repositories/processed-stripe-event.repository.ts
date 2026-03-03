import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import { Tokens } from '@/core/di/tokens';

@injectable()
export class ProcessedStripeEventRepository {
  private readonly tableName = 'processed_stripe_events';

  constructor(@inject(Tokens.Infrastructure.Database) private readonly db: Knex) {}

  async exists(stripeEventId: string): Promise<boolean> {
    const row = await this.db(this.tableName).where('stripeEventId', stripeEventId).first();
    return !!row;
  }

  async insert(stripeEventId: string): Promise<void> {
    await this.db(this.tableName).insert({ stripeEventId });
  }
}
