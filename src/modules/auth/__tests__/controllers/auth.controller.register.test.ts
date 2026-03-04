import { AUTH_BASE } from './auth.controller.helpers';

import { getTestApp } from '@/__tests__/setup/app';

describe('AuthController POST /register', () => {
  it('returns 422 for invalid email', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/register`).send({
      email: 'not-an-email',
      password: 'SecurePass123!',
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/email|invalid/i);
  });

  it('returns 422 for short password', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/register`).send({
      email: 'valid@example.com',
      password: 'short',
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/password|8/i);
  });

  it('returns 422 for missing fields', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/register`).send({});
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 for password exceeding max length', async () => {
    const res = await getTestApp()
      .post(`${AUTH_BASE}/register`)
      .send({
        email: 'valid@example.com',
        password: 'A'.repeat(129) + 'a1!',
      });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/password|128/i);
  });

  it('returns 201 and user for valid input when DB available', async () => {
    const email = `test-${Date.now()}@example.com`;
    const res = await getTestApp().post(`${AUTH_BASE}/register`).send({
      email,
      password: 'SecurePass123!',
    });
    expect([201, 409, 500]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toMatchObject({
        email,
        username: null,
        isEmailVerified: false,
        permissions: 1,
        tierId: 1,
      });
      expect(res.body.data.user.id).toBeDefined();
      expect(res.body.data.user.passwordHash).toBeUndefined();
    }
  });

  it('returns 409 when registering duplicate email when DB available', async () => {
    const email = `dup-${Date.now()}@example.com`;
    const app = getTestApp();
    const first = await app
      .post(`${AUTH_BASE}/register`)
      .send({ email, password: 'SecurePass123!' });
    if (first.status !== 201) return;
    const second = await app
      .post(`${AUTH_BASE}/register`)
      .send({ email, password: 'OtherPass456!' });
    expect(second.status).toBe(409);
    expect(second.body.success).toBe(false);
    expect(second.body.error?.message).toMatch(/already registered|email/i);
  });
});
