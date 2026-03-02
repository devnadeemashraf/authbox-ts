import express, { type Express } from 'express';

import { globalErrorHandler, requestIdMiddleware } from '@/core/middlewares';
import { notFound, ok } from '@/core/response';

export function createApp(): Express {
  const app = express();

  // --- Trust proxy (from env.TRUST_PROXY) - required when behind NGINX/Traefik
  // TODO: app.set('trust proxy', env.TRUST_PROXY ? 1 : 0);

  // --- Request ID (traceability for errors)
  app.use(requestIdMiddleware);

  // --- Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- CORS (configure allowed origins from env.FRONTEND_URL)
  // TODO: app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

  // --- Request logging (e.g. pino-http)
  // TODO: app.use(pinoHttp({ ... }));

  // --- tsyringe / DI container initialization
  // Must run before any controllers or routes that use @inject()
  // TODO: bootstrapDI() from core/di/ - register repositories, services, controllers

  // --- Health check (for load balancers / k8s probes)
  app.get('/health', (_req, res) => ok(res, { status: 'ok' }));

  // --- Domain routes (auth, users, etc.)
  // TODO: app.use('/api/auth', authRouter);
  // TODO: app.use('/api/users', userRouter);

  // --- 404 handler (use error format for consistency)
  app.use((_req, res) => notFound(res, res.locals?.requestId));

  // --- Global error handler (must be last)
  app.use(globalErrorHandler);

  return app;
}
