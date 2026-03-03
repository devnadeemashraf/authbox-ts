import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import { BaseRepository } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import type { Payment } from '@/core/interfaces/subscription.types';

@injectable()
export class PaymentRepository extends BaseRepository<Payment> {
  protected tableName = 'payments';

  constructor(@inject(Tokens.Infrastructure.Database) db: Knex) {
    super(db);
  }

  protected toEntity(row: Record<string, unknown>): Payment {
    return {
      id: row.id as string,
      subscriptionId: row.subscriptionId as string,
      stripeInvoiceId: (row.stripeInvoiceId as string | null) ?? null,
      stripePaymentIntentId: (row.stripePaymentIntentId as string | null) ?? null,
      amountCents: Number(row.amountCents),
      currency: (row.currency as string) ?? 'usd',
      status: row.status as Payment['status'],
      paidAt: row.paidAt ? new Date(row.paidAt as string) : null,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      createdAt: new Date(row.createdAt as string),
    };
  }

  async findBySubscriptionId(subscriptionId: string): Promise<Payment[]> {
    const rows = await this.db(this.tableName)
      .where('subscriptionId', subscriptionId)
      .orderBy('paidAt', 'desc');

    return rows.map((r) => this.toEntity(r as Record<string, unknown>));
  }
}
