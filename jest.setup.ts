// Testing Setup Root File
// Set NODE_ENV before any config imports so knex/env use testing config
process.env.NODE_ENV = 'testing';

// Fallback env vars for CI or when .env is incomplete
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
process.env.FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';
process.env.BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3000';
process.env.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? 'test';

import 'reflect-metadata';

// Mock logger to avoid Pino transport/spawn keeping Jest open
const noop = () => {};
const loggerMock = {
  fatal: noop,
  error: noop,
  warn: noop,
  info: noop,
  debug: noop,
  trace: noop,
  child: () => loggerMock,
};
jest.mock('./src/core/logger', () => ({ logger: loggerMock }));

// Bootstrap DI before any test imports the app (which resolves AuthController, etc.)
import { bootstrapDI } from './src/core/di/container';
bootstrapDI();
