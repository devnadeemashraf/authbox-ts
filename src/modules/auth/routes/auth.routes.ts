import { type IRouter, Router } from 'express';
import { container } from 'tsyringe';

import { authGuard, authStrictRateLimiter } from '@/core/middlewares';
import { AuthController } from '@/modules/auth/controllers/auth.controller';

const authRouter: IRouter = Router();
const authController = container.resolve(AuthController);

authRouter.post('/login', authStrictRateLimiter, authController.login);
authRouter.post('/register', authStrictRateLimiter, authController.register);
authRouter.post('/logout', authController.logout);
authRouter.post('/refresh', authController.refresh);

authRouter.get('/oauth/:provider/callback', authController.oauthCallback);
authRouter.get('/oauth/:provider', authController.oauthInitiate);

authRouter.post('/email/send-verification', authGuard, authController.sendVerificationOtp);
authRouter.post('/email/verify', authGuard, authController.verifyEmailOtp);

authRouter.post('/forgot-password', authStrictRateLimiter, authController.forgotPassword);
authRouter.post('/verify-reset-otp', authController.verifyPasswordResetOtp);
authRouter.post('/reset-password', authController.resetPassword);

authRouter.get('/sessions', authGuard, authController.listSessions);
authRouter.delete('/sessions', authGuard, authController.revokeAllSessions);
authRouter.delete('/sessions/:id', authGuard, authController.revokeSession);

export { authRouter };
