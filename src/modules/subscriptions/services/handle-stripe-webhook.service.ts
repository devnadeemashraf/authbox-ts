import type { Knex } from 'knex';
import Stripe from 'stripe';
import { inject, injectable } from 'tsyringe';

import { PaymentRepository } from '../repositories/payment.repository';
import { ProcessedStripeEventRepository } from '../repositories/processed-stripe-event.repository';
import { SubscriptionRepository } from '../repositories/subscription.repository';

import { env } from '@/config/env';
import { TIER_BY_ID } from '@/core/config/tiers.config';
import { Tokens } from '@/core/di/tokens';
import { BadRequestError, ServiceUnavailableError } from '@/core/errors';
import { logger } from '@/core/logger';

const PREMIUM_TIER_ID =
  Number(Object.entries(TIER_BY_ID).find(([, t]) => t.name === 'premium')?.[0]) || 2;
const FREE_TIER_ID =
  Number(Object.entries(TIER_BY_ID).find(([, t]) => t.name === 'free')?.[0]) || 1;

/**
 * Handles Stripe webhook events. Verifies signature, ensures idempotency,
 * and updates subscriptions + users.tierId. Tier upgrade happens ONLY here.
 */
@injectable()
export class HandleStripeWebhookService {
  private stripe: Stripe | null = null;

  constructor(
    @inject(Tokens.Infrastructure.Database) private readonly db: Knex,
    @inject(Tokens.Subscriptions.SubscriptionRepository)
    private readonly subscriptionRepo: SubscriptionRepository,
    @inject(Tokens.Subscriptions.PaymentRepository) private readonly paymentRepo: PaymentRepository,
    @inject(Tokens.Subscriptions.ProcessedStripeEventRepository)
    private readonly processedEventRepo: ProcessedStripeEventRepository,
  ) {
    if (env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(env.STRIPE_SECRET_KEY);
    }
  }

  /**
   * Processes a webhook payload. Raw body and signature must be passed.
   * Caller is responsible for providing the unparsed body (required for signature verification).
   */
  async execute(rawBody: Buffer | string, signature: string | undefined): Promise<void> {
    if (!this.stripe || !env.STRIPE_WEBHOOK_SECRET) {
      throw new ServiceUnavailableError({
        message: 'Stripe webhooks are not configured',
      });
    }

    if (!signature) {
      throw new BadRequestError({
        message: 'Missing Stripe-Signature header',
      });
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      ) as Stripe.Event;
    } catch (err) {
      throw new BadRequestError({
        message: 'Invalid Stripe webhook signature',
        cause: err instanceof Error ? err : undefined,
      });
    }

    const alreadyProcessed = await this.processedEventRepo.exists(event.id);
    if (alreadyProcessed) {
      logger.debug(
        { eventId: event.id, type: event.type },
        'Stripe webhook already processed, skipping',
      );
      return;
    }

    logger.info({ eventId: event.id, type: event.type }, 'Processing Stripe webhook');

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }

    await this.processedEventRepo.insert(event.id);
    logger.info({ eventId: event.id, type: event.type }, 'Stripe webhook processed successfully');
  }

  /**
   * Primary fulfillment path. checkout.session.completed has userId (client_reference_id).
   * We create subscription + upgrade user. Idempotent via processed_stripe_events.
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    if (session.payment_status !== 'paid') return;

    const userId = (session.client_reference_id as string) || (session.metadata?.userId as string);
    if (!userId) return;

    const subscriptionId = session.subscription as string | null;
    if (!subscriptionId) return;

    const existingByStripeId =
      await this.subscriptionRepo.findByStripeSubscriptionId(subscriptionId);
    if (existingByStripeId) return;

    const existingByUser = await this.subscriptionRepo.findByUserId(userId);
    const stripeSub = (await this.stripe!.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data'],
    })) as unknown as Record<string, unknown>;

    const { periodStart, periodEnd } = this.extractPeriodFromSubscription(stripeSub);
    const status = stripeSub.status as string;
    const isActive = status === 'active' || status === 'trialing';

    const subData = {
      stripeCustomerId: stripeSub.customer as string,
      stripeSubscriptionId: stripeSub.id as string,
      tierId: PREMIUM_TIER_ID,
      status,
      currentPeriodStart: new Date(periodStart * 1000),
      currentPeriodEnd: new Date(periodEnd * 1000),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end ?? false,
      renewalReminderSentAt: null,
    };

    await this.db.transaction(async (trx: Knex.Transaction) => {
      if (existingByUser) {
        await trx('subscriptions')
          .where('userId', userId)
          .update({ ...subData, updatedAt: new Date() });
      } else {
        await trx('subscriptions').insert({ userId, ...subData });
      }

      if (isActive) {
        await trx('users').where('id', userId).update({ tierId: PREMIUM_TIER_ID });
      }
    });
  }

  /** Extracts period from subscription. Stripe API 2025+ uses items.data[].current_period_* */
  private extractPeriodFromSubscription(stripeSub: Record<string, unknown>): {
    periodStart: number;
    periodEnd: number;
  } {
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
    return { periodStart, periodEnd };
  }

  /** Updates subscription period/status. Record must exist (from checkout). */
  private async handleSubscriptionUpdated(stripeSubRaw: Stripe.Subscription): Promise<void> {
    let stripeSub = stripeSubRaw as unknown as Record<string, unknown>;
    const existing = await this.subscriptionRepo.findByStripeSubscriptionId(stripeSub.id as string);
    if (!existing) return;

    // Webhook payload may not have items expanded; fetch with expand if needed
    try {
      this.extractPeriodFromSubscription(stripeSub);
    } catch {
      stripeSub = (await this.stripe!.subscriptions.retrieve(stripeSub.id as string, {
        expand: ['items.data'],
      })) as unknown as Record<string, unknown>;
    }
    const { periodStart, periodEnd } = this.extractPeriodFromSubscription(stripeSub);
    const status = stripeSub.status as string;
    const isActive = status === 'active' || status === 'trialing';

    await this.db.transaction(async (trx: Knex.Transaction) => {
      await trx('subscriptions')
        .where('id', existing.id)
        .update({
          status,
          currentPeriodStart: new Date(periodStart * 1000),
          currentPeriodEnd: new Date(periodEnd * 1000),
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end ?? false,
          updatedAt: new Date(),
        });

      if (isActive) {
        await trx('users').where('id', existing.userId).update({ tierId: PREMIUM_TIER_ID });
      } else {
        await trx('users').where('id', existing.userId).update({ tierId: FREE_TIER_ID });
      }
    });
  }

  private async handleSubscriptionDeleted(stripeSub: Stripe.Subscription): Promise<void> {
    const existing = await this.subscriptionRepo.findByStripeSubscriptionId(stripeSub.id);
    if (!existing) return;

    await this.db.transaction(async (trx: Knex.Transaction) => {
      await trx('subscriptions')
        .where('id', existing.id)
        .update({ status: 'canceled', updatedAt: new Date() });
      await trx('users').where('id', existing.userId).update({ tierId: FREE_TIER_ID });
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const subId = (invoice as Stripe.Invoice & { subscription?: string }).subscription;
    if (!subId || typeof subId !== 'string') return;

    const subscription = await this.subscriptionRepo.findByStripeSubscriptionId(subId);
    if (!subscription) return;

    const amountCents = invoice.amount_paid ?? 0;
    const paidAt = invoice.status_transitions?.paid_at
      ? new Date(invoice.status_transitions.paid_at * 1000)
      : new Date();

    const inv = invoice as Stripe.Invoice & { payment_intent?: string | { id?: string } };
    await this.paymentRepo.create({
      subscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId:
        typeof inv.payment_intent === 'string'
          ? inv.payment_intent
          : (inv.payment_intent?.id ?? null),
      amountCents,
      currency: invoice.currency ?? 'usd',
      status: 'succeeded',
      paidAt,
      metadata: { stripeInvoiceId: invoice.id },
    });
  }
}
