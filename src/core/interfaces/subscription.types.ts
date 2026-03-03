/**
 * Subscription status values from Stripe.
 * active = paid and current
 * past_due = payment failed, Stripe retrying
 * canceled = subscription ended
 * unpaid = final failure after retries
 */
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired';

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  tierId: number;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  renewalReminderSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentStatus = 'succeeded' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  subscriptionId: string;
  stripeInvoiceId: string | null;
  stripePaymentIntentId: string | null;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  paidAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}
