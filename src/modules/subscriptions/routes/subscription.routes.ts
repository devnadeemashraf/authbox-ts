import { type IRouter, Router } from 'express';
import { container } from 'tsyringe';

import { SubscriptionController } from '../controllers/subscription.controller';

const subscriptionRouter: IRouter = Router();
const subscriptionController = container.resolve(SubscriptionController);

subscriptionRouter.post('/checkout', subscriptionController.postCheckout);
subscriptionRouter.post('/confirm-session', subscriptionController.postConfirmSession);
subscriptionRouter.get('/status', subscriptionController.getStatus);

export { subscriptionRouter };
