import express, { type Express } from 'express';

import {
  authGuard,
  globalErrorHandler,
  requestIdMiddleware,
  securityMiddleware,
  tierRateLimiter,
} from '@/core/middlewares';
import { notFound, ok } from '@/core/response';
import { mountDocs } from '@/infrastructure/docs/docs.routes';
import { authRouter } from '@/modules/auth/routes/auth.routes';
import { subscriptionRouter } from '@/modules/subscriptions/routes/subscription.routes';
import { webhookRouter } from '@/modules/subscriptions/routes/webhook.routes';
import { userRouter } from '@/modules/users/routes/user.routes';

export function createApp(): Express {
  const app = express();

  // --- Trust proxy, Helmet (security headers), CORS (dev/prod aware)
  securityMiddleware(app);

  // --- Request ID (traceability for errors)
  app.use(requestIdMiddleware);

  // --- Webhook route MUST use raw body (before express.json) for Stripe signature verification
  app.use('/api/v1/webhooks', webhookRouter);

  // --- Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- Request logging (e.g. pino-http)
  // TODO: app.use(pinoHttp({ ... }));

  // --- tsyringe / DI container initialization
  // Must run before any controllers or routes that use @inject()
  // bootstrapDI() is called in bootstrapInfrastructure() before createApp()

  // --- Health check (for load balancers / k8s probes)
  app.get('/health', (_req, res) => ok(res, { status: 'ok' }));

  // --- API docs (Swagger UI at /docs)
  mountDocs(app);

  // --- API v1 routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', authGuard, tierRateLimiter, userRouter);
  app.use('/api/v1/subscriptions', authGuard, tierRateLimiter, subscriptionRouter);

  // --- 404 handler (use error format for consistency)
  app.use((_req, res) => notFound(res, res.locals?.requestId));

  // --- Global error handler (must be last)
  app.use(globalErrorHandler);

  return app;
}
