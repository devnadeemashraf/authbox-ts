import { type IRouter, Router } from 'express';

import { authGuard } from '@/core/middlewares';

const userRouter: IRouter = Router();

// Stub: GET /me returns 401 until UserController is implemented (authGuard blocks all)
userRouter.get('/me', authGuard(), (_req, res) => res.json({}));

export { userRouter };
