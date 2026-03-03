import type { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import type { HandleStripeWebhookService } from '../services/handle-stripe-webhook.service';

import { Tokens } from '@/core/di/tokens';
import { logger } from '@/core/logger';
import { ok } from '@/core/response';

/**
 * Handles Stripe webhooks. Expects raw body (Buffer) in req.body.
 * Mount this route with express.raw({ type: 'application/json' }).
 */
@injectable()
export class StripeWebhookController {
  constructor(
    @inject(Tokens.Subscriptions.HandleStripeWebhookService)
    private readonly handleWebhook: HandleStripeWebhookService,
  ) {}

  handle = async (req: Request, res: Response): Promise<void> => {
    const rawBody = req.body as Buffer | undefined;
    const signature = req.headers['stripe-signature'] as string | undefined;

    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      logger.warn(
        { hasBody: !!req.body, bodyType: typeof req.body },
        'Stripe webhook received without valid raw body - ensure route uses express.raw() before express.json()',
      );
      res.status(400).json({ error: 'Invalid webhook body' });
      return;
    }

    if (!signature) {
      res.status(400).json({ error: 'Missing Stripe-Signature header' });
      return;
    }

    try {
      await this.handleWebhook.execute(rawBody, signature);
      ok(res, { received: true });
    } catch (err) {
      throw err;
    }
  };
}
