import type { DependencyContainer } from 'tsyringe';

import { Tokens } from '../tokens';

import { PaymentRepository } from '@/modules/subscriptions/repositories/payment.repository';
import { ProcessedStripeEventRepository } from '@/modules/subscriptions/repositories/processed-stripe-event.repository';
import { SubscriptionRepository } from '@/modules/subscriptions/repositories/subscription.repository';
import { ConfirmCheckoutSessionService } from '@/modules/subscriptions/services/confirm-checkout-session.service';
import { CreateCheckoutSessionService } from '@/modules/subscriptions/services/create-checkout-session.service';
import { GetSubscriptionStatusService } from '@/modules/subscriptions/services/get-subscription-status.service';
import { HandleStripeWebhookService } from '@/modules/subscriptions/services/handle-stripe-webhook.service';

/**
 * Registers subscriptions-module dependencies with the container.
 */
export function registerSubscriptionsBindings(container: DependencyContainer): void {
  container.register(Tokens.Subscriptions.SubscriptionRepository, {
    useClass: SubscriptionRepository,
  });
  container.register(Tokens.Subscriptions.PaymentRepository, {
    useClass: PaymentRepository,
  });
  container.register(Tokens.Subscriptions.ProcessedStripeEventRepository, {
    useClass: ProcessedStripeEventRepository,
  });
  container.register(Tokens.Subscriptions.CreateCheckoutSessionService, {
    useClass: CreateCheckoutSessionService,
  });
  container.register(Tokens.Subscriptions.ConfirmCheckoutSessionService, {
    useClass: ConfirmCheckoutSessionService,
  });
  container.register(Tokens.Subscriptions.HandleStripeWebhookService, {
    useClass: HandleStripeWebhookService,
  });
  container.register(Tokens.Subscriptions.GetSubscriptionStatusService, {
    useClass: GetSubscriptionStatusService,
  });
}
