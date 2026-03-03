import Stripe from 'stripe';
import { inject, injectable } from 'tsyringe';

import { env } from '@/config/env';
import { TIER_BY_ID } from '@/core/config/tiers.config';

const PREMIUM_TIER_ID =
  Number(Object.entries(TIER_BY_ID).find(([, t]) => t.name === 'premium')?.[0]) || 2;
import { SubscriptionRepository } from '../repositories/subscription.repository';

import { Tokens } from '@/core/di/tokens';
import { ForbiddenError, NotFoundError, ServiceUnavailableError } from '@/core/errors';
import { UserRepository } from '@/modules/users/repositories/user.repository';

/**
 * Creates a Stripe Checkout Session for upgrading to premium.
 * Returns the checkout URL. User pays on Stripe; tier upgrade happens via webhook.
 *
 * Security: Tier upgrade NEVER happens here. Only Stripe webhook can upgrade.
 */
@injectable()
export class CreateCheckoutSessionService {
  private stripe: Stripe | null = null;

  constructor(
    @inject(Tokens.Users.UserRepository) private readonly userRepo: UserRepository,
    @inject(Tokens.Subscriptions.SubscriptionRepository)
    private readonly subscriptionRepo: SubscriptionRepository,
  ) {
    if (env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(env.STRIPE_SECRET_KEY);
    }
  }

  async execute(userId: string): Promise<{ url: string }> {
    if (!this.stripe || !env.STRIPE_PREMIUM_PRICE_ID) {
      throw new ServiceUnavailableError({
        message: 'Subscription checkout is not configured',
      });
    }

    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError({ message: 'User not found' });

    if (user.tierId === PREMIUM_TIER_ID) {
      throw new ForbiddenError({
        message: 'You already have a premium subscription',
      });
    }

    const existing = await this.subscriptionRepo.findByUserId(userId);
    if (existing?.status === 'active') {
      throw new ForbiddenError({
        message: 'You already have an active subscription',
      });
    }

    const session = await this.stripe!.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: env.STRIPE_PREMIUM_PRICE_ID, quantity: 1 }],
      success_url: `${env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.FRONTEND_URL}/subscription/cancel`,
      customer_email: user.email,
      client_reference_id: userId,
      metadata: { userId },
    });

    const url = session.url;
    if (!url) {
      throw new ServiceUnavailableError({
        message: 'Stripe did not return a checkout URL',
      });
    }

    return { url };
  }
}
