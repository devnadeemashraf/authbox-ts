import request from 'supertest';

import { createApp } from '@/app';

/**
 * Returns a supertest agent for the Express app.
 * Use for integration tests that hit HTTP endpoints.
 *
 * @example
 * const agent = getTestApp();
 * const res = await agent.get('/health');
 * expect(res.status).toBe(200);
 */
export function getTestApp() {
  const app = createApp();
  return request(app);
}
