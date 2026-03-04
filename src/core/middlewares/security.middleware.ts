import cors from 'cors';
import type { Express, RequestHandler } from 'express';
import helmet from 'helmet';

import { env } from '@/config/env';

/**
 * Security middleware: Helmet (HTTP headers) + CORS.
 * Handles dev vs prod gracefully.
 */
export function securityMiddleware(app: Express): void {
  app.set('trust proxy', env.TRUST_PROXY ? 1 : 0);

  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: env.NODE_ENV === 'production',
    }),
  );

  const corsOptions: cors.CorsOptions = {
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      const allowed = env.FRONTEND_URL;
      if (!origin) return cb(null, true); // Same-origin or tools (e.g. Postman)
      if (env.NODE_ENV === 'development') {
        const devOrigins = [allowed, 'http://localhost:3000', 'http://127.0.0.1:3000'];
        if (devOrigins.some((o) => origin?.startsWith(o) || o === origin)) {
          return cb(null, true);
        }
      }
      if (origin === allowed) return cb(null, true);
      cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  app.use(cors(corsOptions) as RequestHandler);
}
