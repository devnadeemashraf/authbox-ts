import { type IRouter, Router } from 'express';
import { container } from 'tsyringe';

import { SubscriptionController } from '../controllers/subscription.controller';

import { authGuard } from '@/core/middlewares';

const subscriptionRouter: IRouter = Router();
const subscriptionController = container.resolve(SubscriptionController);

subscriptionRouter.post('/checkout', authGuard, subscriptionController.postCheckout);
subscriptionRouter.post('/confirm-session', authGuard, subscriptionController.postConfirmSession);
subscriptionRouter.get('/status', authGuard, subscriptionController.getStatus);

export { subscriptionRouter };
