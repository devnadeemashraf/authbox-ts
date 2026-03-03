import { getTestApp } from './app';

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

  it('GET /api/v1/users/me returns 401 (authGuard stub)', async () => {
    const res = await getTestApp().get('/api/v1/users/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toBe('Authentication required');
  });

  it('unmatched API route returns 404', async () => {
    const res = await getTestApp().get('/api/v1/auth/nonexistent');
    expect(res.status).toBe(404);
  });
});
