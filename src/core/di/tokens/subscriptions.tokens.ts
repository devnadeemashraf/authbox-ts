/**
 * Subscriptions-module tokens.
 */
export const SubscriptionsTokens = {
  SubscriptionRepository: Symbol('authbox.subscriptions.SubscriptionRepository'),
  PaymentRepository: Symbol('authbox.subscriptions.PaymentRepository'),
  ProcessedStripeEventRepository: Symbol('authbox.subscriptions.ProcessedStripeEventRepository'),
  CreateCheckoutSessionService: Symbol('authbox.subscriptions.CreateCheckoutSessionService'),
  ConfirmCheckoutSessionService: Symbol('authbox.subscriptions.ConfirmCheckoutSessionService'),
  HandleStripeWebhookService: Symbol('authbox.subscriptions.HandleStripeWebhookService'),
  GetSubscriptionStatusService: Symbol('authbox.subscriptions.GetSubscriptionStatusService'),
} as const;
