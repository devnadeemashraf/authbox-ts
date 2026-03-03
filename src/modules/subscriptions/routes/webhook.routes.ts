import express, { type IRouter, Router } from 'express';
import { container } from 'tsyringe';

import { StripeWebhookController } from '../controllers/stripe-webhook.controller';

/**
 * Webhook routes. Must use raw body for Stripe signature verification.
 * Mount BEFORE express.json() or use express.raw() for this path only.
 */
const webhookRouter: IRouter = Router();
const webhookController = container.resolve(StripeWebhookController);

webhookRouter.post(
  '/stripe',
  express.raw({ type: ['application/json', 'application/json; charset=utf-8'] }),
  (req, res, next) => {
    webhookController.handle(req, res).catch(next);
  },
);

export { webhookRouter };
