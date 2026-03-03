import express, { type Express } from 'express';

import { globalErrorHandler, requestIdMiddleware } from '@/core/middlewares';
import { notFound, ok } from '@/core/response';
import { mountDocs } from '@/infrastructure/docs/docs.routes';
import { authRouter } from '@/modules/auth/routes/auth.routes';
import { userRouter } from '@/modules/users/routes/user.routes';

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
  // bootstrapDI() is called in bootstrapInfrastructure() before createApp()

  // --- Health check (for load balancers / k8s probes)
  app.get('/health', (_req, res) => ok(res, { status: 'ok' }));

  // --- API docs (Swagger UI at /docs)
  mountDocs(app);

  // --- API v1 routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', userRouter);

  // --- 404 handler (use error format for consistency)
  app.use((_req, res) => notFound(res, res.locals?.requestId));

  // --- Global error handler (must be last)
  app.use(globalErrorHandler);

  return app;
}
