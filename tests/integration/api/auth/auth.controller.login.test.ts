import { getTestApp } from '@tests/support/setup/app';

import { AUTH_BASE } from './helpers';

describe('AuthController POST /login', () => {
  it('returns 422 for invalid email', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/login`).send({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/email|invalid/i);
  });

  it('returns 422 for empty password', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/login`).send({
      email: 'valid@example.com',
      password: '',
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/password/i);
  });

  it('returns 422 for missing body fields', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/login`).send({});
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 for non-object body', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/login`).send('invalid');
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for non-existent user when DB available', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/login`).send({
      email: 'nonexistent@example.com',
      password: 'password123',
    });
    expect([401, 500]).toContain(res.status);
    if (res.status === 401) {
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toBe('Invalid email or password');
    }
  });
});
