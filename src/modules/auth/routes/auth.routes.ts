import { type IRouter, Router } from 'express';
import { container } from 'tsyringe';

import { AuthController } from '@/modules/auth/controllers/auth.controller';

const authRouter: IRouter = Router();
const authController = container.resolve(AuthController);

authRouter.post('/register', authController.register);

export { authRouter };
