import type { Knex } from 'knex';
import Stripe from 'stripe';
import { inject, injectable } from 'tsyringe';

import { env } from '@/config/env';
import { TIER_BY_ID } from '@/core/config/tiers.config';
import { Tokens } from '@/core/di/tokens';
import { BadRequestError, ForbiddenError, ServiceUnavailableError } from '@/core/errors';
import type { UserCache } from '@/infrastructure/cache/user-cache';

const PREMIUM_TIER_ID =
  Number(Object.entries(TIER_BY_ID).find(([, t]) => t.name === 'premium')?.[0]) || 2;

/**
 * Confirms a Checkout Session and fulfills the subscription.
 * Used as a FALLBACK for local development when stripe listen isn't running.
 *
 * Security: Verifies session belongs to user (client_reference_id === userId),
 * payment_status === 'paid', and runs same fulfillment logic as webhook.
 * In production, webhooks remain the primary path.
 */
@injectable()
export class ConfirmCheckoutSessionService {
  private stripe: Stripe | null = null;

  constructor(
    @inject(Tokens.Infrastructure.Database) private readonly db: Knex,
    @inject(Tokens.Cache.UserCache) private readonly userCache: UserCache,
  ) {
    if (env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(env.STRIPE_SECRET_KEY);
    }
  }

  async execute(userId: string, sessionId: string): Promise<{ success: boolean }> {
    if (!this.stripe) {
      throw new ServiceUnavailableError({
        message: 'Stripe is not configured',
      });
    }

    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (session.payment_status !== 'paid') {
      throw new BadRequestError({
        message: 'Session payment is not complete',
      });
    }

    const sessionUserId =
      (session.client_reference_id as string) || (session.metadata?.userId as string);
    if (!sessionUserId || sessionUserId !== userId) {
      throw new ForbiddenError({
        message: 'This session does not belong to you',
      });
    }

    const subscription = session.subscription;
    if (!subscription) {
      throw new BadRequestError({
        message: 'No subscription found in session',
      });
    }

    // When expand: ['subscription'] is used, subscription is the full object; otherwise it's a string ID.
    // Always retrieve by ID to ensure consistent format (expanded object may have different structure).
    const subId =
      typeof subscription === 'string' ? subscription : (subscription as { id?: string }).id;
    if (!subId) {
      throw new BadRequestError({
        message: 'Invalid subscription data from session',
      });
    }

    // Stripe API 2025+ (Basil): current_period_start/end moved to subscription items
    const stripeSub = (await this.stripe.subscriptions.retrieve(subId, {
      expand: ['items.data'],
    })) as unknown as Record<string, unknown>;

    const items = stripeSub.items as { data?: Array<Record<string, unknown>> } | undefined;
    const firstItem = items?.data?.[0];
    const periodStart =
      (firstItem?.current_period_start as number) ??
      (firstItem?.currentPeriodStart as number) ??
      (stripeSub.current_period_start as number) ??
      (stripeSub.currentPeriodStart as number);
    const periodEnd =
      (firstItem?.current_period_end as number) ??
      (firstItem?.currentPeriodEnd as number) ??
      (stripeSub.current_period_end as number) ??
      (stripeSub.currentPeriodEnd as number);

    if (typeof periodStart !== 'number' || typeof periodEnd !== 'number') {
      throw new BadRequestError({
        message: 'Invalid subscription period data from Stripe',
      });
    }

    const status = stripeSub.status as string;
    const isActive = status === 'active' || status === 'trialing';

    const subData = {
      userId,
      stripeCustomerId: stripeSub.customer as string,
      stripeSubscriptionId: stripeSub.id as string,
      tierId: PREMIUM_TIER_ID,
      status,
      currentPeriodStart: new Date(periodStart * 1000),
      currentPeriodEnd: new Date(periodEnd * 1000),
      cancelAtPeriodEnd: (stripeSub.cancel_at_period_end ??
        stripeSub.cancelAtPeriodEnd ??
        false) as boolean,
      renewalReminderSentAt: null,
    };

    await this.db.transaction(async (trx: Knex.Transaction) => {
      const existing = await trx('subscriptions').where('userId', userId).first();
      if (existing) {
        await trx('subscriptions')
          .where('userId', userId)
          .update({
            ...subData,
            updatedAt: new Date(),
          });
      } else {
        await trx('subscriptions').insert(subData);
      }

      if (isActive) {
        await trx('users').where('id', userId).update({ tierId: PREMIUM_TIER_ID });
      }
    });

    if (isActive) await this.userCache.invalidateUser(userId);

    return { success: true };
  }
}
