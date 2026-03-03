import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import { BaseRepository } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import type { Subscription } from '@/core/interfaces/subscription.types';

@injectable()
export class SubscriptionRepository extends BaseRepository<Subscription> {
  protected tableName = 'subscriptions';

  constructor(@inject(Tokens.Infrastructure.Database) db: Knex) {
    super(db);
  }

  protected toEntity(row: Record<string, unknown>): Subscription {
    return {
      id: row.id as string,
      userId: row.userId as string,
      stripeCustomerId: row.stripeCustomerId as string,
      stripeSubscriptionId: row.stripeSubscriptionId as string,
      tierId: Number(row.tierId),
      status: row.status as Subscription['status'],
      currentPeriodStart: new Date(row.currentPeriodStart as string),
      currentPeriodEnd: new Date(row.currentPeriodEnd as string),
      cancelAtPeriodEnd: Boolean(row.cancelAtPeriodEnd),
      renewalReminderSentAt: row.renewalReminderSentAt
        ? new Date(row.renewalReminderSentAt as string)
        : null,
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    };
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    return this.findOne({ userId });
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    return this.findOne({ stripeSubscriptionId });
  }

  /**
   * Subscriptions due for renewal reminder (currentPeriodEnd in next 7 days, reminder not sent).
   */
  async findDueForReminder(now: Date): Promise<Subscription[]> {
    const rows = await this.db(this.tableName)
      .where('status', 'active')
      .whereNull('renewalReminderSentAt')
      .where('currentPeriodEnd', '>', now)
      .where('currentPeriodEnd', '<=', new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));

    return rows.map((r) => this.toEntity(r as Record<string, unknown>));
  }

  /**
   * Subscriptions past grace period that should be demoted.
   * currentPeriodEnd was more than 7 days ago and status indicates non-renewal.
   */
  async findDueForDemotion(now: Date): Promise<Subscription[]> {
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.db(this.tableName)
      .whereIn('status', ['canceled', 'past_due', 'unpaid', 'incomplete_expired'])
      .where('currentPeriodEnd', '<', cutoff);

    return rows.map((r) => this.toEntity(r as Record<string, unknown>));
  }

  /** Creates a subscription within a transaction. Used by webhook handler. */
  async createWithTrx(trx: Knex.Transaction, data: Record<string, unknown>): Promise<Subscription> {
    const [row] = await trx(this.tableName).insert(data).returning('*');
    if (!row) throw new Error('Insert subscription returned no row');
    return this.toEntity(row as Record<string, unknown>);
  }

  /** Updates subscription within a transaction. */
  async updateWithTrx(
    trx: Knex.Transaction,
    id: string,
    data: Record<string, unknown>,
  ): Promise<Subscription | null> {
    const [row] = await trx(this.tableName).where(this.idColumn, id).update(data).returning('*');
    return row ? this.toEntity(row as Record<string, unknown>) : null;
  }
}
