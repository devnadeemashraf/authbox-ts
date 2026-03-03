import { inject, injectable } from 'tsyringe';

import { PaymentRepository } from '../repositories/payment.repository';
import { SubscriptionRepository } from '../repositories/subscription.repository';

import { Tokens } from '@/core/di/tokens';
import type { Payment, Subscription } from '@/core/interfaces/subscription.types';

export interface SubscriptionStatusResult {
  subscription: Subscription | null;
  payments: Payment[];
}

/**
 * Returns current subscription and payment history for a user.
 * Used for visibility and UI display.
 */
@injectable()
export class GetSubscriptionStatusService {
  constructor(
    @inject(Tokens.Subscriptions.SubscriptionRepository)
    private readonly subscriptionRepo: SubscriptionRepository,
    @inject(Tokens.Subscriptions.PaymentRepository)
    private readonly paymentRepo: PaymentRepository,
  ) {}

  async execute(userId: string): Promise<SubscriptionStatusResult> {
    const subscription = await this.subscriptionRepo.findByUserId(userId);
    if (!subscription) {
      return { subscription: null, payments: [] };
    }

    const payments = await this.paymentRepo.findBySubscriptionId(subscription.id);
    return { subscription, payments };
  }
}
