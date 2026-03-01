import 'dotenv/config';

import { bool, cleanEnv, num, port, str, url } from 'envalid';

/**
 * Environment variables validated at startup via envalid.
 *
 * CRUCIAL (required - app will fail fast if missing):
 * - JWT_SECRET, FRONTEND_URL, BACKEND_URL
 * - POSTGRES_PASSWORD (and other DB vars)
 * - REDIS_HOST (Redis is typically required for sessions)
 *
 * OPTIONAL (have defaults - app starts without them):
 * - Google OAuth: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (empty = provider disabled)
 * - Redis: REDIS_PASSWORD (empty = no auth, common for local dev)
 * - MinIO: MINIO_ROOT_USER, MINIO_ROOT_PASSWORD (only if using object storage)
 */
export const env = cleanEnv(process.env, {
  // ─── Application ─────────────────────────────────────────────────────────
  NODE_ENV: str({
    choices: ['development', 'testing', 'production'],
    default: 'development',
  }),

  PORT: port({ default: 3000 }),

  WEB_CONCURRENCY: num({
    default: 0,
    desc: 'Number of cluster workers; 0 = auto-detect CPU count. Set in production (usually = CPU cores).',
  }),

  RUN_WORKERS: bool({
    default: false,
    desc: 'When true, primary process spawns job workers alongside HTTP',
  }),

  // ─── Logging ─────────────────────────────────────────────────────────────
  LOG_LEVEL: str({
    choices: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'],
    default: 'warn',
  }),

  // ─── Security / JWT ───────────────────────────────────────────────────────
  /** REQUIRED - Generate with: openssl rand -base64 32 */
  JWT_SECRET: str({
    desc: 'JWT signing secret (REQUIRED)',
  }),

  JWT_EXPIRY: str({
    default: '7d',
  }),

  JWT_ISSUER: str({
    default: 'authbox-ts-api',
    desc: 'Strongly recommended in production',
  }),

  JWT_AUDIENCE: str({
    default: 'authbox-ts-client',
    desc: 'Strongly recommended in production',
  }),

  AUTH_COOKIE_NAME: str({
    default: 'authbox_ts_session',
  }),

  /** Must be HTTPS in production */
  FRONTEND_URL: url({
    desc: 'Frontend public URL',
  }),

  /** Must be HTTPS in production */
  BACKEND_URL: url({
    desc: 'Backend public URL',
  }),

  // ─── Google OAuth ────────────────────────────────────────────────────────
  /** Empty = Google OAuth disabled */
  GOOGLE_CLIENT_ID: str({ default: '' }),
  /** Empty = Google OAuth disabled */
  GOOGLE_CLIENT_SECRET: str({ default: '' }),

  // ─── PostgreSQL ──────────────────────────────────────────────────────────
  /** Use Docker service name if running via docker-compose */
  POSTGRES_HOST: str({ default: 'localhost' }),
  POSTGRES_PORT: port({ default: 5432 }),

  POSTGRES_USER: str({ default: 'authbox_admin' }),
  POSTGRES_PASSWORD: str({
    desc: 'REQUIRED - use strong password in production',
  }),
  POSTGRES_DATABASE: str({ default: 'authbox_db' }),

  /** In production, use verify-full if using managed DB */
  POSTGRES_SSL_MODE: str({
    choices: ['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full'],
    default: 'prefer',
  }),

  DATABASE_POOL_MIN: num({ default: 2 }),
  DATABASE_POOL_MAX: num({ default: 20 }),

  // ─── Redis ───────────────────────────────────────────────────────────────
  /** Use Docker service name if running via docker-compose */
  REDIS_HOST: str({ default: 'localhost' }),
  REDIS_PORT: port({ default: 6379 }),
  /** Empty = no auth (common for local Redis) */
  REDIS_PASSWORD: str({ default: '' }),

  // ─── MinIO Object Store ──────────────────────────────────────────────────
  MINIO_ROOT_USER: str({ default: 'authbox_admin' }),
  MINIO_ROOT_PASSWORD: str({ default: 'authbox_password' }),

  // ─── Hardening ───────────────────────────────────────────────────────────
  /** Set to true if behind a reverse proxy (NGINX, Traefik, etc.) */
  TRUST_PROXY: bool({ default: false }),

  /** Secure cookies (should be true in production) */
  COOKIE_SECURE: bool({ default: true }),

  COOKIE_SAME_SITE: str({
    choices: ['lax', 'strict', 'none'],
    default: 'lax',
  }),
});

export type Env = typeof env;

/**
 * Env keys that MUST be set before the app starts.
 * These have no default in cleanEnv; missing values cause immediate failure.
 */
export const CRUCIAL_ENV_KEYS = [
  'JWT_SECRET',
  'FRONTEND_URL',
  'BACKEND_URL',
  'POSTGRES_PASSWORD',
] as const;
