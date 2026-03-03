import type { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { confirmCheckoutSessionSchema } from '../schemas/subscription.schemas';
import type { ConfirmCheckoutSessionService } from '../services/confirm-checkout-session.service';
import type { CreateCheckoutSessionService } from '../services/create-checkout-session.service';
import type { GetSubscriptionStatusService } from '../services/get-subscription-status.service';

import { BaseController } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import { created, ok } from '@/core/response';
import { validateWithZod } from '@/core/validation';

@injectable()
export class SubscriptionController extends BaseController {
  constructor(
    @inject(Tokens.Subscriptions.CreateCheckoutSessionService)
    private readonly createCheckoutSession: CreateCheckoutSessionService,
    @inject(Tokens.Subscriptions.ConfirmCheckoutSessionService)
    private readonly confirmCheckoutSession: ConfirmCheckoutSessionService,
    @inject(Tokens.Subscriptions.GetSubscriptionStatusService)
    private readonly getSubscriptionStatus: GetSubscriptionStatusService,
  ) {
    super();
  }

  postCheckout = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const result = await this.createCheckoutSession.execute(userId);
    created(res, result);
  });

  postConfirmSession = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const { sessionId } = validateWithZod(confirmCheckoutSessionSchema, req.body);
    const result = await this.confirmCheckoutSession.execute(userId, sessionId);
    ok(res, result);
  });

  getStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const result = await this.getSubscriptionStatus.execute(userId);
    ok(res, result);
  });
}
