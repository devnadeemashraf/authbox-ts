import express, { type Express } from 'express';

export function createApp(): Express {
  const app = express();

  // --- Trust proxy (from env.TRUST_PROXY) - required when behind NGINX/Traefik
  // TODO: app.set('trust proxy', env.TRUST_PROXY ? 1 : 0);

  // --- Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- CORS (configure allowed origins from env.FRONTEND_URL)
  // TODO: app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

  // --- Request logging (e.g. pino-http)
  // TODO: app.use(pinoHttp({ ... }));

  // --- tsyringe / DI container initialization
  // Must run before any controllers or routes that use @inject()
  // TODO: import 'reflect-metadata' at app entry (server.ts)
  // TODO: bootstrapDI() from core/di/ - register repositories, services, controllers

  // --- Health check (for load balancers / k8s probes)
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // --- Domain routes (auth, users, etc.)
  // TODO: app.use('/api/auth', authRouter);
  // TODO: app.use('/api/users', userRouter);

  // --- 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // --- Global error handler (must be last)
  // TODO: app.use(globalErrorHandler);

  return app;
}
