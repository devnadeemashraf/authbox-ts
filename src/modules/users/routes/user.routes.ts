import { type IRouter, Router } from 'express';
import { container } from 'tsyringe';

import { authGuard } from '@/core/middlewares';
import { UserController } from '@/modules/users/controllers/user.controller';

const userRouter: IRouter = Router();
const userController = container.resolve(UserController);

userRouter.get('/me', authGuard, userController.getMe);
userRouter.patch('/me', authGuard, userController.patchMe);

export { userRouter };
