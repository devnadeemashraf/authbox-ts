import { getTestApp } from './app';

import { signAccessToken } from '@/core/security/jwt';

describe('Test setup', () => {
  it('getTestApp returns supertest agent', () => {
    const agent = getTestApp();
    expect(agent.get).toBeDefined();
    expect(agent.post).toBeDefined();
  });

  it('health endpoint returns 200', async () => {
    const res = await getTestApp().get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { status: 'ok' } });
  });

  it('GET /api/v1/users/me returns 401 when no token', async () => {
    const res = await getTestApp().get('/api/v1/users/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toBe('Authentication required');
  });

  it('GET /api/v1/users/me returns 200 with valid Bearer token', async () => {
    const token = signAccessToken({
      sub: 'user-123',
      email: 'test@example.com',
      permissions: 1,
      tierId: 1,
      jti: 'session-123',
    });
    const res = await getTestApp().get('/api/v1/users/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('unmatched API route returns 404', async () => {
    const res = await getTestApp().get('/api/v1/auth/nonexistent');
    expect(res.status).toBe(404);
  });
});
